import * as faceapi from 'face-api.js';
import { X, Loader2, ScanFace, CheckCircle2, Camera } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onVerified: (type: 'in' | 'out') => void;
    checkType: 'in' | 'out';
    storedDescriptor: string;
    userName: string;
}

export default function FaceVerificationModal({
    isOpen,
    onClose,
    onVerified,
    checkType,
    storedDescriptor,
    userName,
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [step, setStep] = useState<'ready' | 'match' | 'neutral1' | 'smile1' | 'neutral2' | 'smile2' | 'success'>('ready');
    const [feedback, setFeedback] = useState("Menyiapkan verifikasi wajah...");

    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const targetDescriptorRef = useRef<Float32Array | null>(null);
    const stepRef = useRef(step);
    const lastDetectionTimeRef = useRef(0);
    const isProcessingRef = useRef(false);
    // Ref tambahan untuk menjaga status kamera tanpa menunggu re-render state
    const isCameraActiveRef = useRef(false);

    // Update ref saat state berubah
    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    const updateFeedback = useCallback((text: string) => {
        setFeedback((prev) => (prev === text ? prev : text));
    }, []);

    // FUNGSI 1: Stop Kamera yang Stabil
    const stopCamera = useCallback(() => {
        console.log("Stopping camera...");
        isCameraActiveRef.current = false; // Matikan flag loop segera

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = undefined;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraStarted(false);
    }, []);

    // FUNGSI 2: Handle Success
    const handleSuccess = useCallback(() => {
        if (stepRef.current === 'success') return;
        setStep('success');
        updateFeedback("Verifikasi Berhasil ✓");

        // Jangan langsung stop camera agar transisi smooth, tapi stop deteksi
        isCameraActiveRef.current = false;

        setTimeout(() => {
            stopCamera(); // Baru matikan kamera fisik
            onVerified(checkType);
            onClose();
        }, 1400);
    }, [checkType, onVerified, onClose, stopCamera, updateFeedback]);

    const getStepNumber = () => {
        switch (step) {
            case 'match': return 0;
            case 'neutral1': return 1;
            case 'smile1': return 2;
            case 'neutral2': return 3;
            case 'smile2': return 4;
            case 'success': return 4;
            default: return 0;
        }
    };

    // FUNGSI 3: Logika Liveness (Tantangan Wajah)
    const runLivenessChallenge = useCallback(
        (detection: faceapi.WithFaceExpressions<{ expressions: faceapi.FaceExpressions }>) => {
            const { expressions } = detection;
            const currentStep = stepRef.current;

            switch (currentStep) {
                case 'match':
                case 'neutral1':
                    updateFeedback("Posisikan wajah netral 😐");
                    if (expressions.neutral > 0.6) setStep('smile1');
                    break;
                case 'smile1':
                    updateFeedback("Tersenyum lebar 😄");
                    if (expressions.happy > 0.65) setStep('neutral2');
                    break;
                case 'neutral2':
                    updateFeedback("Kembali netral 😐");
                    if (expressions.neutral > 0.6) setStep('smile2');
                    break;
                case 'smile2':
                    updateFeedback("Tersenyum sekali lagi 😄");
                    if (expressions.happy > 0.65) handleSuccess();
                    break;
                default:
                    break;
            }
        },
        [handleSuccess, updateFeedback]
    );

    // FUNGSI 4: Loop Deteksi Wajah
    const detectFace = useCallback(async () => {
        // Cek Ref, bukan State, agar tidak terpengaruh re-render lambat
        if (!isCameraActiveRef.current || !videoRef.current || !targetDescriptorRef.current) return;

        const video = videoRef.current;

        // Validasi elemen video
        if (video.paused || video.ended || video.videoWidth === 0) {
            // Jika video belum siap, coba lagi frame berikutnya tanpa mematikan logic
            requestRef.current = requestAnimationFrame(detectFace);
            return;
        }

        // Throttle deteksi agar tidak memberatkan CPU (max 10-15 FPS)
        const now = performance.now();
        if (now - lastDetectionTimeRef.current < 100) {
            requestRef.current = requestAnimationFrame(detectFace);
            return;
        }
        lastDetectionTimeRef.current = now;

        if (isProcessingRef.current) {
            requestRef.current = requestAnimationFrame(detectFace);
            return;
        }

        isProcessingRef.current = true;

        try {
            // Menggunakan TinyFaceDetector agar cepat di mobile
            const useTinyModel = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 });

            let detection;

            // Logika deteksi
            if (stepRef.current === 'match') {
                // Saat matching awal, kita butuh descriptor
                const result = await faceapi
                    .detectSingleFace(video, useTinyModel)
                    .withFaceLandmarks()
                    .withFaceDescriptor()
                    .withFaceExpressions();

                if (result) {
                    const distance = faceapi.euclideanDistance(result.descriptor, targetDescriptorRef.current!);
                    // Ambang batas kemiripan (0.6 adalah standar, 0.4 sangat ketat)
                    if (distance > 0.55) {
                        updateFeedback("Wajah tidak cocok / Bukan pemilik akun");
                    } else {
                        // Wajah cocok, lanjut ke liveness check
                        setStep('neutral1');
                        // Langsung cek ekspresi juga biar responsif
                        runLivenessChallenge(result);
                    }
                } else {
                    updateFeedback("Posisikan wajah di tengah");
                }
            } else {
                // Step liveness challenge (tidak perlu hitung descriptor lagi, berat)
                detection = await faceapi
                    .detectSingleFace(video, useTinyModel)
                    .withFaceLandmarks()
                    .withFaceExpressions();

                if (detection) {
                    runLivenessChallenge(detection);
                } else {
                    updateFeedback("Wajah tidak terdeteksi");
                }
            }
        } catch (err) {
            console.error("Detection glitch:", err);
        } finally {
            isProcessingRef.current = false;
            // Lanjut ke frame berikutnya jika kamera masih aktif
            if (isCameraActiveRef.current) {
                requestRef.current = requestAnimationFrame(detectFace);
            }
        }
    }, [runLivenessChallenge, updateFeedback]);

    // FUNGSI 5: Start Kamera
    const startCameraAndDetection = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 }, // Membatasi resolusi agar ringan
                    height: { ideal: 480 }
                },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Promise untuk memastikan video benar-benar play
                await new Promise<void>((resolve) => {
                    videoRef.current!.onloadedmetadata = () => {
                        videoRef.current!.play().then(() => resolve());
                    };
                });

                // Set flag aktif
                isCameraActiveRef.current = true;
                setCameraStarted(true);
                setStep('match');
                updateFeedback("Memindai wajah...");

                // Mulai loop deteksi
                detectFace();
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Camera error:", err);
            isCameraActiveRef.current = false;
            let msg = "Gagal membuka kamera";
            if (err.name === 'NotAllowedError') msg = "Izin kamera ditolak";
            if (err.name === 'NotFoundError') msg = "Kamera tidak ditemukan";
            if (err.name === 'NotReadableError') msg = "Kamera sedang digunakan aplikasi lain";

            setCameraError(msg);
            setCameraStarted(false);
            toast.error(msg);
        }
    }, [detectFace, updateFeedback]);

    // EFFECT 1: Load Models (Hanya dijalankan SEKALI saat mount/open)
    useEffect(() => {
        if (!isOpen) return;

        // Parse descriptor user
        if (storedDescriptor) {
            try {
                const parsed = JSON.parse(storedDescriptor);
                targetDescriptorRef.current = new Float32Array(parsed);
            } catch (e) {
                console.error("Invalid descriptor format", e);
                toast.error("Data wajah invalid");
                onClose();
                return;
            }
        }

        const loadModels = async () => {
            try {
                // Cek apakah model sudah load sebelumnya (global check)
                const isLoaded = !!faceapi.nets.tinyFaceDetector.params;

                if (!isLoaded) {
                    updateFeedback("Memuat model AI...");
                    const MODEL_URL = '/models';
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                    ]);
                }

                setIsLoadingModels(false);
            } catch (e) {
                console.error("Model load error:", e);
                toast.error("Gagal memuat model AI");
                onClose();
            }
        };

        loadModels();

        // PENTING: Jangan masukkan cleanup stopCamera di sini!
        // Biarkan loadModels independen dari lifecycle kamera.
    }, [isOpen, storedDescriptor, onClose, updateFeedback]);

    // EFFECT 2: Cleanup Handle saat Close Modal
    useEffect(() => {
        // Hanya jalankan cleanup jika isOpen berubah menjadi false
        if (!isOpen) {
            stopCamera();
        }

        // Cleanup function saat unmount komponen total
        return () => {
            stopCamera();
        };
    }, [isOpen, stopCamera]);


    // RENDER UI
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-screen h-dvh max-w-none rounded-none border-0 p-0 m-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex flex-col overflow-hidden">
                <div className="relative w-full h-full">
                    {/* Video Element */}
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${cameraStarted ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Overlay UI */}
                    <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8 z-10 pointer-events-none">

                        {/* Header */}
                        <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-full border border-cyan-500/20">
                                <ScanFace className="h-5 w-5 text-cyan-400" />
                                <span className="text-base font-semibold text-white/90">{userName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="pointer-events-auto text-white/80 hover:text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Center Content */}
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Tampilan "Siap Memindai" (Hanya muncul jika kamera BELUM start) */}
                            {!cameraStarted && (
                                <div className="flex flex-col items-center gap-8 max-w-md text-center pointer-events-auto">
                                    {isLoadingModels ? (
                                        <>
                                            <Loader2 className="h-16 w-16 animate-spin text-cyan-400" />
                                            <p className="text-lg text-white/90">{feedback}</p>
                                        </>
                                    ) : (
                                        <>
                                            <ScanFace className="h-24 w-24 text-cyan-400 opacity-80" strokeWidth={1.2} />
                                            <h2 className="text-2xl md:text-3xl font-bold text-white">Siap Memindai Wajah</h2>
                                            <p className="text-white/70 text-base leading-relaxed">
                                                Pastikan pencahayaan cukup dan wajah terlihat jelas.
                                            </p>

                                            {cameraError && (
                                                <p className="text-red-400 text-sm mt-2 bg-red-900/20 px-3 py-1 rounded">{cameraError}</p>
                                            )}

                                            <Button
                                                onClick={startCameraAndDetection}
                                                size="lg"
                                                className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-10 py-7 rounded-xl shadow-lg shadow-cyan-900/40 transition-all active:scale-95"
                                            >
                                                <Camera className="mr-3 h-6 w-6" />
                                                Buka Kamera
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Tampilan Scanning Frame (Muncul jika kamera SUDAH start) */}
                            {cameraStarted && step !== 'success' && (
                                <div className={`relative w-72 h-96 md:w-80 md:h-112 border-4 rounded-[45%] overflow-hidden transition-colors duration-300 
                                    ${step === 'match' ? 'border-cyan-400/60' : 'border-emerald-400/60'} shadow-2xl shadow-black/60`}>

                                    {step === 'match' && (
                                        <div className="absolute inset-x-0 h-1 bg-cyan-400/60 blur-sm animate-scan-line shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
                                    )}
                                    <div className="absolute inset-0 border-2 border-white/10 rounded-[45%]" />
                                </div>
                            )}

                            {/* Tampilan Success */}
                            {cameraStarted && step === 'success' && (
                                <div className="flex flex-col items-center justify-center gap-6 animate-fade-in-up">
                                    <div className="relative">
                                        <CheckCircle2 className="h-28 w-28 text-emerald-400 animate-check-pop" strokeWidth={1.5} />
                                        <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
                                    </div>
                                    <h2 className="text-4xl font-bold text-white">Berhasil</h2>
                                </div>
                            )}
                        </div>

                        {/* Footer Status Bar (Hanya jika kamera aktif) */}
                        {cameraStarted && step !== 'success' && (
                            <div className="w-full max-w-md mx-auto bg-black/65 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl pointer-events-auto mb-8">
                                <p className="text-xl md:text-2xl font-bold text-center text-white mb-3 tracking-wide">
                                    {feedback}
                                </p>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                                    <div
                                        className="h-full bg-linear-to-r from-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
                                        style={{ width: `${(getStepNumber() / 4) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}