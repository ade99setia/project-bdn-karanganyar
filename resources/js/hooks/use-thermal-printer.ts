/**
 * useThermalPrinter
 * WebSerial-first, WebUSB fallback untuk thermal printer ESC/POS
 *
 * Usage:
 *   const { print, status, error, isSupported } = useThermalPrinter();
 *   await print(escPosBytes);
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type PrinterStatus = 'idle' | 'connecting' | 'printing' | 'done' | 'error';

interface UseThermalPrinterReturn {
    print: (data: Uint8Array) => Promise<boolean>;
    status: PrinterStatus;
    error: string | null;
    isSupported: boolean;
    hasCachedPort: boolean;
    mode: 'serial' | 'usb' | null;
    resetPort: () => void;
}

export function useThermalPrinter(): UseThermalPrinterReturn {
    const [status, setStatus] = useState<PrinterStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'serial' | 'usb' | null>(null);
    const [hasCachedPort, setHasCachedPort] = useState<boolean>(false);

    // Cache port/device agar tidak perlu grant permission tiap kali
    const serialPortRef = useRef<any>(null);
    const usbDeviceRef = useRef<any>(null);

    const isSupported = 'serial' in navigator || 'usb' in navigator;

    // Cek async apakah sudah ada port yang di-grant browser
    useEffect(() => {
        if (!('serial' in navigator)) return;
        (navigator as any).serial.getPorts().then((ports: any[]) => {
            setHasCachedPort(ports.length > 0);
        }).catch(() => {});
    }, []);

    // ── WebSerial ──────────────────────────────────────────────────────────

    const printSerial = useCallback(async (data: Uint8Array): Promise<boolean> => {
        const STORAGE_KEY = 'thermal_printer_port_index';

        try {
            // Ambil semua port yang sudah pernah di-grant
            const ports: any[] = await (navigator as any).serial.getPorts();

            // Coba auto-connect: prioritaskan port yang terakhir dipakai
            if (!serialPortRef.current && ports.length > 0) {
                const savedIdx = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
                const idx = savedIdx < ports.length ? savedIdx : 0;
                serialPortRef.current = ports[idx];
            }

            // Belum ada port yang di-grant → tampilkan picker
            if (!serialPortRef.current) {
                serialPortRef.current = await (navigator as any).serial.requestPort();
                // Simpan index port yang dipilih
                const freshPorts: any[] = await (navigator as any).serial.getPorts();
                const idx = freshPorts.indexOf(serialPortRef.current);
                if (idx >= 0) localStorage.setItem(STORAGE_KEY, String(idx));
            }

            const port = serialPortRef.current!;

            // Buka port kalau belum terbuka
            if (!port.writable) {
                try {
                    await port.open({ baudRate: 9600 });
                } catch (openErr: any) {
                    if (!port.writable) {
                        serialPortRef.current = null;
                        throw new Error('Port sedang dipakai. Tutup aplikasi lain yang menggunakan printer, lalu coba lagi.');
                    }
                }
            }

            const writer = port.writable!.getWriter();
            try {
                await writer.write(data);
            } finally {
                writer.releaseLock();
            }
            return true;
        } catch (e: any) {
            if (e?.name === 'NotFoundError' || e?.message?.includes('No port selected')) {
                throw new Error('Tidak ada port yang dipilih');
            }
            if (e?.message?.includes('Failed to open') || e?.message?.includes('Port sedang dipakai')) {
                serialPortRef.current = null;
                throw new Error('Port sedang dipakai. Tutup aplikasi lain yang menggunakan printer, lalu coba lagi.');
            }
            throw e;
        }
    }, []);

    // ── WebUSB ─────────────────────────────────────────────────────────────

    const printUSB = useCallback(async (data: Uint8Array): Promise<boolean> => {
        try {
            // Reuse cached device
            if (!usbDeviceRef.current) {
                usbDeviceRef.current = await (navigator as any).usb.requestDevice({
                    filters: [], // tampilkan semua USB device
                });
            }

            const device = usbDeviceRef.current!;

            if (!device.opened) {
                await device.open();
            }

            // Select configuration & claim interface
            if (device.configuration === null) {
                await device.selectConfiguration(1);
            }

            // Find bulk-out endpoint
            let interfaceNum = 0;
            let endpointNum = 1;

            for (const iface of device.configuration!.interfaces) {
                for (const alt of iface.alternates) {
                    for (const ep of alt.endpoints) {
                        if (ep.direction === 'out' && ep.type === 'bulk') {
                            interfaceNum = iface.interfaceNumber;
                            endpointNum = ep.endpointNumber;
                        }
                    }
                }
            }

            if (!device.configuration!.interfaces[interfaceNum]?.claimed) {
                await device.claimInterface(interfaceNum);
            }

            await device.transferOut(endpointNum, data);
            return true;
        } catch (e: any) {
            if (e?.name === 'NotFoundError' || e?.message?.includes('No device selected')) {
                throw new Error('Tidak ada device yang dipilih');
            }
            throw e;
        }
    }, []);

    // ── Reset port (paksa picker muncul lagi) ──────────────────────────────

    const resetPort = useCallback(() => {
        serialPortRef.current = null;
        usbDeviceRef.current = null;
        localStorage.removeItem('thermal_printer_port_index');
        setHasCachedPort(false);
    }, []);

    // ── Main print ─────────────────────────────────────────────────────────

    const print = useCallback(async (data: Uint8Array): Promise<boolean> => {
        setStatus('connecting');
        setError(null);

        try {
            if ('serial' in navigator) {
                setMode('serial');
                setStatus('printing');
                await printSerial(data);
            } else if ('usb' in navigator) {
                setMode('usb');
                setStatus('printing');
                await printUSB(data);
            } else {
                throw new Error('Browser tidak mendukung WebSerial/WebUSB');
            }

            setStatus('done');
            setHasCachedPort(true);
            setTimeout(() => setStatus('idle'), 2000);
            return true;
        } catch (e: any) {
            const msg = e?.message ?? 'Gagal mencetak';
            setError(msg);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
            return false;
        }
    }, [printSerial, printUSB]);

    return { print, status, error, isSupported, hasCachedPort, mode, resetPort };
}
