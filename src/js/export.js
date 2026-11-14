/**
 * Export Module
 * Handles saving processed images in various formats
 */

class ExportManager {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
    }

    /**
     * Export image as download
     */
    async exportImage(format = 'png', quality = 0.92, filename = 'astro-stacked') {
        const dataUrl = this.processor.toDataURL(format, quality);
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { format, filename: `${filename}.${format}`, success: true };
    }

    /**
     * Export as blob and return
     */
    async exportAsBlob(format = 'png', quality = 0.92) {
        return await this.processor.toBlob(format, quality);
    }

    /**
     * Export stack results with metadata
     */
    async exportWithMetadata(format = 'png', quality = 0.92, metadata = {}) {
        const dataUrl = this.processor.toDataURL(format, quality);
        
        // Create a simple HTML page with metadata if HTML format
        if (format === 'html') {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${metadata.title || 'Astro Image'}</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #000; }
        img { max-width: 100%; max-height: 100vh; }
        .info { position: fixed; top: 10px; left: 10px; color: #fff; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.7); padding: 10px; }
    </style>
</head>
<body>
    <div class="info">
        <strong>${metadata.title || 'Astro Image'}</strong><br>
        Frames: ${metadata.frameCount || 0}<br>
        Method: ${metadata.method || 'N/A'}<br>
        Date: ${metadata.date || new Date().toISOString()}
    </div>
    <img src="${dataUrl}" alt="${metadata.title || 'Astro Image'}">
</body>
</html>
            `;
            
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${metadata.filename || 'astro-image'}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return { format: 'html', success: true };
        }
        
        // For image formats, just download
        return await this.exportImage(format, quality, metadata.filename || 'astro-stacked');
    }

    /**
     * Save multiple formats
     */
    async exportMultiple(formats = ['png', 'jpeg'], baseFilename = 'astro-stacked', quality = 0.92) {
        const results = [];
        
        for (const format of formats) {
            try {
                const result = await this.exportImage(format, quality, baseFilename);
                results.push(result);
            } catch (e) {
                console.error(`Failed to export ${format}:`, e);
                results.push({ format, success: false, error: e.message });
            }
        }
        
        return results;
    }

    /**
     * Copy image to clipboard
     */
    async copyToClipboard() {
        try {
            const blob = await this.processor.toBlob('png');
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            return { success: true, message: 'Image copied to clipboard' };
        } catch (e) {
            console.error('Failed to copy to clipboard:', e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Save as base64 string
     */
    toBase64(format = 'png', quality = 0.92) {
        return this.processor.toDataURL(format, quality).split(',')[1];
    }

    /**
     * Save raw pixel data as JSON
     */
    toJSON() {
        const data = this.processor.getImageData();
        const pixels = [];
        
        for (let i = 0; i < data.data.length; i += 4) {
            pixels.push({
                r: data.data[i],
                g: data.data[i + 1],
                b: data.data[i + 2],
                a: data.data[i + 3]
            });
        }
        
        return {
            width: this.processor.width,
            height: this.processor.height,
            pixels: pixels,
            date: new Date().toISOString()
        };
    }

    /**
     * Download as JSON
     */
    downloadJSON(filename = 'astro-image-data') {
        const json = this.toJSON();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Get export options
     */
    getExportOptions() {
        return [
            { format: 'png', description: 'PNG - Lossless, good for further processing', default: true },
            { format: 'jpeg', description: 'JPEG - Smaller file size, lossy compression', default: false },
            { format: 'webp', description: 'WebP - Modern format, good compression', default: false },
            { format: 'blob', description: 'Raw blob for programmatic use', default: false },
            { format: 'json', description: 'Pixel data as JSON', default: false }
        ];
    }
}

// Export for use
window.ExportManager = ExportManager;
