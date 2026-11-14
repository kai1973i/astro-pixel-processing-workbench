/**
 * Calibration Module
 * Handles bias, dark, and flat frame calibration
 */

class CalibrationManager {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
        this.biasFrames = [];
        this.darkFrames = [];
        this.flatFrames = [];
        this.masterBias = null;
        this.masterDark = null;
        this.masterFlat = null;
    }

    /**
     * Add bias frames
     */
    addBiasFrames(files) {
        this.biasFrames = [...this.biasFrames, ...files];
        return this.biasFrames;
    }

    /**
     * Add dark frames
     */
    addDarkFrames(files) {
        this.darkFrames = [...this.darkFrames, ...files];
        return this.darkFrames;
    }

    /**
     * Add flat frames
     */
    addFlatFrames(files) {
        this.flatFrames = [...this.flatFrames, ...files];
        return this.flatFrames;
    }

    /**
     * Remove a frame from collection
     */
    removeFrame(frameType, index) {
        if (frameType === 'bias') {
            this.biasFrames.splice(index, 1);
        } else if (frameType === 'dark') {
            this.darkFrames.splice(index, 1);
        } else if (frameType === 'flat') {
            this.flatFrames.splice(index, 1);
        }
    }

    /**
     * Get frame counts
     */
    getCounts() {
        return {
            bias: this.biasFrames.length,
            dark: this.darkFrames.length,
            flat: this.flatFrames.length
        };
    }

    /**
     * Clear all frames
     */
    clearAll() {
        this.biasFrames = [];
        this.darkFrames = [];
        this.flatFrames = [];
        this.masterBias = null;
        this.masterDark = null;
        this.masterFlat = null;
    }

    /**
     * Create master bias from multiple bias frames (median combine)
     */
    async createMasterBias() {
        if (this.biasFrames.length === 0) {
            throw new Error('No bias frames loaded');
        }

        console.log(`Creating master bias from ${this.biasFrames.length} frames...`);
        
        // Load first frame to get dimensions
        const firstFrame = await this.processor.loadImage(this.biasFrames[0]);
        const width = firstFrame.width;
        const height = firstFrame.height;

        // Create accumulator for median
        const pixelBuffers = [];
        
        for (const file of this.biasFrames) {
            const frame = await this.processor.loadImage(file);
            const data = frame.data.data;
            pixelBuffers.push(new Uint16Array(data.buffer));
        }

        // Calculate median for each pixel
        const masterData = new Uint8ClampedArray(width * height * 4);
        
        for (let i = 0; i < width * height; i++) {
            const values = pixelBuffers.map(buf => buf[i * 4 + 1]); // Green channel
            values.sort((a, b) => a - b);
            const median = values[Math.floor(values.length / 2)];
            
            const idx = i * 4;
            masterData[idx] = median;
            masterData[idx + 1] = median;
            masterData[idx + 2] = median;
            masterData[idx + 3] = 255;
        }

        this.masterBias = new ImageData(masterData, width, height);
        console.log('Master bias created');
        return this.masterBias;
    }

    /**
     * Create master dark from multiple dark frames (median combine)
     */
    async createMasterDark() {
        if (this.darkFrames.length === 0) {
            throw new Error('No dark frames loaded');
        }

        console.log(`Creating master dark from ${this.darkFrames.length} frames...`);
        
        const firstFrame = await this.processor.loadImage(this.darkFrames[0]);
        const width = firstFrame.width;
        const height = firstFrame.height;

        const pixelBuffers = [];
        
        for (const file of this.darkFrames) {
            const frame = await this.processor.loadImage(file);
            const data = frame.data.data;
            pixelBuffers.push(new Uint16Array(data.buffer));
        }

        const masterData = new Uint8ClampedArray(width * height * 4);
        
        for (let i = 0; i < width * height; i++) {
            const values = pixelBuffers.map(buf => buf[i * 4 + 1]);
            values.sort((a, b) => a - b);
            const median = values[Math.floor(values.length / 2)];
            
            const idx = i * 4;
            masterData[idx] = median;
            masterData[idx + 1] = median;
            masterData[idx + 2] = median;
            masterData[idx + 3] = 255;
        }

        this.masterDark = new ImageData(masterData, width, height);
        console.log('Master dark created');
        return this.masterDark;
    }

    /**
     * Create master flat from multiple flat frames (normalized median)
     */
    async createMasterFlat() {
        if (this.flatFrames.length === 0) {
            throw new Error('No flat frames loaded');
        }

        console.log(`Creating master flat from ${this.flatFrames.length} frames...`);
        
        const firstFrame = await this.processor.loadImage(this.flatFrames[0]);
        const width = firstFrame.width;
        const height = firstFrame.height;

        const pixelBuffers = [];
        
        for (const file of this.flatFrames) {
            const frame = await this.processor.loadImage(file);
            const data = frame.data.data;
            pixelBuffers.push(new Uint16Array(data.buffer));
        }

        // First pass: calculate normalization factors
        const norms = pixelBuffers.map(buf => {
            let sum = 0;
            for (let i = 0; i < buf.length; i += 4) {
                sum += buf[i + 1];
            }
            return sum / (buf.length / 4);
        });

        const avgNorm = norms.reduce((a, b) => a + b, 0) / norms.length;

        // Second pass: normalize and median combine
        const masterData = new Uint8ClampedArray(width * height * 4);
        
        for (let i = 0; i < width * height; i++) {
            const values = pixelBuffers.map((buf, idx) => {
                const val = buf[i * 4 + 1];
                return (val / norms[idx]) * avgNorm;
            });
            values.sort((a, b) => a - b);
            const median = values[Math.floor(values.length / 2)];
            
            const idx = i * 4;
            masterData[idx] = median;
            masterData[idx + 1] = median;
            masterData[idx + 2] = median;
            masterData[idx + 3] = 255;
        }

        this.masterFlat = new ImageData(masterData, width, height);
        console.log('Master flat created');
        return this.masterFlat;
    }

    /**
     * Create all masters
     */
    async createAllMasters() {
        const results = {};
        
        if (this.biasFrames.length > 0) {
            results.bias = await this.createMasterBias();
        }
        if (this.darkFrames.length > 0) {
            results.dark = await this.createMasterDark();
        }
        if (this.flatFrames.length > 0) {
            results.flat = await this.createMasterFlat();
        }
        
        return results;
    }

    /**
     * Apply calibration to a light frame
     */
    applyCalibration(lightImageData) {
        const data = lightImageData.data;
        const result = new Uint8ClampedArray(data.length);

        // Subtract dark
        if (this.masterDark) {
            for (let i = 0; i < data.length; i += 4) {
                result[i] = Math.max(0, data[i] - this.masterDark.data[i]);
                result[i + 1] = Math.max(0, data[i + 1] - this.masterDark.data[i + 1]);
                result[i + 2] = Math.max(0, data[i + 2] - this.masterDark.data[i + 2]);
            }
        } else {
            result.set(data);
        }

        // Subtract bias
        if (this.masterBias) {
            for (let i = 0; i < result.length; i += 4) {
                result[i] = Math.max(0, result[i] - this.masterBias.data[i]);
                result[i + 1] = Math.max(0, result[i + 1] - this.masterBias.data[i + 1]);
                result[i + 2] = Math.max(0, result[i + 2] - this.masterBias.data[i + 2]);
            }
        }

        // Divide by flat
        if (this.masterFlat) {
            const flatData = this.masterFlat.data;
            
            // Calculate flat normalization
            let flatSum = 0;
            for (let i = 0; i < flatData.length; i += 4) {
                flatSum += flatData[i + 1];
            }
            const flatMean = flatSum / (flatData.length / 4);
            const normFactor = flatMean / 255;

            for (let i = 0; i < result.length; i += 4) {
                for (let c = 0; c < 3; c++) {
                    const flatVal = flatData[i + c] / 255;
                    if (flatVal > 0.01) {
                        result[i + c] = (result[i + c] / flatVal) * normFactor;
                    }
                }
            }
        }

        // Clamp values
        for (let i = 0; i < result.length; i++) {
            result[i] = Math.max(0, Math.min(255, result[i]));
        }

        return new ImageData(result, lightImageData.width, lightImageData.height);
    }

    /**
     * Check if calibration is ready
     */
    isReady() {
        return {
            hasBias: this.masterBias !== null,
            hasDark: this.masterDark !== null,
            hasFlat: this.masterFlat !== null,
            ready: this.masterBias !== null || this.masterDark !== null || this.masterFlat !== null
        };
    }

    /**
     * Get master status
     */
    getMasterStatus() {
        return {
            bias: this.masterBias ? 'Created' : 'Not created',
            dark: this.masterDark ? 'Created' : 'Not created',
            flat: this.masterFlat ? 'Created' : 'Not created'
        };
    }
}

// Export for use
window.CalibrationManager = CalibrationManager;
