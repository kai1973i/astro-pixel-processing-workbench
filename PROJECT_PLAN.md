# Astro Pixel Processing Workbench — Project Plan

## Overview
Build a web-based image processing application inspired by Astro Pixel Processor (APP) for deep-sky astrophotography. The application will allow users to import calibration frames (bias, dark, flat), perform stacking with outlier rejection, apply color/gradient corrections, and export results.

**Not a copy**: We will implement core workflow concepts while making our own design decisions.

## Project Structure
```
/workspace/chats/d3accba782cb8366727d20e9/
├── PROJECT_PLAN.md          # This file - plan and progress tracking
├── README.md                # Project overview and usage
├── docs/                    # Documentation
│   ├── architecture.md      # System architecture
│   └── workflow.md          # Processing workflow description
├── src/
│   ├── index.html           # Main HTML page
│   ├── css/
│   │   └── style.css        # Styles
│   ├── js/
│   │   ├── app.js           # Main application
│   │   ├── imageProcessor.js # Image processing core
│   │   ├── calibration.js   # Calibration (bias/dark/flat)
│   │   ├── stacker.js       # Stacking with rejection
│   │   ├── aligner.js       # Image alignment
│   │   ├── colorCorrect.js  # Color/gradient corrections
│   │   └── export.js        # Export functionality
│   └── components/          # UI components
├── tests/                   # Tests
├── data/                    # Sample data (if any)
└── docs/                    # Documentation output
```

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETED
- [x] Research and understand APP workflow
- [x] Set up project structure
- [x] Create basic HTML/CSS UI
- [x] Implement file import (light frames, calibration frames)
- [x] Image display and basic visualization

### Phase 2: Calibration ✅ COMPLETED
- [x] Bias, dark, flat frame loading
- [x] Master calibration frame creation
- [x] Calibration application to light frames

### Phase 3: Alignment ✅ COMPLETED
- [x] Star detection for alignment
- [x] Image registration/alignment
- [x] Reference frame selection

### Phase 4: Stacking ✅ COMPLETED
- [x] Normalization
- [x] Outlier rejection (sigma clipping, etc.)
- [x] Integration/stacking
- [x] Weight maps, rejection maps

### Phase 5: Post-processing ✅ COMPLETED
- [x] Background/gradient correction
- [x] Color calibration
- [x] Stretching preview
- [x] Selective adjustments

### Phase 6: Export and Polish ✅ COMPLETED
- [x] Export to PNG/JPEG/WebP
- [x] Batch operations framework
- [x] UI polish
- [x] Documentation

### Phase 7: Testing & Verification ✅ COMPLETED
- [x] Unit tests for core modules (21 tests passing)
- [x] HTTP server verification
- [x] JavaScript syntax validation

## Current Status: APPLICATION COMPLETE

The application is fully functional with all core features implemented:
- File loading for light, bias, dark, and flat frames
- Master calibration frame creation (median combine)
- Calibration application to light frames
- Star-based image alignment
- Frame normalization
- Stacking with multiple methods (median, average, sigma clipping)
- Background/gradient correction
- Histogram stretching and color adjustments
- Export to PNG, JPEG, WebP
- Real-time preview with zoom controls
- Complete processing pipeline UI

## Next Steps / Potential Enhancements

### Optional Improvements
- [ ] Create sample/test images for demonstration
- [ ] Test with real astrophotography images
- [ ] Add Web Worker support for background processing
- [ ] Add undo/redo support
- [ ] Support FITS file format
- [ ] Performance optimizations for large images
- [ ] Project save/load functionality
- [ ] Preset management
- [ ] Drizzle integration
- [ ] More advanced rejection algorithms

## Control/Agent Approach
- I will work autonomously, implementing features incrementally
- Each phase will be tested before moving on
- Documentation will be updated as we progress
- The PLAN file tracks progress and next steps

## Technology Decisions
- **Frontend**: HTML5 + JavaScript (vanilla or minimal framework)
- **Image Processing**: Canvas API for basic operations, potentially WebGL for performance
- **File I/O**: Browser File API for loading, download for export
- **No backend needed** for initial version (client-side processing)

## Deviations from APP
- Web-based instead of desktop
- May simplify some advanced features initially
- Will add modern UI/UX considerations
- Could add features APP doesn't have (real-time preview, undo/redo, etc.)
