import { useEffect, useState } from 'react';

/**
 * Converts an image URL to a grayscale base64 data URL using canvas.
 * Returns null while loading or if conversion fails.
 */
export function useGrayscaleImage(src: string | null | undefined): string | null {
    const [result, setResult] = useState<string | null>(null);

    useEffect(() => {
        if (!src) { setResult(null); return; }

        let cancelled = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            if (cancelled) return;
            try {
                // Max width 200px untuk struk — cukup tajam, tidak terlalu besar
                const maxW = 200;
                const scale = Math.min(1, maxW / img.naturalWidth);
                const w = Math.round(img.naturalWidth * scale);
                const h = Math.round(img.naturalHeight * scale);

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d')!;

                // Putih background (printer thermal = kertas putih)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);

                // Convert ke grayscale pixel by pixel
                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // Luminance formula (perceptual)
                    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                    data[i + 3] = 255; // fully opaque
                }
                ctx.putImageData(imageData, 0, 0);

                setResult(canvas.toDataURL('image/png'));
            } catch {
                // CORS atau canvas tainted — fallback ke original
                setResult(src);
            }
        };

        img.onerror = () => { if (!cancelled) setResult(null); };
        img.src = src;

        return () => { cancelled = true; };
    }, [src]);

    return result;
}
