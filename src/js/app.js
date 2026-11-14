/**
 * Astro Pixel Processing Workbench - Main Application
 * 
 * A web-based astrophotography image processing application
 * inspired by Astro Pixel Processor (APP)
 */

// Main Application Class
class AstroWorkbench {
    constructor() {
        // Core modules
        this.processor = new ImageProcessor();
        this.calibration = new CalibrationManager(this.processor);
        this.aligner = new Aligner(this.processor);
        this.stacker = new Stacker(this.processor);
        this.colorCorrect = new ColorCorrector(this.processor);
        this.export = new ExportManager(this.processor);
        
        // Application state
        this.state = {
            frames: {
                lights: [],
                biases: [],
                darks: [],
                flats: []
            },
            calibratedFrames: [],
            alignedFrames: [],
            normalizedFrames: [],
            stackedResult: null,
            currentDisplay: null,
            settings: {
                stackingMethod: 'median',
                sigmaClipping: 3,
                rejectionThreshold: 5
            },
            adjustments: {
                blackPoint: 0,
                whitePoint: 65535,
                gamma: 1.0,
                brightness: 100,
                contrast: 100,
                saturation: 100,
                bgLevel: 0
            },
            zoom: 1,
            pipeline: {
                calibration: false,
                alignment: false,
                normalization: false,
                stacking: false,
                postprocess: false
            }
        };
        
        // Canvas reference
        this.canvas = document.getElementById('mainCanvas');
        this.placeholder = document.getElementById('imagePlaceholder');
        
        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        console.log('Astro Pixel Processing Workbench initializing...');
        
        // Set up canvas
        this.processor.init(this.canvas);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Log startup
        this.log('Application initialized', 'info');
        
        // Update UI
        this.updateUI();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File loading buttons
        document.getElementById('btnLoadLights').addEventListener('click', () => {
            document.getElementById('fileInputLights').click();
        });
        
        document.getElementById('btnLoadBias').addEventListener('click', () => {
            document.getElementById('fileInputBias').click();
        });
        
        document.getElementById('btnLoadDarks').addEventListener('click', () => {
            document.getElementById('fileInputDarks').click();
        });
        
        document.getElementById('btnLoadFlats').addEventListener('click', () => {
            document.getElementById('fileInputFlats').click();
        });

        // File inputs
        document.getElementById('fileInputLights').addEventListener('change', (e) => {
            this.loadFiles(e.target.files, 'lights');
            e.target.value = '';
        });
        
        document.getElementById('fileInputBias').addEventListener('change', (e) => {
            this.loadFiles(e.target.files, 'biases');
            e.target.value = '';
        });
        
        document.getElementById('fileInputDarks').addEventListener('change', (e) => {
            this.loadFiles(e.target.files, 'darks');
            e.target.value = '';
        });
        
        document.getElementById('fileInputFlats').addEventListener('change', (e) => {
            this.loadFiles(e.target.files, 'flats');
            e.target.value = '';
        });

        // Master creation
        document.getElementById('btnCreateMasters').addEventListener('click', () => {
            this.createMasters();
        });

        // Pipeline steps
        document.getElementById('btnRunCalibration').addEventListener('click', () => {
            this.runCalibration();
        });
        
        document.getElementById('btnRunAlignment').addEventListener('click', () => {
            this.runAlignment();
        });
        
        document.getElementById('btnRunNormalization').addEventListener('click', () => {
            this.runNormalization();
        });
        
        document.getElementById('btnRunStacking').addEventListener('click', () => {
            this.runStacking();
        });
        
        document.getElementById('btnRunPostprocess').addEventListener('click', () => {
            this.runPostprocess();
        });

        // Adjustments
        this.setupAdjustmentListeners();

        // Export
        document.getElementById('btnExport').addEventListener('click', () => {
            this.exportImage();
        });

        // Zoom controls
        document.getElementById('btnZoomIn').addEventListener('click', () => {
            this.zoom *= 1.2;
            this.updateZoom();
        });
        
        document.getElementById('btnZoomOut').addEventListener('click', () => {
            this.zoom /= 1.2;
            this.updateZoom();
        });
        
        document.getElementById('btnZoomFit').addEventListener('click', () => {
            this.fitToScreen();
        });

        // Reset adjustments
        document.getElementById('btnResetAdjustments').addEventListener('click', () => {
            this.resetAdjustments();
        });

        // Clear log
        document.getElementById('btnClearLog').addEventListener('click', () => {
            document.getElementById('logWindow').innerHTML = '';
        });
    }

    /**
     * Set up adjustment listeners
     */
    setupAdjustmentListeners() {
        const adjustments = [
            { id: 'blackPoint', valueId: 'blackPointValue', transform: v => v },
            { id: 'whitePoint', valueId: 'whitePointValue', transform: v => v },
            { id: 'gamma', valueId: 'gammaValue', transform: v => (v / 100).toFixed(2) },
            { id: 'brightness', valueId: 'brightnessValue', transform: v => `${v}%` },
            { id: 'contrast', valueId: 'contrastValue', transform: v => `${v}%` },
            { id: 'saturation', valueId: 'saturationValue', transform: v => `${v}%` },
            { id: 'bgLevel', valueId: 'bgLevelValue', transform: v => v }
        ];

        for (const adj of adjustments) {
            const slider = document.getElementById(adj.id);
            const valueDisplay = document.getElementById(adj.valueId);
            
            slider.addEventListener('input', () => {
                const value = parseInt(slider.value);
                this.state.adjustments[adj.id] = value;
                valueDisplay.textContent = adj.transform(value);
                this.applyAdjustments();
            });
        }
    }

    /**
     * Load files into frame collection
     */
    async loadFiles(files, type) {
        this.log(`Loading ${files.length} ${type}...`, 'info');
        
        const loadedFiles = [];
        
        for (const file of files) {
            try {
                // Load image to get dimensions
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                
                loadedFiles.push({
                    file: file,
                    name: file.name,
                    width: img.width,
                    height: img.height,
                    url: URL.createObjectURL(file)
                });
                
                this.log(`Loaded: ${file.name} (${img.width}x${img.height})`, 'success');
            } catch (e) {
                this.log(`Failed to load ${file.name}: ${e.message}`, 'error');
            }
        }
        
        // Add to appropriate collection
        switch (type) {
            case 'lights':
                this.state.frames.lights = [...this.state.frames.lights, ...loadedFiles];
                break;
            case 'biases':
                this.calibration.addBiasFrames(loadedFiles.map(f => f.file));
                this.state.frames.biases = [...this.state.frames.biases, ...loadedFiles];
                break;
            case 'darks':
                this.calibration.addDarkFrames(loadedFiles.map(f => f.file));
                this.state.frames.darks = [...this.state.frames.darks, ...loadedFiles];
                break;
            case 'flats':
                this.calibration.addFlatFrames(loadedFiles.map(f => f.file));
                this.state.frames.flats = [...this.state.frames.flats, ...loadedFiles];
                break;
        }
        
        this.updateUI();
        this.log(`Total ${type}: ${loadedFiles.length}`, 'success');
    }

    /**
     * Create master calibration frames
     */
    async createMasters() {
        this.setStatus('processing', 'Creating master frames...');
        
        try {
            const results = await this.calibration.createAllMasters();
            
            if (results.bias) {
                this.log('Master bias created successfully', 'success');
            }
            if (results.dark) {
                this.log('Master dark created successfully', 'success');
            }
            if (results.flat) {
                this.log('Master flat created successfully', 'success');
            }
            
            this.updateUI();
            this.setStatus('ready', 'Masters created');
        } catch (e) {
            this.log(`Error creating masters: ${e.message}`, 'error');
            this.setStatus('error', 'Master creation failed');
        }
    }

    /**
     * Run calibration pipeline
     */
    async runCalibration() {
        if (this.state.frames.lights.length === 0) {
            this.log('No light frames loaded', 'error');
            return;
        }

        this.log('Starting calibration...', 'info');
        this.setStatus('processing', 'Calibrating frames...');
        this.state.pipeline.calibration = true;
        
        try {
            const results = [];
            
            for (let i = 0; i < this.state.frames.lights.length; i++) {
                const frame = this.state.frames.lights[i];
                this.log(`Calibrating frame ${i + 1}/${this.state.frames.lights.length}: ${frame.name}`);
                
                // Load image
                const loaded = await this.processor.loadImage(frame.file);
                
                // Apply calibration
                let calibratedData = loaded.data;
                
                if (this.calibration.masterDark || this.calibration.masterBias || this.calibration.masterFlat) {
                    calibratedData = this.calibration.applyCalibration(loaded.data);
                }
                
                results.push({
                    image: frame,
                    data: calibratedData,
                    width: loaded.width,
                    height: loaded.height
                });
            }
            
            this.state.calibratedFrames = results;
            this.state.pipeline.calibration = true;
            
            // Show first calibrated frame
            this.displayFrame(results[0]);
            
            this.log(`Calibration complete: ${results.length} frames processed`, 'success');
            this.setStatus('ready', 'Calibration complete');
        } catch (e) {
            this.log(`Calibration error: ${e.message}`, 'error');
            this.setStatus('error', 'Calibration failed');
        }
        
        this.updateUI();
    }

    /**
     * Run alignment
     */
    async runAlignment() {
        if (this.state.calibratedFrames.length < 2) {
            this.log('Need at least 2 calibrated frames for alignment', 'error');
            // Try with loaded frames if no calibrated
            if (this.state.frames.lights.length >= 2) {
                this.log('Using loaded frames for alignment...', 'info');
                const frames = await this.loadFramesForAlignment();
                this.state.alignedFrames = await this.aligner.alignFrames(frames, 0);
                
                this.log(`Alignment complete: ${this.state.alignedFrames.length} frames`, 'success');
                this.displayFrame(this.state.alignedFrames[0]);
            }
            return;
        }

        this.log('Starting alignment...', 'info');
        this.setStatus('processing', 'Aligning frames...');
        this.state.pipeline.alignment = true;
        
        try {
            const frames = this.state.calibratedFrames;
            this.state.alignedFrames = await this.aligner.alignFrames(frames, 0);
            
            this.log(`Alignment complete: ${this.state.alignedFrames.length} frames`, 'success');
            this.displayFrame(this.state.alignedFrames[0]);
            this.setStatus('ready', 'Alignment complete');
        } catch (e) {
            this.log(`Alignment error: ${e.message}`, 'error');
            this.setStatus('error', 'Alignment failed');
        }
        
        this.updateUI();
    }

    /**
     * Load frames for alignment
     */
    async loadFramesForAlignment() {
        const frames = [];
        
        for (const frame of this.state.frames.lights) {
            const loaded = await this.processor.loadImage(frame.file);
            frames.push({
                image: frame,
                data: loaded.data,
                width: loaded.width,
                height: loaded.height
            });
        }
        
        return frames;
    }

    /**
     * Run normalization
     */
    runNormalization() {
        if (this.state.alignedFrames.length === 0) {
            if (this.state.calibratedFrames.length > 0) {
                this.log('Using calibrated frames for normalization', 'info');
                this.state.normalizedFrames = this.stacker.normalizeFrames(this.state.calibratedFrames);
            } else {
                this.log('No frames to normalize', 'error');
                return;
            }
        } else {
            this.log('Normalizing aligned frames...', 'info');
            this.state.normalizedFrames = this.stacker.normalizeFrames(this.state.alignedFrames);
        }
        
        this.state.pipeline.normalization = true;
        this.log(`Normalization complete: ${this.state.normalizedFrames.length} frames`, 'success');
        this.displayFrame(this.state.normalizedFrames[0]);
        this.setStatus('ready', 'Normalization complete');
        this.updateUI();
    }

    /**
     * Run stacking
     */
    runStacking() {
        const frames = this.state.normalizedFrames.length > 0 
            ? this.state.normalizedFrames 
            : (this.state.alignedFrames.length > 0 
                ? this.state.alignedFrames 
                : this.state.calibratedFrames);
        
        if (frames.length === 0) {
            this.log('No frames to stack', 'error');
            return;
        }

        this.log(`Stacking ${frames.length} frames using ${this.state.settings.stackingMethod}...`, 'info');
        this.setStatus('processing', 'Stacking frames...');
        this.state.pipeline.stacking = true;
        
        try {
            const result = this.stacker.stackFrames(
                frames,
                this.state.settings.stackingMethod,
                this.state.settings.sigmaClipping
            );
            
            this.state.stackedResult = result;
            this.state.pipeline.stacking = true;
            
            // Apply initial stretch
            this.applyAdjustments(true);
            
            this.log(`Stacking complete: ${result.frameCount} frames integrated`, 'success');
            this.log(`Method: ${result.method}`, 'info');
            this.setStatus('ready', 'Stack complete');
            
            // Show stack stats
            const stats = this.stacker.getStackStats(frames, result.stacked);
            this.log(`Stack stats: mean=${stats.outputMean.toFixed(1)}, contrast=${stats.outputContrast.toFixed(0)}`, 'info');
        } catch (e) {
            this.log(`Stacking error: ${e.message}`, 'error');
            this.setStatus('error', 'Stacking failed');
        }
        
        this.updateUI();
    }

    /**
     * Run post-processing
     */
    runPostprocess() {
        if (!this.state.stackedResult) {
            this.log('No stacked result to post-process', 'error');
            return;
        }

        this.log('Starting post-processing...', 'info');
        this.setStatus('processing', 'Post-processing...');
        this.state.pipeline.postprocess = true;
        
        try {
            // Apply gradient removal
            this.log('Removing gradient...');
            const corrected = this.colorCorrect.removeGradientPolynomial(
                this.state.stackedResult.stacked,
                2
            );
            
            // Apply auto stretch
            this.log('Applying auto stretch...');
            this.colorCorrect.autoStretch(corrected, 0.005, 0.995);
            
            // Update stacked result
            this.state.stackedResult.stacked = corrected;
            
            // Display
            this.displayFrame(corrected);
            
            this.log('Post-processing complete', 'success');
            this.setStatus('ready', 'Post-processing complete');
        } catch (e) {
            this.log(`Post-processing error: ${e.message}`, 'error');
            this.setStatus('error', 'Post-processing failed');
        }
        
        this.updateUI();
    }

    /**
     * Display a frame on canvas
     */
    displayFrame(frameData) {
        if (!frameData) return;
        
        const data = frameData.data instanceof ImageData 
            ? frameData.data 
            : new ImageData(
                new Uint8ClampedArray(frameData.data),
                frameData.width,
                frameData.height
              );
        
        // Create temporary processor for display
        const displayProcessor = new ImageProcessor();
        displayProcessor.init(this.canvas);
        displayProcessor.width = frameData.width;
        displayProcessor.height = frameData.height;
        displayProcessor.canvas.width = frameData.width;
        displayProcessor.canvas.height = frameData.height;
        displayProcessor.imageData = data;
        displayProcessor.ctx.putImageData(data, 0, 0);
        
        this.state.currentDisplay = displayProcessor;
        
        // Update placeholder
        this.placeholder.style.display = 'none';
        
        // Fit to screen
        this.fitToScreen();
        
        // Update frame info
        document.getElementById('frameInfo').textContent = 
            `${frameData.width}x${frameData.height} | ${frameData.width * frameData.height.toLocaleString()} pixels`;
    }

    /**
     * Apply adjustments to displayed image
     */
    applyAdjustments(force = false) {
        if (!this.state.currentDisplay) return;
        
        // Clone current display
        const processed = this.state.currentDisplay.clone();
        
        // Apply adjustments in order
        const adj = this.state.adjustments;
        
        processed.adjustBrightnessContrast(adj.brightness, adj.contrast);
        processed.adjustSaturation(adj.saturation);
        processed.applyGamma(adj.gamma);
        processed.applyStretch(adj.blackPoint, adj.whitePoint, adj.gamma);
        processed.subtractBackground(adj.bgLevel);
        
        // Update display
        this.state.currentDisplay = processed;
        this.processor.canvas.width = processed.width;
        this.processor.canvas.height = processed.height;
        this.processor.ctx.putImageData(processed.imageData, 0, 0);
        
        this.updateZoom();
    }

    /**
     * Reset adjustments to defaults
     */
    resetAdjustments() {
        this.state.adjustments = {
            blackPoint: 0,
            whitePoint: 65535,
            gamma: 1.0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            bgLevel: 0
        };
        
        // Reset sliders
        document.getElementById('blackPoint').value = 0;
        document.getElementById('blackPointValue').textContent = '0';
        document.getElementById('whitePoint').value = 65535;
        document.getElementById('whitePointValue').textContent = '65535';
        document.getElementById('gamma').value = 100;
        document.getElementById('gammaValue').textContent = '1.0';
        document.getElementById('brightness').value = 100;
        document.getElementById('brightnessValue').textContent = '100%';
        document.getElementById('contrast').value = 100;
        document.getElementById('contrastValue').textContent = '100%';
        document.getElementById('saturation').value = 100;
        document.getElementById('saturationValue').textContent = '100%';
        document.getElementById('bgLevel').value = 0;
        document.getElementById('bgLevelValue').textContent = '0';
        
        if (this.state.currentDisplay) {
            // Reload original
            if (this.state.stackedResult) {
                this.displayFrame(this.state.stackedResult.stacked);
            } else if (this.state.normalizedFrames.length > 0) {
                this.displayFrame(this.state.normalizedFrames[0]);
            } else if (this.state.alignedFrames.length > 0) {
                this.displayFrame(this.state.alignedFrames[0]);
            } else if (this.state.calibratedFrames.length > 0) {
                this.displayFrame(this.state.calibratedFrames[0]);
            }
        }
    }

    /**
     * Export image
     */
    async exportImage() {
        if (!this.state.currentDisplay) {
            this.log('No image to export', 'error');
            return;
        }

        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const filename = `astro_${Date.now()}`;
        
        this.log(`Exporting as ${format.toUpperCase()}...`, 'info');
        
        try {
            const result = await this.export.exportImage(format, 0.92, filename);
            
            if (result.success) {
                this.log(`Exported: ${result.filename}`, 'success');
                document.getElementById('exportInfo').textContent = 
                    `Exported: ${result.filename} (${format.toUpperCase()})`;
            }
        } catch (e) {
            this.log(`Export error: ${e.message}`, 'error');
        }
    }

    /**
     * Fit image to screen
     */
    fitToScreen() {
        if (!this.state.currentDisplay) return;
        
        const container = document.getElementById('mainImageContainer');
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        
        const imgWidth = this.state.currentDisplay.width;
        const imgHeight = this.state.currentDisplay.height;
        
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        this.zoom = Math.min(scaleX, scaleY, 1);
        
        this.updateZoom();
    }

    /**
     * Update zoom display
     */
    updateZoom() {
        if (!this.state.currentDisplay) return;
        
        this.canvas.style.width = `${this.state.currentDisplay.width * this.zoom}px`;
        this.canvas.style.height = `${this.state.currentDisplay.height * this.zoom}px`;
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update frame counts
        document.getElementById('lightCount').textContent = 
            `${this.state.frames.lights.length} frames`;
        
        // Update master status
        const masterStatus = this.calibration.getMasterStatus();
        document.getElementById('masterBiasStatus').textContent = masterStatus.bias;
        document.getElementById('masterDarkStatus').textContent = masterStatus.dark;
        document.getElementById('masterFlatStatus').textContent = masterStatus.flat;
        
        // Update pipeline steps
        this.updatePipelineStep('stepCalibration', this.state.pipeline.calibration, 'calibrationStatus');
        this.updatePipelineStep('stepAlignment', this.state.pipeline.alignment, 'alignmentStatus');
        this.updatePipelineStep('stepNormalization', this.state.pipeline.normalization, 'normalizationStatus');
        this.updatePipelineStep('stepStacking', this.state.pipeline.stacking, 'stackingStatus');
        this.updatePipelineStep('stepPostprocess', this.state.pipeline.postprocess, 'postprocessStatus');
        
        // Update frame info
        const totalFrames = 
            this.state.frames.lights.length + 
            this.state.frames.biases.length + 
            this.state.frames.darks.length + 
            this.state.frames.flats.length;
        
        if (totalFrames === 0) {
            document.getElementById('frameInfo').textContent = 'No frames loaded';
        }
    }

    /**
     * Update individual pipeline step display
     */
    updatePipelineStep(stepId, completed, statusId) {
        const step = document.getElementById(stepId);
        const status = document.getElementById(statusId);
        
        if (completed) {
            step.classList.add('completed');
            status.textContent = 'Complete';
            status.style.color = 'var(--accent-green)';
        } else {
            step.classList.remove('completed');
            status.textContent = 'Not run';
            status.style.color = '';
        }
    }

    /**
     * Set application status
     */
    setStatus(type, message) {
        const indicator = document.getElementById('statusIndicator');
        indicator.textContent = message;
        indicator.className = 'status-indicator ' + type;
    }

    /**
     * Log message to log window
     */
    log(message, type = 'info') {
        const logWindow = document.getElementById('logWindow');
        const entry = document.createElement('div');
        entry.className = 'log-entry ' + type;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        
        logWindow.appendChild(entry);
        logWindow.scrollTop = logWindow.scrollHeight;
        
        console.log(`[AstroWorkbench] ${message}`);
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.astroWorkbench = new AstroWorkbench();
    
    // Log application info
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Astro Pixel Processing Workbench                        ║
║   A web-based astrophotography image processor            ║
╠═══════════════════════════════════════════════════════════╣
║   Features:                                               ║
║   • Load light, bias, dark, and flat frames               ║
║   • Create master calibration frames                      ║
║   • Calibrate light frames                                ║
║   • Star-based image alignment                            ║
║   • Frame normalization                                   ║
║   • Stacking with outlier rejection                       ║
║   • Background/gradient correction                        ║
║   • Histogram stretching                                  ║
║   • Export to PNG/JPEG/WebP                               ║
╠═══════════════════════════════════════════════════════════╣
║   Workflow:                                               ║
║   1. Load frames                                          ║
║   2. Create masters (calibration frames)                  ║
║   3. Run calibration                                      ║
║   4. Run alignment                                        ║
║   5. Run normalization                                    ║
║   6. Run stacking                                         ║
║   7. Post-process (optional)                              ║
║   8. Export                                               ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
