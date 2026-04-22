import { useEffect, useRef } from 'react';

/**
 * Hook untuk mendeteksi input dari barcode/QR scanner HID eksternal
 * (USB atau Bluetooth yang bertindak sebagai keyboard).
 *
 * Scanner HID mengetik karakter sangat cepat (<50ms antar karakter)
 * dan biasanya diakhiri dengan Enter. Hook ini membedakan input
 * scanner dari ketikan manual berdasarkan kecepatan input.
 *
 * @param onScan - Callback dipanggil saat barcode terdeteksi
 * @param enabled - Aktifkan/nonaktifkan listener (default: true)
 * @param minLength - Panjang minimum kode yang valid (default: 3)
 * @param maxIntervalMs - Jeda maksimum antar karakter untuk dianggap scanner (default: 50ms)
 */
export function useHidScanner(
    onScan: (code: string) => void,
    enabled = true,
    minLength = 3,
    maxIntervalMs = 50,
) {
    const bufferRef = useRef('');
    const lastKeyTimeRef = useRef(0);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Abaikan jika focus ada di input/textarea/select
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            const now = Date.now();
            const interval = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            // Reset buffer jika jeda terlalu lama (bukan scanner)
            if (interval > maxIntervalMs && bufferRef.current.length > 0) {
                bufferRef.current = '';
            }

            if (e.key === 'Enter') {
                const code = bufferRef.current.trim();
                bufferRef.current = '';
                if (code.length >= minLength) {
                    onScan(code);
                }
                return;
            }

            // Hanya ambil karakter printable (panjang 1)
            if (e.key.length === 1) {
                bufferRef.current += e.key;
            }

            // Auto-clear buffer jika tidak ada Enter dalam 200ms
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => {
                bufferRef.current = '';
            }, 200);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, [enabled, minLength, maxIntervalMs, onScan]);
}
