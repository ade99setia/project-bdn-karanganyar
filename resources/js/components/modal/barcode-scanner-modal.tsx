import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat } from '@zxing/library';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, RefreshCcw, ScanLine, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDetected: (scannedCode: string) => boolean | Promise<boolean>;
    title?: string;
    subtitle?: string;
    scanningMessage?: string;
    notFoundMessage?: string;
    requiredDetections?: number;
    barcodeFormats?: BarcodeFormat[];
    warmupMs?: number;
    activeDurationSeconds?: number;
}

export default function BarcodeScannerModal({
    isOpen,
    onClose,
    onDetected,
    title = 'Scan Barcode',
    subtitle = 'Arahkan barcode ke area kamera',
    scanningMessage = 'Mendeteksi barcode secara otomatis...',
    notFoundMessage = 'Kode tidak ditemukan',
    requiredDetections = 2,
    barcodeFormats = [BarcodeFormat.CODE_128],
    warmupMs = 450,
    activeDurationSeconds = 60,
}: BarcodeScannerModalProps) {
    const [scanDistanceMode, setScanDistanceMode] = useState<'normal' | 'macro'>('normal');
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(activeDurationSeconds);
    const [restartSeed, setRestartSeed] = useState(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);
    const processingRef = useRef(false);
    const detectLockTimeoutRef = useRef<number | null>(null);
    const detectSequenceTimeoutRef = useRef<number | null>(null);
    const candidateCodeRef = useRef<string | null>(null);
    const candidateCountRef = useRef(0);
    const warmupUntilRef = useRef<number>(0);
    const activeTimeoutRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);

    const getScannerCameraProfile = () => {
        const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
        const isLowMemoryDevice = deviceMemory <= 2;

        return {
            widthIdeal: isLowMemoryDevice ? 1280 : 1920,
            heightIdeal: isLowMemoryDevice ? 720 : 1080,
            widthMax: isLowMemoryDevice ? 1280 : 2560,
            heightMax: isLowMemoryDevice ? 720 : 1440,
        };
    };

    const optimizeScannerVideoTrack = useCallback(async (videoTrack: MediaStreamTrack) => {
        try {
            const capabilities = (videoTrack.getCapabilities?.() ?? {}) as {
                zoom?: MediaSettingsRange;
                focusMode?: string[];
                exposureMode?: string[];
                whiteBalanceMode?: string[];
                sharpness?: MediaSettingsRange;
                focusDistance?: MediaSettingsRange;
            };

            const advancedConstraints: MediaTrackConstraintSet[] = [];

            const zoomRange = capabilities.zoom;
            if (zoomRange) {
                const minZoom = zoomRange.min ?? 1;
                const maxZoom = zoomRange.max ?? 1;
                const targetZoom = scanDistanceMode === 'macro'
                    ? Math.min(Math.max(1.15, minZoom), maxZoom)
                    : Math.min(Math.max(1, minZoom), maxZoom);
                advancedConstraints.push({ zoom: targetZoom } as MediaTrackConstraintSet);
            }

            const supportedFocusModes = capabilities.focusMode;
            if (Array.isArray(supportedFocusModes)) {
                if (supportedFocusModes.includes('continuous')) {
                    advancedConstraints.push({ focusMode: 'continuous' } as MediaTrackConstraintSet);
                } else if (supportedFocusModes.includes('single-shot')) {
                    advancedConstraints.push({ focusMode: 'single-shot' } as MediaTrackConstraintSet);
                }
            }

            const supportedExposureModes = capabilities.exposureMode;
            if (Array.isArray(supportedExposureModes) && supportedExposureModes.includes('continuous')) {
                advancedConstraints.push({ exposureMode: 'continuous' } as MediaTrackConstraintSet);
            }

            const supportedWhiteBalanceModes = capabilities.whiteBalanceMode;
            if (Array.isArray(supportedWhiteBalanceModes) && supportedWhiteBalanceModes.includes('continuous')) {
                advancedConstraints.push({ whiteBalanceMode: 'continuous' } as MediaTrackConstraintSet);
            }

            if (typeof capabilities.sharpness?.max === 'number' && capabilities.sharpness.max > 0) {
                advancedConstraints.push({ sharpness: capabilities.sharpness.max } as MediaTrackConstraintSet);
            }

            // Tune focus distance for near barcode labels vs normal shelf distance.
            if (typeof capabilities.focusDistance?.max === 'number') {
                const minFocusDistance = capabilities.focusDistance.min ?? 0;
                const maxFocusDistance = capabilities.focusDistance.max;
                const focusRatio = scanDistanceMode === 'macro' ? 0.3 : 0.75;
                const targetFocusDistance = minFocusDistance + (maxFocusDistance - minFocusDistance) * focusRatio;
                advancedConstraints.push({ focusDistance: targetFocusDistance } as MediaTrackConstraintSet);
            }

            if (advancedConstraints.length > 0) {
                await videoTrack.applyConstraints({ advanced: advancedConstraints });
            }
        } catch {
            // Ignore unsupported camera controls on partial browser implementations.
        }
    }, [scanDistanceMode]);

    const pickPreferredRearCameraDeviceId = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return null;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');

        if (videoInputs.length === 0) {
            return null;
        }

        const ultraWideHints = ['0.5', '0,5', 'ultra', 'ultrawide', 'wide angle', 'super wide', 'uw'];
        const rearHints = ['back', 'rear', 'environment', 'belakang', 'traseira'];
        const frontHints = ['front', 'user', 'selfie', 'depan', 'facetime'];
        const mainLensHints = ['main', '1x', 'wide'];

        const scored = videoInputs.map((device) => {
            const label = device.label.toLowerCase();
            let score = 0;

            if (label) {
                if (rearHints.some((hint) => label.includes(hint))) {
                    score += 6;
                }

                if (frontHints.some((hint) => label.includes(hint))) {
                    score -= 8;
                }

                if (ultraWideHints.some((hint) => label.includes(hint))) {
                    score -= 10;
                }

                if (mainLensHints.some((hint) => label.includes(hint))) {
                    score += 3;
                }
            }

            return { deviceId: device.deviceId, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.deviceId ?? null;
    }, []);

    const stopScanner = useCallback(
        (resetState: boolean = false) => {
            if (detectLockTimeoutRef.current != null) {
                window.clearTimeout(detectLockTimeoutRef.current);
                detectLockTimeoutRef.current = null;
            }

            if (detectSequenceTimeoutRef.current != null) {
                window.clearTimeout(detectSequenceTimeoutRef.current);
                detectSequenceTimeoutRef.current = null;
            }

            if (activeTimeoutRef.current != null) {
                window.clearTimeout(activeTimeoutRef.current);
                activeTimeoutRef.current = null;
            }

            if (countdownIntervalRef.current != null) {
                window.clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }

            controlsRef.current?.stop();
            controlsRef.current = null;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            processingRef.current = false;
            candidateCodeRef.current = null;
            candidateCountRef.current = 0;
            warmupUntilRef.current = 0;

            if (resetState) {
                setIsStarting(false);
                setIsCameraReady(false);
                setLastDetectedCode(null);
                setRemainingSeconds(activeDurationSeconds);
            }
        },
        [activeDurationSeconds]
    );

    const closeScanner = useCallback(() => {
        stopScanner(true);
        onClose();
    }, [onClose, stopScanner]);

    const restartScanner = useCallback(() => {
        if (!isOpen) {
            return;
        }

        stopScanner();
        setScannerError(null);
        setResultMessage('Memulai ulang scanner...');
        setRestartSeed((prev) => prev + 1);
    }, [isOpen, stopScanner]);

    const handleScanDistanceModeChange = useCallback((mode: 'normal' | 'macro') => {
        if (mode === scanDistanceMode) {
            return;
        }

        setScanDistanceMode(mode);
        setResultMessage(mode === 'macro' ? 'Mode jarak dekat aktif. Menyesuaikan fokus...' : 'Mode normal aktif. Menyesuaikan fokus...');
        setRestartSeed((prev) => prev + 1);
    }, [scanDistanceMode]);

    useEffect(() => {
        if (!isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            stopScanner(true);
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setScannerError('Browser/perangkat tidak mendukung akses kamera.');
            return;
        }

        setScannerError(null);
        setResultMessage(null);
        setIsStarting(true);
        setIsCameraReady(false);
        setLastDetectedCode(null);
        setRemainingSeconds(activeDurationSeconds);
        candidateCodeRef.current = null;
        candidateCountRef.current = 0;

        let isCancelled = false;
        const codeReader = new BrowserMultiFormatReader();
        codeReader.possibleFormats = barcodeFormats;

        const start = async () => {
            try {
                const profile = getScannerCameraProfile();
                const baseVideoConstraints: MediaTrackConstraints = {
                    aspectRatio: { ideal: 16 / 9 },
                    width: { ideal: profile.widthIdeal, max: profile.widthMax },
                    height: { ideal: profile.heightIdeal, max: profile.heightMax },
                    frameRate: { ideal: 30, max: 30 },
                    facingMode: { ideal: 'environment' },
                };

                const requestStreamWithTimeout = async (video: MediaTrackConstraints) => {
                    return await Promise.race([
                        navigator.mediaDevices.getUserMedia({ video, audio: false }),
                        new Promise<never>((_, reject) => {
                            window.setTimeout(() => reject(new Error('camera-timeout')), 8000);
                        }),
                    ]);
                };

                // Stage 1: open a generic rear camera stream first so device labels become available.
                let mediaStream: MediaStream;

                try {
                    mediaStream = await requestStreamWithTimeout(baseVideoConstraints);
                } catch {
                    try {
                        mediaStream = await requestStreamWithTimeout({
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        });
                    } catch {
                        mediaStream = await requestStreamWithTimeout({
                            facingMode: { ideal: 'environment' },
                        });
                    }
                }

                const currentTrack = mediaStream.getVideoTracks()[0];
                const currentDeviceId = currentTrack?.getSettings?.().deviceId;

                // Stage 2: after permission is granted, try switching to the preferred rear camera (avoid 0.5x).
                const preferredDeviceId = await pickPreferredRearCameraDeviceId();

                if (preferredDeviceId && preferredDeviceId !== currentDeviceId) {
                    try {
                        const switchedStream = await requestStreamWithTimeout({
                            ...baseVideoConstraints,
                            deviceId: { exact: preferredDeviceId },
                        });

                        mediaStream.getTracks().forEach((track) => track.stop());
                        mediaStream = switchedStream;
                    } catch {
                        // Keep the initial stream if strict device selection fails on this browser/device.
                    }
                }

                const videoTrack = mediaStream.getVideoTracks()[0];
                if (videoTrack) {
                    await optimizeScannerVideoTrack(videoTrack);
                }

                if (isCancelled) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }

                const videoElement = videoRef.current;
                if (!videoElement) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    setIsStarting(false);
                    setScannerError('Elemen preview kamera belum siap. Coba buka scanner lagi.');
                    return;
                }

                streamRef.current = mediaStream;
                videoElement.srcObject = mediaStream;
                videoElement.setAttribute('playsinline', 'true');
                videoElement.muted = true;

                await new Promise<void>((resolve) => {
                    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
                        resolve();
                        return;
                    }

                    const onLoadedMetadata = () => {
                        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                        resolve();
                    };

                    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
                    window.setTimeout(() => {
                        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                        resolve();
                    }, 1200);
                });

                await videoElement.play().catch(() => {
                    // Some browsers still block play promise even when stream is active.
                });

                if (!videoElement.srcObject) {
                    setIsStarting(false);
                    setIsCameraReady(false);
                    setScannerError('Preview kamera tidak aktif. Coba muat ulang scanner.');
                    return;
                }

                setIsStarting(false);
                setIsCameraReady(true);
                warmupUntilRef.current = performance.now() + warmupMs;

                const startedAt = Date.now();
                activeTimeoutRef.current = window.setTimeout(() => {
                    setResultMessage('Waktu scan habis. Scanner ditutup otomatis.');
                    closeScanner();
                }, activeDurationSeconds * 1000);

                countdownIntervalRef.current = window.setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
                    const next = Math.max(0, activeDurationSeconds - elapsed);
                    setRemainingSeconds(next);
                }, 250);

                const controls = await codeReader.decodeFromStream(mediaStream, videoElement, async (result, error) => {
                    if (isCancelled || processingRef.current) {
                        return;
                    }

                    if (performance.now() < warmupUntilRef.current) {
                        return;
                    }

                    if (result) {
                        processingRef.current = true;
                        const scannedCode = result.getText().trim();
                        setLastDetectedCode(scannedCode);

                        if (detectSequenceTimeoutRef.current != null) {
                            window.clearTimeout(detectSequenceTimeoutRef.current);
                        }

                        if (candidateCodeRef.current == scannedCode) {
                            candidateCountRef.current += 1;
                        } else {
                            candidateCodeRef.current = scannedCode;
                            candidateCountRef.current = 1;
                        }

                        // Reset sequence if user moves away too long from the same code.
                        detectSequenceTimeoutRef.current = window.setTimeout(() => {
                            candidateCodeRef.current = null;
                            candidateCountRef.current = 0;
                            detectSequenceTimeoutRef.current = null;
                        }, 1200);

                        if (candidateCountRef.current < requiredDetections) {
                            setResultMessage(`Validasi barcode ${candidateCountRef.current}/${requiredDetections}...`);
                            detectLockTimeoutRef.current = window.setTimeout(() => {
                                processingRef.current = false;
                                detectLockTimeoutRef.current = null;
                            }, 140);
                            return;
                        }

                        candidateCodeRef.current = null;
                        candidateCountRef.current = 0;

                        try {
                            const isMatched = await onDetected(scannedCode);

                            if (isMatched) {
                                setResultMessage(null);
                                closeScanner();
                                return;
                            }

                            setResultMessage(notFoundMessage);
                        } catch {
                            setScannerError('Gagal memproses hasil scan. Coba arahkan ulang barcode.');
                        }

                        // Lepas lock sebentar agar frame berikutnya tidak men-trigger terlalu cepat.
                        detectLockTimeoutRef.current = window.setTimeout(() => {
                            processingRef.current = false;
                            detectLockTimeoutRef.current = null;
                        }, 450);
                        return;
                    }

                    if (error && error.name != 'NotFoundException') {
                        setScannerError('Terjadi kendala saat membaca barcode. Coba lagi.');
                    }
                });

                controlsRef.current = controls;
            } catch (err: unknown) {
                setIsStarting(false);
                setIsCameraReady(false);

                const errorName = err instanceof Error ? err.name : 'UnknownError';
                let message = 'Kamera tidak bisa diakses. Cek izin kamera pada browser/perangkat.';

                if (errorName === 'NotAllowedError') {
                    message = 'Izin kamera ditolak. Silakan izinkan kamera lalu coba lagi.';
                } else if (errorName === 'NotReadableError') {
                    message = 'Kamera sedang dipakai aplikasi/modul lain. Tutup kamera lain lalu coba lagi.';
                } else if (errorName === 'NotFoundError') {
                    message = 'Kamera tidak ditemukan pada perangkat ini.';
                } else if (errorName === 'OverconstrainedError') {
                    message = 'Konfigurasi kamera tidak didukung perangkat. Coba muat ulang scanner.';
                }

                setScannerError(`${message} (${errorName})`);
            }
        };

        void start();

        return () => {
            isCancelled = true;
            stopScanner();
        };
    }, [
        activeDurationSeconds,
        barcodeFormats,
        closeScanner,
        isOpen,
        notFoundMessage,
        onDetected,
        optimizeScannerVideoTrack,
        pickPreferredRearCameraDeviceId,
        requiredDetections,
        restartSeed,
        scanDistanceMode,
        stopScanner,
        warmupMs,
    ]);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed inset-0 p-5 md:p-8 top-0 left-0 z-1000 bg-black flex flex-col"
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 h-full w-full object-contain"
                    />

                    <div className="absolute top-0 inset-x-0 px-5 py-4 bg-linear-to-b from-black/75 to-transparent z-20 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-white">{title}</p>
                            <p className="text-[11px] text-white/80">{subtitle}</p>
                        </div>
                        <button
                            type="button"
                            onClick={closeScanner}
                            className="p-2 rounded-full bg-black/30 text-white border border-white/20"
                            aria-label="Tutup scanner"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-6">
                        <div
                            className="relative rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)] overflow-hidden"
                            style={{
                                width: 'min(88vw, 430px)',
                                height: 'clamp(110px, 24vw, 170px)',
                            }}
                        >
                            {isCameraReady && !scannerError && (
                                <motion.div
                                    animate={{
                                        y: [-52, 192, -52],
                                        opacity: [0.25, 0.9, 0.25],
                                    }}
                                    transition={{
                                        y: {
                                            duration: 1.35,
                                            repeat: Infinity,
                                            repeatType: 'loop',
                                            ease: 'linear',
                                        },
                                        opacity: {
                                            duration: 1.35,
                                            repeat: Infinity,
                                            repeatType: 'loop',
                                            ease: 'linear',
                                        },
                                    }}
                                    className="absolute inset-x-0 h-8 bg-linear-to-b from-transparent via-emerald-300/45 to-transparent"
                                />
                            )}
                            <div className="absolute top-2 left-2 text-[10px] font-bold text-white/90 tracking-wide">
                                {isStarting ? 'MENYIAPKAN KAMERA...' : 'AREA SCAN'}
                            </div>
                            {isCameraReady && (
                                <div className="absolute top-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                    {remainingSeconds}s
                                </div>
                            )}
                            {/* <div className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white/80">
                                Panduan visual
                            </div> */}
                            {lastDetectedCode && (
                                <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-emerald-200 truncate">
                                    Terdeteksi: {lastDetectedCode}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-8 pt-14 bg-linear-to-t from-black/90 via-black/55 to-transparent">
                        {isStarting ? (
                            <p className="rounded-xl bg-blue-500/20 border border-blue-300/40 px-3 py-2 text-xs font-semibold text-blue-100 flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" />
                                Membuka kamera dan menyiapkan scanner...
                            </p>
                        ) : scannerError ? (
                            <p className="rounded-xl bg-red-500/20 border border-red-300/40 px-3 py-2 text-xs font-semibold text-red-100">
                                {scannerError}
                            </p>
                        ) : resultMessage ? (
                            <p className="rounded-xl bg-amber-500/25 border border-amber-300/40 px-3 py-2 text-xs font-semibold text-amber-100">
                                {resultMessage}
                            </p>
                        ) : (
                            <p className="rounded-xl bg-black/40 border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 flex items-center gap-2">
                                <ScanLine size={14} className="text-emerald-300" />
                                {scanningMessage}
                            </p>
                        )}

                        <div className="mt-2">
                            <div className="mb-2 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleScanDistanceModeChange('normal')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${scanDistanceMode === 'normal'
                                        ? 'bg-emerald-500/30 border-emerald-300/50 text-emerald-100'
                                        : 'bg-black/30 border-white/25 text-white/90 hover:bg-black/45'
                                        }`}
                                >
                                    Mode Normal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleScanDistanceModeChange('macro')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${scanDistanceMode === 'macro'
                                        ? 'bg-emerald-500/30 border-emerald-300/50 text-emerald-100'
                                        : 'bg-black/30 border-white/25 text-white/90 hover:bg-black/45'
                                        }`}
                                >
                                    Jarak Dekat
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={restartScanner}
                                className="w-full rounded-xl bg-black/40 border border-white/30 px-3 py-2 text-xs font-semibold text-white/95 flex items-center justify-center gap-2"
                            >
                                <RefreshCcw size={14} />
                                Muat Ulang Scanner
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
