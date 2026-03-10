declare module '@capacitor-mlkit/barcode-scanning' {
    export const BarcodeScanner: {
        isSupported: () => Promise<{ supported?: boolean }>;
        requestPermissions: () => Promise<{ camera?: string }>;
        scan: (options?: Record<string, unknown>) => Promise<{
            barcodes?: Array<{ rawValue?: string; displayValue?: string }>;
        }>;
        stopScan?: () => Promise<void>;
    };
}
