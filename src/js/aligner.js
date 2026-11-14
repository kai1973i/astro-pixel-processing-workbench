/**
 * Aligner Module
 * Handles image registration and alignment using star detection
 */

class Aligner {
    constructor(imageProcessor) {
        this.processor = imageProcessor;
    }

    /**
     * Detect stars in an image using simple thresholding
     * Returns array of {x, y, brightness, size}
     */
    detectStars(imageData) {
        const pixels = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Convert to grayscale first
        const gray = new Float32Array(width * height);
        let sum = 0;
        for (let i = 0; i < width * height; i++) {
            const idx = i * 4;
            gray[i] = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
            sum += gray[i];
        }
        
        const mean = sum / (width * height);
        
        // Simple star detection: find local maxima above threshold
        const threshold = mean + (255 - mean) * 0.3; // Top 30% of dynamic range
        const stars = [];
        const detected = new Uint8Array(width * height);
        
        // Find local maxima
        const searchRadius = 3;
        for (let y = searchRadius; y < height - searchRadius; y++) {
            for (let x = searchRadius; x < width - searchRadius; x++) {
                const idx = y * width + x;
                
                if (detected[idx] || gray[idx] < threshold) continue;
                
                // Check if this is a local maximum
                let isMax = true;
                let localMax = gray[idx];
                
                for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ni = (y + dy) * width + (x + dx);
                        if (gray[ni] > localMax) {
                            isMax = false;
                            break;
                        }
                    }
                    if (!isMax) break;
                }
                
                if (isMax) {
                    detected[idx] = 1;
                    
                    // Calculate centroid and brightness
                    let sumX = 0, sumY = 0, sumBrightness = 0;
                    const centroidRadius = 4;
                    
                    for (let dy = -centroidRadius; dy <= centroidRadius; dy++) {
                        for (let dx = -centroidRadius; dx <= centroidRadius; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const ni = ny * width + nx;
                                const brightness = gray[ni];
                                if (brightness > threshold * 0.5) {
                                    sumX += nx * brightness;
                                    sumY += ny * brightness;
                                    sumBrightness += brightness;
                                }
                            }
                        }
                    }
                    
                    if (sumBrightness > 0) {
                        stars.push({
                            x: sumX / sumBrightness,
                            y: sumY / sumBrightness,
                            brightness: sumBrightness,
                            size: Math.sqrt(sumBrightness / 255)
                        });
                    }
                }
            }
        }
        
        // Filter out weak stars and sort by brightness
        const minBrightness = threshold * 1.2;
        return stars.filter(s => s.brightness > minBrightness)
                    .sort((a, b) => b.brightness - a.brightness)
                    .slice(0, 200); // Limit to top 200 stars
    }

    /**
     * Match stars between two images
     * Returns array of { refX, refY, curX, curY }
     */
    matchStars(refStars, curStars) {
        const matches = [];
        const maxDistance = 50; // Maximum pixel distance for match
        
        for (const refStar of refStars) {
            let bestMatch = null;
            let bestDist = Infinity;
            
            for (const curStar of curStars) {
                const dx = refStar.x - curStar.x;
                const dy = refStar.y - curStar.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < maxDistance && dist < bestDist) {
                    bestDist = dist;
                    bestMatch = curStar;
                }
            }
            
            if (bestMatch) {
                matches.push({
                    refX: refStar.x,
                    refY: refStar.y,
                    curX: bestMatch.x,
                    curY: bestMatch.y
                });
            }
        }
        
        // Need at least 3 matches for transformation
        return matches.length >= 3 ? matches : [];
    }

    /**
     * Calculate affine transformation from matched points
     * Returns transformation parameters
     */
    calculateTransformation(matches) {
        if (matches.length < 3) {
            return null;
        }

        // Use least squares to fit affine transformation
        // x' = a*x + b*y + c
        // y' = d*x + e*y + f
        
        const n = matches.length;
        let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
        let sumXRef = 0, sumYRef = 0;
        
        for (const m of matches) {
            sumX += m.curX;
            sumY += m.curY;
            sumX2 += m.curX * m.curX;
            sumY2 += m.curY * m.curY;
            sumXY += m.curX * m.curY;
            sumXRef += m.refX;
            sumYRef += m.refY;
        }
        
        const meanX = sumX / n;
        const meanY = sumY / n;
        const meanXRef = sumXRef / n;
        const meanYRef = sumYRef / n;
        
        // Calculate covariance matrix elements
        const sXX = sumX2 - n * meanX * meanX;
        const sYY = sumY2 - n * meanY * meanY;
        const sXY = sumXY - n * meanX * meanY;
        
        // Calculate cross-covariance
        let sXxRef = 0, sXyRef = 0, sYxRef = 0, sYyRef = 0;
        
        for (const m of matches) {
            sXxRef += (m.curX - meanX) * (m.refX - meanXRef);
            sXyRef += (m.curX - meanX) * (m.refY - meanYRef);
            sYxRef += (m.curY - meanY) * (m.refX - meanXRef);
            sYyRef += (m.curY - meanY) * (m.refY - meanYRef);
        }
        
        // Solve for affine parameters
        const det = sXX * sYY - sXY * sXY;
        if (Math.abs(det) < 1e-10) {
            return null;
        }
        
        const a = (sXxRef * sYY - sXyRef * sXY) / det;
        const b = (sXyRef * sXX - sXxRef * sXY) / det;
        const d = (sYxRef * sYY - sYyRef * sXY) / det;
        const e = (sYyRef * sXX - sYxRef * sXY) / det;
        const c = meanXRef - a * meanX - b * meanY;
        const f = meanYRef - d * meanX - e * meanY;
        
        return { a, b, c, d, e, f };
    }

    /**
     * Apply affine transformation to align an image to reference
     */
    alignToReference(imageData, transform, refWidth, refHeight) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        
        // Create output buffer
        const outputData = new Uint8ClampedArray(refWidth * refHeight * 4);
        
        // Inverse transform for each output pixel
        // x = (e*(x'-c) - b*(y'-f)) / (a*e - b*d)
        // y = (a*(y'-f) - d*(x'-c)) / (a*e - b*d)
        
        const det = transform.a * transform.e - transform.b * transform.d;
        
        if (Math.abs(det) < 1e-10) {
            return imageData; // Can't transform
        }
        
        const invDet = 1 / det;
        
        // Fill with black
        for (let i = 0; i < outputData.length; i++) {
            outputData[i] = 0;
        }
        outputData[3] = 255; // Alpha for first pixel
        
        for (let y = 0; y < refHeight; y++) {
            for (let x = 0; x < refWidth; x++) {
                // Inverse transform
                const srcX = (transform.e * (x - transform.c) - transform.b * (y - transform.f)) * invDet;
                const srcY = (transform.a * (y - transform.f) - transform.d * (x - transform.c)) * invDet;
                
                // Bilinear interpolation
                if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
                    const x1 = Math.floor(srcX);
                    const y1 = Math.floor(srcY);
                    const x2 = x1 + 1;
                    const y2 = y1 + 1;
                    
                    const fx = srcX - x1;
                    const fy = srcY - y1;
                    
                    const idx11 = (y1 * width + x1) * 4;
                    const idx12 = (y1 * width + x2) * 4;
                    const idx21 = (y2 * width + x1) * 4;
                    const idx22 = (y2 * width + x2) * 4;
                    
                    const oIdx = (y * refWidth + x) * 4;
                    
                    for (let c = 0; c < 3; c++) {
                        const v11 = pixels[idx11 + c];
                        const v12 = pixels[idx12 + c];
                        const v21 = pixels[idx21 + c];
                        const v22 = pixels[idx22 + c];
                        
                        outputData[oIdx + c] = Math.round(
                            v11 * (1 - fx) * (1 - fy) +
                            v12 * fx * (1 - fy) +
                            v21 * (1 - fx) * fy +
                            v22 * fx * fy
                        );
                    }
                    outputData[oIdx + 3] = 255;
                }
            }
        }
        
        return new ImageData(outputData, refWidth, refHeight);
    }

    /**
     * Align multiple frames to a reference frame
     */
    async alignFrames(frames, referenceIndex = 0) {
        console.log(`Aligning ${frames.length} frames to reference ${referenceIndex}...`);
        
        const results = [];
        const refFrame = frames[referenceIndex];
        const refStars = this.detectStars(refFrame.data);
        
        console.log(`Detected ${refStars.length} stars in reference frame`);
        
        for (let i = 0; i < frames.length; i++) {
            if (i === referenceIndex) {
                results.push(frames[i]);
                continue;
            }
            
            const curStars = this.detectStars(frames[i].data);
            console.log(`Frame ${i}: detected ${curStars.length} stars`);
            
            const matches = this.matchStars(refStars, curStars);
            console.log(`Frame ${i}: ${matches.length} star matches`);
            
            if (matches.length < 3) {
                console.warn(`Frame ${i}: insufficient matches, skipping alignment`);
                results.push(frames[i]);
                continue;
            }
            
            const transform = this.calculateTransformation(matches);
            if (!transform) {
                console.warn(`Frame ${i}: could not calculate transformation`);
                results.push(frames[i]);
                continue;
            }
            
            const aligned = this.alignToReference(
                frames[i].data,
                transform,
                refFrame.width,
                refFrame.height
            );
            
            results.push({
                image: frames[i].image,
                data: aligned,
                width: refFrame.width,
                height: refFrame.height
            });
        }
        
        console.log('Alignment complete');
        return results;
    }

    /**
     * Get alignment quality metrics
     */
    getAlignmentInfo(frames, alignedFrames) {
        return {
            totalFrames: frames.length,
            alignedFrames: alignedFrames.length,
            referenceFrame: 0,
            starMatches: frames.map((f, i) => ({
                frame: i,
                stars: this.detectStars(f.data).length
            }))
        };
    }
}

// Export for use
window.Aligner = Aligner;
