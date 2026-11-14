/**
 * Color Correction Module
 * Handles background/gradient correction, color calibration, and stretching
 */

class ColorCorrector {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
    }

    /**
     * Remove background gradient using polynomial surface fit
     */
    removeGradientPolynomial(imageData, degree = 2) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        
        // Sample points for fitting (use edge regions)
        const samples = [];
        const step = Math.max(1, Math.floor(Math.min(width, height) / 30));
        
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                // Only sample from edges (background regions)
                const distFromEdge = Math.min(x, y, width - x - 1, height - y - 1);
                if (distFromEdge < step * 3) {
                    const idx = (y * width + x) * 4;
                    samples.push({
                        x: x / width,
                        y: y / height,
                        value: pixels[idx + 1] // Green channel
                    });
                }
            }
        }
        
        if (samples.length < 10) {
            return imageData; // Not enough samples
        }
        
        // Fit polynomial surface
        const coeffs = this.fitPolynomial(samples, degree);
        
        // Subtract fitted surface
        const outputData = new Uint8ClampedArray(pixels.length);
        outputData.set(pixels);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x / width;
                const ny = y / height;
                
                let surfaceValue = 0;
                let termX = 1, termY = 1;
                
                for (let d = 0; d <= degree; d++) {
                    for (let e = 0; e <= d; e++) {
                        const idx = this.polyIndex(d, e);
                        if (coeffs[idx] !== undefined) {
                            surfaceValue += coeffs[idx] * termX * termY;
                        }
                        termX *= nx;
                        termY *= ny;
                    }
                }
                
                const pixelIdx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    outputData[pixelIdx + c] = Math.max(0, pixels[pixelIdx + c] - surfaceValue);
                }
            }
        }
        
        return new ImageData(outputData, width, height);
    }

    /**
     * Fit polynomial to sample points
     */
    fitPolynomial(samples, degree) {
        // Simple least squares fit for low degree polynomials
        // For degree 1: a + bx + cy
        // For degree 2: a + bx + cy + dx^2 + exy + fy^2
        
        const n = samples.length;
        const numTerms = (degree + 1) * (degree + 2) / 2;
        
        // Build matrix
        const A = [];
        const b = [];
        
        for (const s of samples) {
            const row = [];
            let termX = 1, termY = 1;
            
            for (let d = 0; d <= degree; d++) {
                for (let e = 0; e <= d; e++) {
                    row.push(termX * termY);
                    termX *= s.x;
                    termY *= s.y;
                }
            }
            
            A.push(row);
            b.push(s.value);
        }
        
        // Solve using simple QR or just use simpler approach for low degrees
        if (degree === 1) {
            return this.solveLinear2D(samples);
        } else if (degree === 2) {
            return this.solveQuadratic2D(samples);
        }
        
        return this.solveLinear2D(samples);
    }

    /**
     * Solve linear fit: value = a + bx + cy
     */
    solveLinear2D(samples) {
        let sumX = 0, sumY = 0, sumV = 0;
        let sumXX = 0, sumYY = 0, sumXY = 0;
        let sumXV = 0, sumYV = 0;
        const n = samples.length;
        
        for (const s of samples) {
            sumX += s.x;
            sumY += s.y;
            sumV += s.value;
            sumXX += s.x * s.x;
            sumYY += s.y * s.y;
            sumXY += s.x * s.y;
            sumXV += s.x * s.value;
            sumYV += s.y * s.value;
        }
        
        // Solve 3x3 system using Cramer's rule
        const det = n * (sumXX * sumYY - sumXY * sumXY)
                  - sumX * (sumX * sumYY - sumXY * sumY)
                  + sumY * (sumX * sumXY - sumXX * sumY);
        
        if (Math.abs(det) < 1e-10) {
            return { 0: sumV / n, 1: 0, 2: 0 };
        }
        
        const a = (sumV * (sumXX * sumYY - sumXY * sumXY)
                 - sumX * (sumXV * sumYY - sumXY * sumYV)
                 + sumY * (sumXV * sumXY - sumXX * sumYV)) / det;
        
        const b = (n * (sumXV * sumYY - sumXY * sumYV)
                 - sumV * (sumX * sumYY - sumXY * sumY)
                 + sumY * (sumX * sumYV - sumXV * sumY)) / det;
        
        const c = (n * (sumXX * sumYV - sumXV * sumXY)
                 - sumX * (sumX * sumYV - sumXV * sumY)
                 + sumV * (sumX * sumXY - sumXX * sumY)) / det;
        
        return { 0: a, 1: b, 2: c };
    }

    /**
     * Solve quadratic fit (simplified)
     */
    solveQuadratic2D(samples) {
        // For simplicity, solve linear first then add quadratic terms
        const linear = this.solveLinear2D(samples);
        
        // Calculate residuals
        const residuals = samples.map(s => ({
            x: s.x,
            y: s.y,
            value: s.value - (linear[0] + linear[1] * s.x + linear[2] * s.y)
        }));
        
        // Fit quadratic to residuals
        const quad = this.solveLinear2D(residuals);
        
        return {
            0: linear[0],
            1: linear[1],
            2: linear[2],
            3: quad[1],  // x^2
            4: quad[2],  // xy
            5: quad[0]   // y^2
        };
    }

    /**
     * Convert polynomial index to (degree, exponentX)
     */
    polyIndex(d, e) {
        // Index for term x^e * y^(d-e)
        let idx = 0;
        for (let i = 0; i < d; i++) {
            idx += i + 1;
        }
        idx += e;
        return idx;
    }

    /**
     * Simple rolling ball background subtraction
     */
    rollingBallSubtract(imageData, radius = 50) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        
        // Create blurred version (background estimate)
        const blurred = this.blur(imageData, radius);
        
        // Subtract
        const outputData = new Uint8ClampedArray(pixels.length);
        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                outputData[i + c] = Math.max(0, pixels[i + c] - blurred.data[i + c] + 128);
            }
            outputData[i + 3] = 255;
        }
        
        return new ImageData(outputData, width, height);
    }

    /**
     * Simple box blur
     */
    blur(imageData, radius) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        
        const kernelSize = Math.max(1, radius * 2 + 1);
        const kernel = new Float32Array(kernelSize);
        for (let i = 0; i < kernelSize; i++) {
            kernel[i] = 1;
        }
        const kernelSum = kernel.reduce((a, b) => a + b, 0);
        
        const outputData = new Uint8ClampedArray(pixels.length);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const px = x + kx;
                        const py = y + ky;
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const idx = (py * width + px) * 4;
                            r += pixels[idx] * kernel[ky + radius] * kernel[kx + radius];
                            g += pixels[idx + 1] * kernel[ky + radius] * kernel[kx + radius];
                            b += pixels[idx + 2] * kernel[ky + radius] * kernel[kx + radius];
                            count += kernel[ky + radius] * kernel[kx + radius];
                        }
                    }
                }
                
                const idx = (y * width + x) * 4;
                outputData[idx] = r / count;
                outputData[idx + 1] = g / count;
                outputData[idx + 2] = b / count;
                outputData[idx + 3] = 255;
            }
        }
        
        return new ImageData(outputData, width, height);
    }

    /**
     * Apply histogram stretch
     */
    histogramStretch(imageData, blackPoint = 0, whitePoint = 65535, gamma = 1.0) {
        const data = imageData.data;
        const scale = 65535 / 255;
        
        for (let i = 0; i < data.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let value = data[i + c] * scale;
                
                // Apply black point
                value = Math.max(0, value - blackPoint);
                
                // Apply white point
                value = Math.min(65535, value);
                value = (value / Math.max(1, whitePoint)) * 65535;
                
                // Apply gamma
                value = Math.pow(value / 65535, 1 / gamma) * 65535;
                
                // Convert back to 8-bit
                data[i + c] = Math.max(0, Math.min(255, value / scale));
            }
        }
        
        return imageData;
    }

    /**
     * Automatic stretch based on image statistics
     */
    autoStretch(imageData, percentileLow = 0.01, percentileHigh = 0.99) {
        const data = imageData.data;
        const values = [];
        
        // Collect green channel values
        for (let i = 0; i < data.length; i += 4) {
            values.push(data[i + 1]);
        }
        
        values.sort((a, b) => a - b);
        
        const lowIndex = Math.floor(values.length * percentileLow);
        const highIndex = Math.floor(values.length * percentileHigh);
        
        const blackPoint = values[lowIndex] * (65535 / 255);
        const whitePoint = values[Math.min(highIndex, values.length - 1)] * (65535 / 255);
        
        return this.histogramStretch(imageData, blackPoint, whitePoint, 1.0);
    }

    /**
     * Color balance (white balance)
     */
    colorBalance(imageData, rGain = 1.0, gGain = 1.0, bGain = 1.0) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * rGain);
            data[i + 1] = Math.min(255, data[i + 1] * gGain);
            data[i + 2] = Math.min(255, data[i + 2] * bGain);
        }
        
        return imageData;
    }

    /**
     * Calculate color balance from white area
     */
    calculateWhiteBalance(imageData, sampleRegions = []) {
        if (sampleRegions.length === 0) {
            // Use bright stars as white reference
            return { rGain: 1.0, gGain: 1.0, bGain: 1.0 };
        }
        
        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;
        
        for (const region of sampleRegions) {
            for (let y = region.y; y < region.y + region.height && y < imageData.height; y++) {
                for (let x = region.x; x < region.x + region.width && x < imageData.width; x++) {
                    const idx = (y * imageData.width + x) * 4;
                    rSum += imageData.data[idx];
                    gSum += imageData.data[idx + 1];
                    bSum += imageData.data[idx + 2];
                    count++;
                }
            }
        }
        
        if (count === 0) {
            return { rGain: 1.0, gGain: 1.0, bGain: 1.0 };
        }
        
        const rMean = rSum / count;
        const gMean = gSum / count;
        const bMean = bSum / count;
        
        const gAvg = (rMean + gMean + bMean) / 3;
        
        return {
            rGain: gAvg / (rMean || 1),
            gGain: gAvg / (gMean || 1),
            bGain: gAvg / (bMean || 1)
        };
    }

    /**
     * Apply simple saturation/vibrance
     */
    vibrance(imageData, amount = 0) {
        const data = imageData.data;
        const factor = amount / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            data[i] += (data[i] - avg) * factor;
            data[i + 1] += (data[i + 1] - avg) * factor;
            data[i + 2] += (data[i + 2] - avg) * factor;
        }
        
        return imageData;
    }

    /**
     * Convert to RGB (from grayscale if needed)
     */
    toRGB(imageData) {
        // If already has color, just return
        // For grayscale images, could apply color mappings here
        return imageData;
    }

    /**
     * Apply log stretch (good for faint details)
     */
    logStretch(imageData, gain = 1.0) {
        const data = imageData.data;
        const scale = 255 / Math.log(1 + 255);
        
        for (let i = 0; i < data.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                data[i + c] = Math.log(1 + data[i + c]) * scale * gain;
            }
        }
        
        return imageData;
    }

    /**
     * Power-law (gamma) stretch
     */
    powerStretch(imageData, gamma = 0.5) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                data[i + c] = Math.pow(data[i + c] / 255, gamma) * 255;
            }
        }
        
        return imageData;
    }

    /**
     * Equalize histogram (contrast enhancement)
     */
    equalizeHistogram(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        
        // Build histogram for green channel
        const histogram = new Uint32Array(256);
        for (let i = 0; i < pixels.length; i += 4) {
            histogram[pixels[i + 1]]++;
        }
        
        // Calculate CDF
        const cdf = new Float32Array(256);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
            cdf[i] = cdf[i - 1] + histogram[i];
        }
        
        const total = width * height;
        const cdfMin = cdf.find(v => v > 0) || 0;
        
        // Create lookup table
        const lut = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            lut[i] = Math.min(255, Math.round((cdf[i] - cdfMin) / (total - cdfMin) * 255));
        }
        
        // Apply LUT
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = lut[pixels[i]];
            pixels[i + 1] = lut[pixels[i + 1]];
            pixels[i + 2] = lut[pixels[i + 2]];
        }
        
        return imageData;
    }
}

// Export for use
window.ColorCorrector = ColorCorrector;
