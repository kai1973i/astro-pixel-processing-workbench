# Processing Workflow Guide

This document describes the typical workflow for processing astrophotography images using the Astro Pixel Processing Workbench.

## Overview

The application follows a pipeline-based workflow inspired by professional astrophotography processing tools like Astro Pixel Processor (APP). The typical workflow is:

1. Load frames
2. Create calibration masters
3. Calibrate light frames
4. Align frames
5. Normalize
6. Stack
7. Post-process
8. Export

## Step-by-Step Guide

### Step 1: Load Frames

**What to load:**
- **Light frames**: Your actual astrophotography exposures (the images you want to stack)
- **Bias frames** (optional): Short exposures with the shutter closed, used to remove read noise
- **Dark frames** (optional): Same exposure time as lights, with shutter closed, for thermal noise
- **Flat frames** (optional): Uniform illumination exposures for vignetting/dust correction

**How to load:**
1. Click "Load Lights" and select your light frame images
2. Click "Load Bias", "Load Darks", or "Load Flats" for calibration frames
3. The frame counts will update in the UI

### Step 2: Create Master Calibration Frames

If you loaded calibration frames, create master frames:

1. Click "Create Masters" button
2. The application will create:
   - **Master Bias**: Median combine of all bias frames
   - **Master Dark**: Median combine of all dark frames
   - **Master Flat**: Normalized median combine of all flat frames

**Note:** You need at least 1 frame of each type to create masters.

### Step 3: Run Calibration

Apply calibration to your light frames:

1. Ensure you have light frames loaded
2. Ensure masters are created (if using calibration)
3. Click "Run Calibration"
4. The application will:
   - Load each light frame
   - Subtract master dark (if available)
   - Subtract master bias (if available)
   - Divide by master flat (if available)
5. Calibrated frames are stored for the next steps

### Step 4: Run Alignment

Align frames using star detection:

1. Ensure you have calibrated frames (or at least 2 light frames)
2. Click "Run Alignment"
3. The application will:
   - Detect stars in the reference frame (first frame)
   - Detect stars in each frame to align
   - Match stars between frames
   - Calculate transformation parameters
   - Warp frames to align with reference

**Note:** Alignment works best with images that have prominent stars.

### Step 5: Run Normalization

Normalize frame brightness levels:

1. Ensure you have aligned frames
2. Click "Run Normalization"
3. Each frame is scaled to have similar mean brightness
4. This prepares frames for stacking

### Step 6: Run Stacking

Integrate aligned frames:

1. Ensure you have normalized frames
2. Select stacking method:
   - **Median**: Good rejection of outliers (cosmic rays, satellites)
   - **Average**: Simple mean, maximum SNR improvement
   - **Sigma Clipping**: Rejects outliers based on sigma threshold
3. Adjust sigma/rejection settings if needed
4. Click "Run Stack"
5. The stacked result is displayed

**Stacking methods:**
- **Median**: Best for rejecting transient artifacts
- **Average**: Best SNR for clean data
- **Sigma Clipping**: Balance between rejection and SNR

### Step 7: Post-Processing (Optional)

Apply adjustments to enhance the result:

**Background Correction:**
- Use "Background Level" slider to subtract residual background
- For more advanced correction, use gradient removal (in code)

**Stretching:**
- **Black Point**: Set the black level (hide noise floor)
- **White Point**: Set the white level (prevent saturation)
- **Gamma**: Adjust mid-tone brightness (lower = brighter shadows)

**Color Adjustments:**
- **Brightness**: Overall brightness
- **Contrast**: Difference between light and dark
- **Saturation**: Color intensity

### Step 8: Export

Save your processed image:

1. Select export format (PNG, JPEG, WebP)
2. Click "Export Image"
3. File downloads to your computer

**Format recommendations:**
- **PNG**: Lossless, best for further processing
- **JPEG**: Smaller file, good for sharing
- **WebP**: Modern format, good compression

## Tips for Best Results

### Image Preparation
- Use consistent exposure times for light frames
- Take sufficient calibration frames (at least 5-10 of each type)
- Ensure flat frames are properly exposed (not too dark or saturated)

### Processing Order
- Always calibrate before aligning
- Align before stacking
- Normalize before stacking
- Post-process after stacking

### Parameter Selection
- Start with default settings
- Adjust based on image quality
- For noisy data, use more aggressive rejection
- For clean data, use average stacking for best SNR

## Troubleshooting

### No stars detected for alignment
- Images may be too noisy - try shorter stacking or more frames
- Exposure may be too short - stars not visible
- Try using images with more prominent stars

### Stacked image is too dark
- Adjust white point and gamma in post-processing
- Check if calibration was applied correctly

### Stacked image has artifacts
- Increase rejection threshold
- Try different stacking method
- Check for cosmic ray hits or satellite trails

### Calibration not working
- Ensure master frames are created
- Check that calibration frame dimensions match light frames
- Master frames are only used if available

## Advanced Features

### Batch Processing
The application supports loading multiple frames of each type for batch processing.

### Real-time Preview
Adjustments are applied in real-time to the displayed image. The original stacked result is preserved; only the preview is modified.

### Zoom Controls
Use zoom buttons to examine details:
- **Zoom In**: Magnify view
- **Zoom Out**: Reduce magnification
- **Fit**: Fit image to screen

## File Format Support

The application loads standard image formats supported by browsers:
- PNG
- JPEG/JPG
- WebP
- BMP
- GIF (first frame only)

For FITS format support, additional libraries would be needed.

---

For more information, see the [Project README](../README.md) and [Architecture Documentation](architecture.md).
