/**
 * Stacker Module
 * Handles image integration with outlier rejection
 */

class Stacker {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
    }

    /**
     * Normalize frames to similar brightness levels
     */
    normalizeFrames(frames) {
        console.log('Normalizing frames...');
        
        const normalized = frames.map(frame => {
            // Calculate mean brightness
            const data = frame.data.data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += data[i + 1]; // Green channel
            }
            const mean = sum / (data.length / 4);
            
            // Create normalized copy
            const normalizedData = new Uint8ClampedArray(data.length);
            const scale = 128 / mean; // Target mean of 128
            
            for (let i = 0; i < data.length; i += 4) {
                normalizedData[i] = Math.min(255, data[i] * scale);
                normalizedData[i + 1] = Math.min(255, data[i + 1] * scale);
                normalizedData[i + 2] = Math.min(255, data[i + 2] * scale);
                normalizedData[i + 3] = data[i + 3];
            }
            
            return {
                image: frame.image,
                data: new ImageData(normalizedData, frame.width, frame.height),
                width: frame.width,
                height: frame.height,
                scale: scale,
                originalMean: mean
            };
        });
        
        console.log(`Normalized ${normalized.length} frames`);
        return normalized;
    }

    /**
     * Sigma clipping rejection
     */
    sigmaClip(values, sigma) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        
        // Calculate median
        const median = n % 2 === 0
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2
            : sorted[Math.floor(n/2)];
        
        // Calculate standard deviation (robust using MAD)
        const absDevs = sorted.map(v => Math.abs(v - median));
        absDevs.sort((a, b) => a - b);
        const mad = absDevs[Math.floor(absDevs.length / 2)];
        const stdDev = mad * 1.4826; // Convert MAD to std dev equivalent
        
        if (stdDev === 0) return median;
        
        // Clip values outside sigma * stdDev
        const filtered = values.filter(v => Math.abs(v - median) < sigma * stdDev);
        
        if (filtered.length === 0) return median;
        
        // Return mean of remaining values
        return filtered.reduce((a, b) => a + b, 0) / filtered.length;
    }

    /**
     * Stack frames using specified method
     */
    stackFrames(frames, method = 'median', sigma = 3) {
        if (frames.length === 0) {
            throw new Error('No frames to stack');
        }

        console.log(`Stacking ${frames.length} frames using ${method}...`);
        
        const width = frames[0].width;
        const height = frames[0].height;
        const pixelCount = width * height;
        
        // Create output
        const outputData = new Uint8ClampedArray(pixelCount * 4);
        const weightMap = new Float32Array(pixelCount);
        
        // Collect pixel values for each position
        for (let i = 0; i < pixelCount; i++) {
            const pixelValues = frames.map(f => {
                const idx = i * 4;
                // Use green channel as primary
                return f.data.data[idx + 1];
            });

            let result;
            
            switch (method) {
                case 'median':
                    result = this.median(pixelValues);
                    break;
                    
                case 'average':
                    result = this.mean(pixelValues);
                    break;
                    
                case 'sigma-clipping':
                    result = this.sigmaClip(pixelValues, sigma);
                    break;
                    
                default:
                    result = this.median(pixelValues);
            }
            
            const idx = i * 4;
            outputData[idx] = result;
            outputData[idx + 1] = result;
            outputData[idx + 2] = result;
            outputData[idx + 3] = 255;
            
            // Calculate weight (inverse of variance)
            const mean = pixelValues.reduce((a, b) => a + b, 0) / pixelValues.length;
            const variance = pixelValues.reduce((a, v) => a + (v - mean) ** 2, 0) / pixelValues.length;
            weightMap[i] = variance > 0 ? 1 / variance : 1;
        }
        
        console.log('Stacking complete');
        
        return {
            stacked: new ImageData(outputData, width, height),
            width: width,
            height: height,
            frameCount: frames.length,
            method: method,
            weightMap: weightMap
        };
    }

    /**
     * Median of values
     */
    median(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;
        return n % 2 === 0
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2
            : sorted[Math.floor(n/2)];
    }

    /**
     * Mean of values
     */
    mean(values) {
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Minimum rejection (min stacking)
     */
    minRejection(values) {
        return Math.min(...values);
    }

    /**
     * Maximum rejection (max stacking)
     */
    maxRejection(values) {
        return Math.max(...values);
    }

    /**
     * Average with min/max rejection
     */
    avgMinMaxRejection(values, minPixels = 1, maxPixels = 1) {
        const sorted = [...values].sort((a, b) => a - b);
        const trimmed = sorted.slice(minPixels, sorted.length - maxPixels);
        
        if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)];
        
        return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }

    /**
     * Create a rejection map showing where outliers were detected
     */
    createRejectionMap(frames, sigma = 3) {
        if (frames.length < 3) {
            return null;
        }

        const width = frames[0].width;
        const height = frames[0].height;
        const pixelCount = width * height;
        
        const rejectionMap = new Uint8ClampedArray(pixelCount * 4);
        
        for (let i = 0; i < pixelCount; i++) {
            const pixelValues = frames.map(f => f.data.data[i * 4 + 1]);
            const median = this.median(pixelValues);
            const stdDev = this.robustStdDev(pixelValues, median);
            
            let rejectionCount = 0;
            for (const v of pixelValues) {
                if (Math.abs(v - median) > sigma * stdDev) {
                    rejectionCount++;
                }
            }
            
            const rejectionRatio = rejectionCount / pixelValues.length;
            const intensity = Math.min(255, rejectionRatio * 255 * 5);
            
            const idx = i * 4;
            rejectionMap[idx] = 255 - intensity;
            rejectionMap[idx + 1] = 0;
            rejectionMap[idx + 2] = 0;
            rejectionMap[idx + 3] = 255;
        }
        
        return new ImageData(rejectionMap, width, height);
    }

    /**
     * Robust standard deviation using MAD
     */
    robustStdDev(values, median) {
        const absDevs = values.map(v => Math.abs(v - median));
        absDevs.sort((a, b) => a - b);
        const mad = absDevs[Math.floor(absDevs.length / 2)];
        return mad * 1.4826;
    }

    /**
     * Create weight map based on frame quality
     */
    createWeightMap(frames) {
        const weights = frames.map(frame => {
            const data = frame.data.data;
            let sum = 0;
            let sumSq = 0;
            let count = 0;
            
            // Sample pixels for performance
            const step = Math.max(1, Math.floor(data.length / 40000));
            
            for (let i = 0; i < data.length; i += 4 * step) {
                const v = data[i + 1];
                sum += v;
                sumSq += v * v;
                count++;
            }
            
            const mean = sum / count;
            const stdDev = Math.sqrt(sumSq / count - mean * mean);
            
            // Higher weight for lower noise (std dev)
            return 1 / (stdDev + 1);
        });
        
        // Normalize weights
        const sum = weights.reduce((a, b) => a + b, 0);
        return weights.map(w => w / sum);
    }

    /**
     * Weighted stack combining frames with weights
     */
    weightedStack(frames, weights) {
        if (frames.length !== weights.length) {
            throw new Error('Frame count must match weight count');
        }

        const width = frames[0].width;
        const height = frames[0].height;
        const pixelCount = width * height;
        
        const outputData = new Uint8ClampedArray(pixelCount * 4);
        
        for (let i = 0; i < pixelCount; i++) {
            let weightedSum = 0;
            let weightSum = 0;
            
            for (let f = 0; f < frames.length; f++) {
                const idx = i * 4;
                const pixelVal = frames[f].data.data[idx + 1];
                weightedSum += pixelVal * weights[f];
                weightSum += weights[f];
            }
            
            const result = weightSum > 0 ? weightedSum / weightSum : 0;
            const oIdx = i * 4;
            outputData[oIdx] = result;
            outputData[oIdx + 1] = result;
            outputData[oIdx + 2] = result;
            outputData[oIdx + 3] = 255;
        }
        
        return new ImageData(outputData, width, height);
    }

    /**
     * Get stacking statistics
     */
    getStackStats(frames, stacked) {
        const inputStats = frames.map(f => {
            const data = f.data.data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += data[i + 1];
            }
            const mean = sum / (data.length / 4);
            
            let min = 255, max = 0;
            for (let i = 0; i < data.length; i += 4) {
                const v = data[i + 1];
                if (v < min) min = v;
                if (v > max) max = v;
            }
            
            return { mean, min, max, contrast: max - min };
        });
        
        const stackedData = stacked.data;
        let sum = 0, min = 255, max = 0;
        for (let i = 0; i < stackedData.length; i += 4) {
            const v = stackedData[i + 1];
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const mean = sum / (stackedData.length / 4);
        
        return {
            inputFrames: inputStats.length,
            inputMean: inputStats.reduce((a, s) => a + s.mean, 0) / inputStats.length,
            inputSNR: inputStats.reduce((a, s) => a + s.mean / (s.contrast || 1), 0) / inputStats.length,
            outputMean: mean,
            outputMin: min,
            outputMax: max,
            outputContrast: max - min,
            snrImprovement: (mean / (max - min || 1)) / (inputStats.reduce((a, s) => a + s.mean / (s.contrast || 1), 0) / inputStats.length || 1)
        };
    }
}

// Export for use
window.Stacker = Stacker;
