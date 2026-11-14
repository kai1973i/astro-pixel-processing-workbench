# Astro Pixel Processing Workbench

A web-based astrophotography image processing application inspired by Astro Pixel Processor (APP).

## What It Does

This application provides a complete workflow for processing deep-sky astrophotography images:

1. **Import calibration frames** - Load bias, dark, and flat frames along with light frames
2. **Calibration** - Apply calibration to remove sensor noise and optical artifacts
3. **Alignment** - Register and align multiple frames using star detection
4. **Stacking** - Integrate multiple frames with outlier rejection for noise reduction
5. **Post-processing** - Background correction, color calibration, stretching
6. **Export** - Save processed images in various formats

## Workflow

The typical processing workflow:

1. Load your light frames (the images you want to stack)
2. Load calibration frames if available (bias, dark, flat)
3. Create master calibration frames
4. Apply calibration to light frames
5. Analyze stars and align frames
6. Normalize and stack with rejection
7. Apply post-processing (gradient removal, color calibration)
8. Preview and stretch the result
9. Export the final image

## Project Structure

```
src/
├── index.html          # Main application page
├── css/
│   └── style.css       # Styles
└── js/
    ├── app.js          # Main application controller
    ├── imageProcessor.js # Core image processing
    ├── calibration.js  # Calibration frame handling
    ├── stacker.js      # Stacking engine
    ├── aligner.js      # Image alignment
    ├── colorCorrect.js # Color/gradient corrections
    └── export.js       # Export functionality
```

## Technology

- Pure HTML5 + JavaScript (no build step required)
- Canvas API for image processing
- Browser File API for loading images
- Works entirely client-side (no server needed)

## Getting Started

### Quick Start

Open `src/index.html` directly in a modern web browser:

```
file:///path/to/project/src/index.html
```

Or serve with any static file server for better compatibility:

```bash
# Using Python
cd /workspace/chats/d3accba782cb8366727d20e9
python3 -m http.server 8000
```

Then open http://localhost:8000/src/index.html

### Test Images

To test the application without real astrophotography data, use the test image generator:

1. Open `tools/generate-test-images.html` in a browser
2. Configure the test image parameters
3. Generate test frames
4. Download and load them into the main application

### Running Tests

To run the automated test suite:

```bash
npm install
npm test  # or: node tests/simple-test.js
```

All 21 module tests should pass.

## Documentation

See [docs/architecture.md](docs/architecture.md) for system architecture details.

## Status

✅ **Application Complete** - All core features implemented and tested.

### Completed Features

- ✅ File loading for light, bias, dark, and flat frames
- ✅ Master calibration frame creation (median combine)
- ✅ Calibration application to light frames
- ✅ Star-based image alignment
- ✅ Frame normalization
- ✅ Stacking with multiple methods (median, average, sigma clipping)
- ✅ Background/gradient correction
- ✅ Histogram stretching and color adjustments
- ✅ Export to PNG, JPEG, WebP
- ✅ Real-time preview with zoom controls
- ✅ Complete processing pipeline UI
- ✅ Test image generator for demo
- ✅ Unit tests (21 tests passing)

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed progress and [STATUS.md](STATUS.md) for current status.

## Not a Copy

This project is inspired by Astro Pixel Processor but is not a copy. We implement similar workflow concepts while making our own design decisions. Features may differ, and we may add capabilities beyond what APP offers.
