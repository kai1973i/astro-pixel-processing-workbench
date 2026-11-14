# Astro Pixel Processing Workbench

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F25?logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![No Build](https://img.shields.io/badge/Build-no--build-181717?logo=github)](https://github.com)

> A web-based astrophotography image processing application inspired by Astro Pixel Processor (APP)

![Screenshot](docs/screenshot.png)

## ⚡ Quick Start

Open `src/index.html` in a modern web browser, or serve locally:

```bash
# Using Python
python3 -m http.server 8000
# Then open http://localhost:8000/src/index.html
```

Or with Node.js:

```bash
npx http-server
# Then open http://localhost:8080/src/index.html
```

No build step required! Works entirely in the browser.

## ✨ Features

- **📸 Frame Loading** - Load light, bias, dark, and flat frames
- **🔬 Calibration** - Create master calibration frames (bias, dark, flat) and apply to light frames
- **⭐ Alignment** - Star-based image registration and alignment
- **📊 Stacking** - Multiple methods: median, average, sigma clipping with outlier rejection
- **🎨 Post-Processing** - Background/gradient correction, histogram stretching, color adjustments
- **💾 Export** - Save as PNG, JPEG, WebP
- **⚡ Real-time Preview** - Interactive adjustments with zoom controls
- **🧪 Test Generator** - Generate synthetic test images for demo
- **✅ Tests** - 21 unit tests passing

## 🚀 Workflow

```
1. Load frames → 2. Create masters → 3. Calibrate → 4. Align → 5. Normalize → 6. Stack → 7. Post-process → 8. Export
```

See [docs/workflow.md](docs/workflow.md) for detailed instructions.

## 📖 Documentation

- [Architecture](docs/architecture.md) - System design and components
- [Workflow Guide](docs/workflow.md) - Step-by-step processing guide
- [Publishing Guide](PUBLISH.md) - How to publish to GitHub

## 🛠️ Technology

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Image Processing:** Canvas API with `willReadFrequently` optimization
- **No Backend Required** - Runs entirely client-side
- **No Dependencies** - Zero external libraries for core functionality

## 🧪 Running Tests

```bash
npm install
npm test
```

Or run directly with Node.js:

```bash
node tests/simple-test.js
```

All 21 module tests should pass.

## 🎯 Generated Test Images

Generate synthetic test images to try the application without real astrophotography data:

1. Open `tools/generate-test-images.html` in a browser
2. Configure parameters (size, star count, noise level, etc.)
3. Click "Generate Images"
4. Download and load into the main application

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgment

This project is **inspired by** [Astro Pixel Processor (APP)](https://www.astropixelprocessor.com) but is **not a copy**. It implements similar workflow concepts while making its own design decisions.

## 📧 Contact

For questions or support, open an issue on GitHub.

---

**Project Status:** ✅ Complete - All core features implemented and tested
