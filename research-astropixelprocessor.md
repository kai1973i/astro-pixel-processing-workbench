# Astro Pixel Processing — Web Research Summary

## What it is
Astro Pixel Processor (APP) is a desktop application for processing deep-sky astrophotography images. It provides a complete workflow from calibration through stacking, color calibration, and export.

## Main features
1. **Calibration**: Uses bias, dark, and flat frames to calibrate light frames; supports bad pixel maps.
2. **Star analysis and registration**: Detects stars, aligns frames, includes distortion correction, supports mosaic registration.
3. **Normalization and stacking**: Normalizes frames, outlier rejection, produces rejection/weight/normalization maps, supports drizzle.
4. **Mosaics and batch operations**: Automatic mosaic creation, batch rotate/resize/crop/uncrop.
5. **Post-stack processing**: Light pollution/gradient removal, background and star color calibration, RGB/Luminance composites (LRGB, narrowband palettes), selective color adjustments.
6. **Preview and stretching**: Contrast, saturation, sharpening controls for preview.
7. **Export**: FITS, TIFF, JPG.

## Typical workflow
1. Load light frames + calibration frames (bias/dark/flat)
2. Create calibration masters, assign to lights
3. Star analysis, possibly select reference frame
4. Register/align frames
5. Normalize, then integrate/stack
6. For mosaics or color/narrowband: combine panels/channels
7. Gradient/background correction, star color calibration, selective color adjustments
8. Preview, stretch, export

## Source
- Main page: https://www.astropixelprocessor.com
- Feature list: https://www.astropixelprocessor.com/a-complete-deep-sky-image-processing-application
- Tutorial: calibration → star analysis → registration → normalization → integration

## Notes for our implementation
- We will build a web-based image processing pipeline inspired by this workflow.
- Not a 1:1 copy; we can deviate and add features.
- Core capabilities to implement: calibration frame handling, alignment, stacking with rejection, color/gradient adjustments, export.
- For web: use HTML5 Canvas / WebGL for image processing, or server-side with Python/OpenCV if needed.
