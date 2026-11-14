# Architecture

## Overview

The Astro Pixel Processing Workbench is a client-side web application for astrophotography image processing. All processing happens in the browser using the Canvas API.

## Components

### 1. App Controller (`app.js`)
Main application controller that:
- Manages application state
- Coordinates between modules
- Handles UI events
- Manages the processing pipeline

### 2. Image Loader
Handles loading of image files:
- Supports FITS (if implemented) and common image formats
- Manages file lists for lights, biases, darks, flats
- Provides progress feedback

### 3. Calibration Module (`calibration.js`)
Handles calibration frame processing:
- Master bias creation (median combine of bias frames)
- Master dark creation (median combine, temperature matching if available)
- Master flat creation (normalized median combine)
- Calibration application (subtract dark, divide flat)

### 4. Aligner Module (`aligner.js`)
Image alignment using star detection:
- Star detection (centroid finding)
- Reference frame selection
- Geometric transformation estimation
- Image warping/resampling

### 5. Stacker Module (`stacker.js`)
Image integration with rejection:
- Frame normalization
- Outlier rejection methods (sigma clipping, min/max rejection)
- Weighted integration
- Creation of rejection/weight maps

### 6. Post-processing Module (`colorCorrect.js`)
Post-stack adjustments:
- Background/gradient removal
- Color calibration
- Stretching (log, power, histogram)
- Selective color adjustments

### 7. Export Module (`export.js`)
Save processed images:
- PNG export
- JPEG export
- FITS export (if implemented)

## Data Flow

```
Image Files → Load → Calibration → Alignment → Normalization → Stacking → Post-process → Export
```

## State Management

Application state is kept in a central state object:
```javascript
{
  frames: {
    lights: [],
    biases: [],
    darks: [],
    flats: []
  },
  masters: {
    bias: null,
    dark: null,
    flat: null
  },
  calibratedFrames: [],
  alignedFrames: [],
  stackedResult: null,
  settings: {
    // Processing parameters
  }
}
```

## Performance Considerations

- Large images may need tiling for processing
- Web Workers could be used for heavy computations
- Canvas operations are synchronous; consider chunking for large stacks
