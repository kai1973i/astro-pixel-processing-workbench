/**
 * Simple automated test for Astro Pixel Processing Workbench
 * Run with: node tests/simple-test.js
 */

const { JSDOM } = require('jsdom');

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <canvas id="testCanvas"></canvas>
    <script src="../src/js/imageProcessor.js"></script>
    <script src="../src/js/calibration.js"></script>
    <script src="../src/js/aligner.js"></script>
    <script src="../src/js/stacker.js"></script>
    <script src="../src/js/colorCorrect.js"></script>
    <script src="../src/js/export.js"></script>
</body>
</html>
`, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'file://' + process.cwd() + '/tests/'
});

// Wait for scripts to load
setTimeout(() => {
    global.window = dom.window;
    global.document = dom.window.document;
    global.Image = dom.window.Image;
    global.ImageData = dom.window.ImageData;
    global.Blob = dom.window.Blob;
    global.File = dom.window.File;
    global.FileReader = dom.window.FileReader;
    global.URLSearchParams = dom.window.URLSearchParams;
    
    // Get classes from window
    const ImageProcessor = dom.window.ImageProcessor;
    const CalibrationManager = dom.window.CalibrationManager;
    const Aligner = dom.window.Aligner;
    const Stacker = dom.window.Stacker;
    const ColorCorrector = dom.window.ColorCorrector;
    const ExportManager = dom.window.ExportManager;
    
    // Tests
    let passed = 0;
    let failed = 0;
    
    function test(name, fn) {
        try {
            fn();
            console.log(`✓ ${name}`);
            passed++;
        } catch (e) {
            console.log(`✗ ${name}: ${e.message}`);
            failed++;
        }
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }
    
    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
    
    console.log('\n=== Astro Pixel Processing Workbench - Module Tests ===\n');
    
    // ImageProcessor tests
    test('ImageProcessor can be instantiated', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        assert(processor.canvas !== null, 'Canvas should be set');
        assert(processor.ctx !== null, 'Context should be set');
    });
    
    test('ImageProcessor createBlank creates ImageData', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(100, 100);
        assert(processor.width === 100, 'Width should be 100');
        assert(processor.height === 100, 'Height should be 100');
        assert(processor.imageData !== null, 'ImageData should exist');
        assert(processor.imageData.width === 100, 'ImageData width should be 100');
        assert(processor.imageData.height === 100, 'ImageData height should be 100');
    });
    
    test('ImageProcessor can modify pixels', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(10, 10);
        
        // Set a pixel
        processor.setPixel(5, 5, 255, 128, 64, 255);
        const pixel = processor.getPixel(5, 5);
        assertEqual(pixel.r, 255, 'Red component');
        assertEqual(pixel.g, 128, 'Green component');
        assertEqual(pixel.b, 64, 'Blue component');
    });
    
    test('ImageProcessor toGrayscale works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(10, 10);
        
        // Create a red pixel
        processor.setPixel(0, 0, 255, 0, 0, 255);
        processor.toGrayscale();
        
        const gray = processor.getPixel(0, 0);
        // Luminosity: 0.299*255 + 0.587*0 + 0.114*0 = ~76
        assert(gray.r > 70 && gray.r < 80, `Grayscale should be ~76, got ${gray.r}`);
    });
    
    test('ImageProcessor adjustBrightnessContrast works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(10, 10);
        
        // Set pixel to mid-gray
        processor.setPixel(0, 0, 128, 128, 128, 255);
        
        // Increase brightness
        processor.adjustBrightnessContrast(150, 100);
        const pixel = processor.getPixel(0, 0);
        assert(pixel.r > 128, 'Brightness should increase');
    });
    
    test('ImageProcessor normalize works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(10, 10);
        
        // Fill with low values
        for (let i = 0; i < 100; i++) {
            processor.imageData.data[i * 4] = 10;
            processor.imageData.data[i * 4 + 1] = 20;
            processor.imageData.data[i * 4 + 2] = 30;
        }
        
        // Add one bright pixel
        processor.setPixel(5, 5, 200, 200, 200, 255);
        
        processor.normalize();
        
        // After normalization, min should be 0 and max should be 255
        let min = 255, max = 0;
        for (let i = 0; i < 100; i++) {
            const v = processor.imageData.data[i * 4];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        assert(min === 0, `Min should be 0, got ${min}`);
        assert(max === 255, `Max should be 255, got ${max}`);
    });
    
    test('ImageProcessor getStatistics works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(50, 50);
        
        // Fill with known values
        for (let i = 0; i < 2500; i++) {
            processor.imageData.data[i * 4] = 100;
            processor.imageData.data[i * 4 + 1] = 150;
            processor.imageData.data[i * 4 + 2] = 200;
        }
        
        const stats = processor.getStatistics();
        assertEqual(stats.red.min, 100, 'Red min');
        assertEqual(stats.red.max, 100, 'Red max');
        assertEqual(stats.green.min, 150, 'Green min');
        assertEqual(stats.green.max, 150, 'Green max');
        assertEqual(stats.blue.min, 200, 'Blue min');
        assertEqual(stats.blue.max, 200, 'Blue max');
        assertEqual(stats.width, 50, 'Width');
        assertEqual(stats.height, 50, 'Height');
    });
    
    // Stacker tests
    test('Stacker median works for odd-length array', () => {
        const stacker = new Stacker();
        assertEqual(stacker.median([1, 3, 5]), 3, 'Median of [1,3,5]');
    });
    
    test('Stacker median works for even-length array', () => {
        const stacker = new Stacker();
        assertEqual(stacker.median([1, 2, 3, 4]), 2.5, 'Median of [1,2,3,4]');
    });
    
    test('Stacker mean works', () => {
        const stacker = new Stacker();
        assertEqual(stacker.mean([1, 2, 3, 4, 5]), 3, 'Mean of [1,2,3,4,5]');
    });
    
    test('Stacker sigmaClip rejects outliers', () => {
        const stacker = new Stacker();
        // Values with one outlier
        const result = stacker.sigmaClip([10, 10, 10, 10, 10, 100], 2);
        assert(result < 20, `Outlier should be rejected, got ${result}`);
    });
    
    test('Stacker robustStdDev works', () => {
        const stacker = new Stacker();
        const stdDev = stacker.robustStdDev([10, 10, 10, 10, 10], 10);
        assert(stdDev === 0, 'StdDev of uniform values should be 0');
        
        const stdDev2 = stacker.robustStdDev([5, 10, 15], 10);
        assert(stdDev2 > 0, 'StdDev of varied values should be > 0');
    });
    
    // CalibrationManager tests
    test('CalibrationManager initializes with empty frames', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const cal = new CalibrationManager(processor);
        
        const counts = cal.getCounts();
        assertEqual(counts.bias, 0, 'Initial bias count');
        assertEqual(counts.dark, 0, 'Initial dark count');
        assertEqual(counts.flat, 0, 'Initial flat count');
    });
    
    test('CalibrationManager addBiasFrames works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const cal = new CalibrationManager(processor);
        
        const mockFiles = [{}, {}]; // Mock file objects
        cal.addBiasFrames(mockFiles);
        
        assertEqual(cal.getCounts().bias, 2, 'Bias count after add');
    });
    
    test('CalibrationManager isReady returns correct state', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const cal = new CalibrationManager(processor);
        
        const ready = cal.isReady();
        assertEqual(ready.ready, false, 'Not ready initially');
        assertEqual(ready.hasBias, false, 'No bias master');
        assertEqual(ready.hasDark, false, 'No dark master');
        assertEqual(ready.hasFlat, false, 'No flat master');
    });
    
    // ExportManager tests
    test('ExportManager initializes correctly', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const exp = new ExportManager(processor);
        assert(exp !== null, 'ExportManager should be created');
    });
    
    test('ExportManager getExportOptions returns correct formats', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const exp = new ExportManager(processor);
        
        const options = exp.getExportOptions();
        assert(options.length === 5, 'Should have 5 options');
        assertEqual(options[0].format, 'png', 'First format should be PNG');
        assertEqual(options[0].default, true, 'PNG should be default');
    });
    
    // ColorCorrector tests
    test('ColorCorrector initializes correctly', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const cc = new ColorCorrector(processor);
        assert(cc !== null, 'ColorCorrector should be created');
    });
    
    test('ColorCorrector vibrance works', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        processor.createBlank(10, 10);
        
        // Set a pixel with uneven RGB values
        processor.setPixel(0, 0, 100, 50, 150, 255);
        
        const cc = new ColorCorrector(processor);
        // Apply negative vibrance to reduce saturation
        cc.vibrance(processor.imageData, -50);
        
        // Vibrance should make colors more gray (closer to average)
        const pixel = processor.getPixel(0, 0);
        const avg = (pixel.r + pixel.g + pixel.b) / 3;
        // After reducing vibrance, values should be closer to average
        assert(Math.abs(pixel.r - avg) < 50, 'Red should be closer to average');
        assert(Math.abs(pixel.g - avg) < 50, 'Green should be closer to average');
        assert(Math.abs(pixel.b - avg) < 50, 'Blue should be closer to average');
    });
    
    // Aligner tests
    test('Aligner initializes correctly', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const aligner = new Aligner(processor);
        assert(aligner !== null, 'Aligner should be created');
    });
    
    test('Aligner calculateTransformation works with matches', () => {
        const canvas = document.getElementById('testCanvas');
        const processor = new ImageProcessor();
        processor.init(canvas);
        const aligner = new Aligner(processor);
        
        // Create some mock matches
        const matches = [
            { refX: 100, refY: 100, curX: 110, curY: 105 },
            { refX: 200, refY: 100, curX: 210, curY: 105 },
            { refX: 100, refY: 200, curX: 110, curY: 205 },
            { refX: 200, refY: 200, curX: 210, curY: 205 }
        ];
        
        const transform = aligner.calculateTransformation(matches);
        assert(transform !== null, 'Should calculate transformation');
        assert(typeof transform.a === 'number', 'Should have parameter a');
        assert(typeof transform.b === 'number', 'Should have parameter b');
        assert(typeof transform.c === 'number', 'Should have parameter c');
    });
    
    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('\n✓ All tests passed!');
        process.exit(0);
    } else {
        console.log(`\n✗ ${failed} test(s) failed`);
        process.exit(1);
    }
}, 100);
