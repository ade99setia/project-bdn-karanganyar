/**
 * ESC/POS Encoder — pure TypeScript, no dependencies
 * Supports: text, alignment, bold, font size, separator, cut, bitmap image
 */

export type Align = 'left' | 'center' | 'right';
export type PaperWidth = 58 | 80;

// Character width per paper size (chars per line at normal font)
const CHARS: Record<PaperWidth, number> = { 58: 32, 80: 48 };
// Printable pixel width per paper size
const PIXELS: Record<PaperWidth, number> = { 58: 384, 80: 576 };

export class EscPos {
    private buf: number[] = [];
    private cols: number;
    private maxPx: number;

    constructor(private paperWidth: PaperWidth = 80) {
        this.cols = CHARS[paperWidth];
        this.maxPx = PIXELS[paperWidth];
        this.init();
    }

    // ── Init ──────────────────────────────────────────────────────────────

    private init(): this {
        this.raw([0x1b, 0x40]); // ESC @ — initialize
        this.raw([0x1b, 0x74, 0x00]); // code page PC437
        return this;
    }

    // ── Raw bytes ─────────────────────────────────────────────────────────

    raw(bytes: number[]): this {
        this.buf.push(...bytes);
        return this;
    }

    // ── Alignment ─────────────────────────────────────────────────────────

    align(a: Align): this {
        const map = { left: 0, center: 1, right: 2 };
        return this.raw([0x1b, 0x61, map[a]]);
    }

    // ── Bold ──────────────────────────────────────────────────────────────

    bold(on: boolean): this {
        return this.raw([0x1b, 0x45, on ? 1 : 0]);
    }

    // ── Font size ─────────────────────────────────────────────────────────

    /** size: 1 = normal, 2 = double width+height */
    size(s: 1 | 2): this {
        const v = s === 2 ? 0x11 : 0x00;
        return this.raw([0x1d, 0x21, v]);
    }

    // ── Text ──────────────────────────────────────────────────────────────

    text(str: string): this {
        this.buf.push(...this.encodeText(str));
        return this;
    }

    println(str = ''): this {
        return this.text(str).raw([0x0a]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    separator(char = '-'): this {
        return this.println(char.repeat(this.cols));
    }

    doubleSep(): this {
        return this.println('='.repeat(this.cols));
    }

    row(left: string, right: string): this {
        const maxLeft = this.cols - right.length - 1;
        const l = left.length > maxLeft ? left.substring(0, maxLeft) : left;
        const pad = this.cols - l.length - right.length;
        return this.println(l + ' '.repeat(Math.max(1, pad)) + right);
    }

    itemRow(name: string, qty: string, price: string): this {
        const rightWidth = qty.length + 1 + price.length;
        const maxName = this.cols - rightWidth - 1;
        const n = name.length > maxName ? name.substring(0, maxName) : name.padEnd(maxName);
        return this.println(`${n} ${qty} ${price}`);
    }

    feed(n = 1): this {
        return this.raw([0x1b, 0x64, n]);
    }

    cut(): this {
        return this.raw([0x1d, 0x56, 0x00]);
    }

    partialCut(): this {
        return this.raw([0x1d, 0x56, 0x01]);
    }

    // ── Bitmap image (GS v 0) ─────────────────────────────────────────────

    /**
     * Print a bitmap from an ImageData (already grayscale).
     * Uses Floyd-Steinberg dithering for best quality.
     * Max width is capped to paper pixel width.
     */
    image(imageData: ImageData): this {
        const srcW = imageData.width;
        const srcH = imageData.height;

        // Scale down if wider than paper
        const scale = srcW > this.maxPx ? this.maxPx / srcW : 1;
        const w = Math.floor(srcW * scale);
        const h = Math.floor(srcH * scale);

        // Build grayscale float array (0=black, 1=white) with bilinear scaling
        const gray = new Float32Array(w * h);
        const src = imageData.data;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const sx = Math.min(Math.floor(x / scale), srcW - 1);
                const sy = Math.min(Math.floor(y / scale), srcH - 1);
                const i = (sy * srcW + sx) * 4;
                // Luminance
                gray[y * w + x] = (0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]) / 255;
            }
        }

        // Floyd-Steinberg dithering → 1-bit
        const bits = new Uint8Array(w * h); // 1 = black dot, 0 = white
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const old = gray[idx];
                const nw = old < 0.5 ? 0 : 1;
                bits[idx] = 1 - nw; // invert: 1 = print dot
                const err = old - nw;
                if (x + 1 < w)           gray[idx + 1]     += err * 7 / 16;
                if (y + 1 < h) {
                    if (x > 0)            gray[idx + w - 1] += err * 3 / 16;
                                          gray[idx + w]     += err * 5 / 16;
                    if (x + 1 < w)        gray[idx + w + 1] += err * 1 / 16;
                }
            }
        }

        // Pack bits into bytes (8 pixels per byte, MSB first)
        const bytesPerRow = Math.ceil(w / 8);
        const imgBytes: number[] = [];
        for (let y = 0; y < h; y++) {
            for (let bx = 0; bx < bytesPerRow; bx++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const x = bx * 8 + bit;
                    if (x < w && bits[y * w + x]) {
                        byte |= (0x80 >> bit);
                    }
                }
                imgBytes.push(byte);
            }
        }

        // GS v 0 command: print raster bitmap
        // Format: GS 'v' '0' m xL xH yL yH [data]
        const xL = bytesPerRow & 0xff;
        const xH = (bytesPerRow >> 8) & 0xff;
        const yL = h & 0xff;
        const yH = (h >> 8) & 0xff;
        this.raw([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        this.raw(imgBytes);

        return this;
    }

    // ── Output ────────────────────────────────────────────────────────────

    build(): Uint8Array {
        return new Uint8Array(this.buf);
    }

    // ── Internal ──────────────────────────────────────────────────────────

    private encodeText(str: string): number[] {
        const normalized = str
            .replace(/[àáâãäå]/gi, 'a')
            .replace(/[èéêë]/gi, 'e')
            .replace(/[ìíîï]/gi, 'i')
            .replace(/[òóôõö]/gi, 'o')
            .replace(/[ùúûü]/gi, 'u')
            .replace(/[ñ]/gi, 'n')
            .replace(/[ç]/gi, 'c')
            .replace(/[😊🙏]/g, ':)');

        const bytes: number[] = [];
        for (let i = 0; i < normalized.length; i++) {
            const code = normalized.charCodeAt(i);
            bytes.push(code < 256 ? code : 0x3f);
        }
        return bytes;
    }
}

// ── Helper: load image URL → ImageData (browser only) ─────────────────────

export function loadImageData(src: string, maxWidth = 200): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.naturalWidth);
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(ctx.getImageData(0, 0, w, h));
        };
        img.onerror = reject;
        img.src = src;
    });
}
