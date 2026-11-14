/**
 * Image Processor Module
 * Core image processing functionality using Canvas API
 */

class ImageProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.imageData = null;
        this.width = 0;
        this.height = 0;
    }

    /**
     * Initialize processor with a canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        return this;
    }

    /**
     * Load image from file
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.width = img.width;
                this.height = img.height;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.ctx.drawImage(img, 0, 0);
                this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
                resolve({
                    image: img,
                    data: this.imageData,
                    width: this.width,
                    height: this.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Load image from URL
     */
    async loadImageFromURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.width = img.width;
                this.height = img.height;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.ctx.drawImage(img, 0, 0);
                this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
                resolve({
                    image: img,
                    data: this.imageData,
                    width: this.width,
                    height: this.height
                });
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Create blank image
     */
    createBlank(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.imageData = this.ctx.createImageData(width, height);
        return this;
    }

    /**
     * Get image data
     */
    getImageData() {
        if (!this.imageData) {
            this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        }
        return this.imageData;
    }

    /**
     * Put image data back to canvas
     */
    putImageData(data) {
        this.imageData = data;
        this.ctx.putImageData(data, 0, 0);
    }

    /**
     * Convert to grayscale
     */
    toGrayscale() {
        const data = this.getImageData();
        const pixels = data.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            // Luminosity formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            pixels[i] = gray;
            pixels[i + 1] = gray;
            pixels[i + 2] = gray;
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Get pixel value at position
     */
    getPixel(x, y) {
        const data = this.getImageData();
        const idx = (y * this.width + x) * 4;
        return {
            r: data.data[idx],
            g: data.data[idx + 1],
            b: data.data[idx + 2],
            a: data.data[idx + 3]
        };
    }

    /**
     * Set pixel value at position
     */
    setPixel(x, y, r, g, b, a = 255) {
        const data = this.getImageData();
        const idx = (y * this.width + x) * 4;
        data.data[idx] = r;
        data.data[idx + 1] = g;
        data.data[idx + 2] = b;
        data.data[idx + 3] = a;
    }

    /**
     * Get brightness value (average of RGB)
     */
    getBrightness(x, y) {
        const pixel = this.getPixel(x, y);
        return (pixel.r + pixel.g + pixel.b) / 3;
    }

    /**
     * Apply brightness/contrast adjustment
     */
    adjustBrightnessContrast(brightness = 100, contrast = 100) {
        const data = this.getImageData();
        const pixels = data.data;
        
        const brightnessFactor = brightness / 100;
        const contrastFactor = (contrast / 100) * 255;
        const contrastOffset = 128 * (1 - contrastFactor / 255);

        for (let i = 0; i < pixels.length; i += 4) {
            // Apply brightness
            pixels[i] *= brightnessFactor;
            pixels[i + 1] *= brightnessFactor;
            pixels[i + 2] *= brightnessFactor;
            
            // Apply contrast
            pixels[i] = pixels[i] * contrastFactor / 255 + contrastOffset;
            pixels[i + 1] = pixels[i + 1] * contrastFactor / 255 + contrastOffset;
            pixels[i + 2] = pixels[i + 2] * contrastFactor / 255 + contrastOffset;
            
            // Clamp values
            pixels[i] = Math.max(0, Math.min(255, pixels[i]));
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1]));
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2]));
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Apply gamma correction
     */
    applyGamma(gamma = 1.0) {
        const data = this.getImageData();
        const pixels = data.data;
        const invGamma = 1 / gamma;
        
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.pow(pixels[i] / 255, invGamma) * 255;
            pixels[i + 1] = Math.pow(pixels[i + 1] / 255, invGamma) * 255;
            pixels[i + 2] = Math.pow(pixels[i + 2] / 255, invGamma) * 255;
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Apply saturation adjustment
     */
    adjustSaturation(saturation = 100) {
        const data = this.getImageData();
        const pixels = data.data;
        const factor = saturation / 100;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            
            pixels[i] = gray + factor * (pixels[i] - gray);
            pixels[i + 1] = gray + factor * (pixels[i + 1] - gray);
            pixels[i + 2] = gray + factor * (pixels[i + 2] - gray);
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Normalize image to full range
     */
    normalize() {
        const data = this.getImageData();
        const pixels = data.data;
        
        let min = 255, max = 0;
        
        // Find min and max (use green channel as brightness proxy)
        for (let i = 0; i < pixels.length; i += 4) {
            const brightness = pixels[i + 1]; // Green channel
            if (brightness < min) min = brightness;
            if (brightness > max) max = brightness;
        }
        
        if (max - min < 1) return this;
        
        const range = max - min;
        
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = ((pixels[i] - min) / range) * 255;
            pixels[i + 1] = ((pixels[i + 1] - min) / range) * 255;
            pixels[i + 2] = ((pixels[i + 2] - min) / range) * 255;
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Apply stretch (black point, white point)
     */
    applyStretch(blackPoint = 0, whitePoint = 65535, gamma = 1.0) {
        const data = this.getImageData();
        const pixels = data.data;
        
        // Convert to 16-bit range for processing
        const scale = 65535 / 255;
        
        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                let value = pixels[i + c] * scale;
                
                // Apply black point
                value = Math.max(0, value - blackPoint);
                
                // Apply white point
                value = Math.min(65535, value);
                value = (value / whitePoint) * 65535;
                
                // Apply gamma
                value = Math.pow(value / 65535, 1 / gamma) * 65535;
                
                // Convert back to 8-bit
                value = Math.max(0, Math.min(255, value / scale));
                pixels[i + c] = value;
            }
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Subtract bias/dark frame
     */
    subtractBias(biasData) {
        const data = this.getImageData();
        const pixels = data.data;
        const biasPixels = biasData.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.max(0, pixels[i] - biasPixels[i]);
            pixels[i + 1] = Math.max(0, pixels[i + 1] - biasPixels[i + 1]);
            pixels[i + 2] = Math.max(0, pixels[i + 2] - biasPixels[i + 2]);
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Divide by flat frame (flat-field correction)
     */
    divideByFlat(flatData) {
        const data = this.getImageData();
        const pixels = data.data;
        const flatPixels = flatData.data;
        
        // Calculate flat normalization factor
        let flatSum = 0;
        for (let i = 0; i < flatPixels.length; i += 4) {
            flatSum += flatPixels[i + 1]; // Green channel
        }
        const flatMean = flatSum / (flatPixels.length / 4);
        const normFactor = flatMean / 255;
        
        for (let i = 0; i < pixels.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                const flatVal = flatPixels[i + c] / 255;
                if (flatVal > 0) {
                    pixels[i + c] = (pixels[i + c] / flatVal) * normFactor;
                }
            }
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Remove gradient/background
     */
    removeGradient() {
        const data = this.getImageData();
        const pixels = data.data;
        
        // Sample corners to estimate background
        const samples = [];
        const step = Math.max(1, Math.floor(this.width / 50));
        
        for (let y = 0; y < this.height; y += step) {
            for (let x = 0; x < this.width; x += step) {
                // Check if we're near the edge (background area)
                const edgeDist = Math.min(x, y, this.width - x, this.height - y);
                if (edgeDist < step * 2) {
                    const idx = (y * this.width + x) * 4;
                    samples.push(pixels[idx + 1]); // Green channel
                }
            }
        }
        
        if (samples.length < 10) return this;
        
        // Calculate median background
        samples.sort((a, b) => a - b);
        const bgLevel = samples[Math.floor(samples.length / 2)];
        
        // Subtract background
        for (let i = 0; i < pixels.length; i += 4) {
            const bg = pixels[i + 1] - bgLevel;
            pixels[i] = Math.max(0, pixels[i] - bgLevel);
            pixels[i + 1] = Math.max(0, bg);
            pixels[i + 2] = Math.max(0, pixels[i + 2] - bgLevel);
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Apply simple background subtraction
     */
    subtractBackground(level = 0) {
        const data = this.getImageData();
        const pixels = data.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.max(0, pixels[i] - level);
            pixels[i + 1] = Math.max(0, pixels[i + 1] - level);
            pixels[i + 2] = Math.max(0, pixels[i + 2] - level);
        }
        
        this.putImageData(data);
        return this;
    }

    /**
     * Clone image data
     */
    clone() {
        const newProcessor = new ImageProcessor();
        newProcessor.init(document.createElement('canvas'));
        newProcessor.width = this.width;
        newProcessor.height = this.height;
        newProcessor.canvas.width = this.width;
        newProcessor.canvas.height = this.height;
        newProcessor.imageData = new ImageData(
            new Uint8ClampedArray(this.imageData.data),
            this.width,
            this.height
        );
        newProcessor.ctx.putImageData(newProcessor.imageData, 0, 0);
        return newProcessor;
    }

    /**
     * Get image as data URL
     */
    toDataURL(format = 'png', quality = 0.92) {
        return this.canvas.toDataURL(`image/${format}`, quality);
    }

    /**
     * Get image as blob
     */
    toBlob(format = 'png', quality = 0.92) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, `image/${format}`, quality);
        });
    }

    /**
     * Create checkerboard pattern for transparency preview
     */
    createCheckerboard(size = 20) {
        const data = this.ctx.createImageData(size * 2, size * 2);
        const pixels = data.data;
        
        for (let y = 0; y < size * 2; y++) {
            for (let x = 0; x < size * 2; x++) {
                const idx = (y * size * 2 + x) * 4;
                const isWhite = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
                pixels[idx] = isWhite ? 240 : 20;
                pixels[idx + 1] = isWhite ? 240 : 20;
                pixels[idx + 2] = isWhite ? 240 : 20;
                pixels[idx + 3] = 255;
            }
        }
        
        return data;
    }

    /**
     * Get statistics for the image
     */
    getStatistics() {
        const data = this.getImageData();
        const pixels = data.data;
        
        let rMin = 255, rMax = 0, rSum = 0;
        let gMin = 255, gMax = 0, gSum = 0;
        let bMin = 255, bMax = 0, bSum = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
            rMin = Math.min(rMin, pixels[i]);
            rMax = Math.max(rMax, pixels[i]);
            rSum += pixels[i];
            
            gMin = Math.min(gMin, pixels[i + 1]);
            gMax = Math.max(gMax, pixels[i + 1]);
            gSum += pixels[i + 1];
            
            bMin = Math.min(bMin, pixels[i + 2]);
            bMax = Math.max(bMax, pixels[i + 2]);
            bSum += pixels[i + 2];
        }
        
        const pixelCount = pixels.length / 4;
        
        return {
            red: { min: rMin, max: rMax, mean: rSum / pixelCount },
            green: { min: gMin, max: gMax, mean: gSum / pixelCount },
            blue: { min: bMin, max: bMax, mean: bSum / pixelCount },
            width: this.width,
            height: this.height
        };
    }
}

// Export for use
window.ImageProcessor = ImageProcessor;
