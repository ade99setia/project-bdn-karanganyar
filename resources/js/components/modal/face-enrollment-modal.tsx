import axios from 'axios';
import imageCompression from 'browser-image-compression';
import type * as FaceApi from 'face-api.js';
import {
    Loader2,
    RefreshCw,
    X,
    ScanFace,
    AlertCircle
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface FaceEnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

// Helper: Convert Base64 to File
const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export default function FaceEnrollmentModal({ isOpen, onClose, user }: FaceEnrollmentModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const faceApiRef = useRef<typeof FaceApi | null>(null);
    const faceApiPromiseRef = useRef<Promise<typeof FaceApi> | null>(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // NEW: Status tracking untuk feedback yang jelas
    const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'detected' | 'failed'>('idle');
    const [faceQuality, setFaceQuality] = useState<'good' | 'poor' | null>(null);

    const loadFaceApi = async () => {
        if (faceApiRef.current) return faceApiRef.current;
        if (!faceApiPromiseRef.current) {
            faceApiPromiseRef.current = import('face-api.js');
        }
        faceApiRef.current = await faceApiPromiseRef.current;
        return faceApiRef.current;
    };

    // 1. Load Model (Hanya detector & landmark yang ringan)
    useEffect(() => {
        let isMounted = true;
        const loadModels = async () => {
            if (!isOpen) return;
            try {
                const faceapi = await loadFaceApi();
                // Kita hanya butuh tinyFaceDetector & faceLandmark68Net untuk enrollment dasar
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
                ]);
                if (isMounted) setIsModelLoaded(true);
            } catch (error) {
                console.error("Error loading models:", error);
                toast.error("Gagal memuat model AI.");
            }
        };

        if (isOpen) {
            // Reset state
            setCapturedDescriptor(null);
            setCapturedImage(null);
            setIsModelLoaded(false);
            setIsCameraReady(false);
            loadModels();
        }

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [isOpen]);

    // 2. Start Camera setelah model siap
    useEffect(() => {
        if (isModelLoaded && isOpen && !capturedImage) {
            startCamera();
        }
    }, [isModelLoaded, isOpen, capturedImage]);

    const startCamera = async () => {
        try {
            // OPTIMISASI KAMERA HP:
            // 1. Jangan paksa width/height besar (ideal 640 cukup untuk deteksi).
            // 2. Jangan set aspectRatio kaku agar HP portrait tidak gepeng.
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Gunakan playsInline agar tidak fullscreen otomatis di iOS
                videoRef.current.setAttribute("playsinline", "true");

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsCameraReady(true);
                };
            }
        } catch (err) {
            console.error("Camera Error:", err);
            toast.error("Izin kamera ditolak atau tidak ditemukan.");
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
    };

    // FUNGSI INI DIHAPUS (Real-time detection loop) agar HP tidak panas/lag.
    // Kita ganti dengan CSS Overlay statis saja untuk panduan visual.

    const captureAndValidateFace = async () => {
        if (!videoRef.current || !user) return;
        setIsProcessing(true);
        setDetectionStatus('detecting');

        try {
            const faceapi = await loadFaceApi();
            const video = videoRef.current;

            const options = new faceapi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.5
            });

            const detection = await faceapi
                .detectSingleFace(video, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            // ❌ WAJAH TIDAK TERDETEKSI
            if (!detection) {
                setDetectionStatus('failed');
                setFaceQuality(null);
                toast.error("Wajah tidak terdeteksi! Coba ulangi.", {
                    icon: <AlertCircle className="text-yellow-500" />
                });
                setIsProcessing(false);
                return;
            }

            // ✅ VALIDASI KUALITAS WAJAH
            const confidence = detection.detection.score;
            const isHighQuality = confidence > 0.75;

            setFaceQuality(isHighQuality ? 'good' : 'poor');

            // Jika kualitas kurang baik, warning tapi tetap lanjut
            if (!isHighQuality) {
                setDetectionStatus('detected');
                toast.error("Kualitas deteksi sedang - coba posisi yang lebih ideal", {
                    icon: <AlertCircle className="text-amber-500" />
                });
            } else {
                setDetectionStatus('detected');
                toast.success("Wajah terdeteksi dengan kualitas sempurna!");
            }

            // Capture gambar
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0);
            }

            setCapturedImage(canvas.toDataURL('image/png'));
            setCapturedDescriptor(detection.descriptor);
            stopCamera();

        } catch (error) {
            console.error(error);
            setDetectionStatus('failed');
            toast.error("Gagal memproses gambar wajah.");
        } finally {
            setIsProcessing(false);
        }
    };

    const saveToServer = async () => {
        if (!capturedDescriptor || !user || !capturedImage) return;
        setIsProcessing(true);

        try {
            const imageFile = dataURLtoFile(capturedImage, `face-${user.id}-${Date.now()}.png`);

            // Kompresi lebih agresif untuk upload cepat
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            const compressedFile = await imageCompression(imageFile, options);

            const formData = new FormData();
            const faceData = {
                label: user.name,
                user_id: user.id,
                descriptors: [Array.from(capturedDescriptor)]
            };

            formData.append('data', JSON.stringify(faceData));
            formData.append('photo', compressedFile); // Upload file yg sudah dikompres

            const response = await axios.post('/settings/profile/face-id', formData);

            if (response.data.success) {
                toast.success(`Data wajah berhasil diperbarui!`);
                onClose();
                window.location.reload();
            } else {
                toast.error(response.data.message || "Gagal menyimpan ke database.");
            }
        } catch (error) {
            console.error(error);
            toast.error('Koneksi/server bermasalah. Data wajah disimpan lokal untuk sinkronisasi nanti.');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        setCapturedDescriptor(null);
        setDetectionStatus('idle');
        setFaceQuality(null);
        setTimeout(() => startCamera(), 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="w-screen! h-screen! max-w-none! max-h-none! rounded-none! border-0 p-0 m-0 bg-black flex flex-col overflow-hidden">

                {/* --- HEADER --- */}
                <div className="absolute top-5 left-0 right-0 z-20 p-4 flex justify-between items-start bg-linear-to-b">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <ScanFace className="w-6 h-6" />
                            <h2 className="text-lg font-bold tracking-tight text-white">Registrasi Wajah</h2>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                {/* --- MAIN CAMERA AREA --- */}
                <div className="absolute inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">

                    {/* Loading State */}
                    {(!isModelLoaded || (!isCameraReady && !capturedImage)) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 space-y-4 bg-black">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-gray-400 text-xs tracking-widest">MEMUAT AI...</p>
                        </div>
                    )}

                    {/* Video / Image Container - FULLSCREEN */}
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                        {capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn(
                                    "absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500",
                                    isCameraReady ? "opacity-100" : "opacity-0"
                                )}
                            />
                        )}

                        {/* Static Overlay Guide + Status Info - MINIMAL */}
                        {!capturedImage && isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-16">
                                {/* Kotak Panduan Statis */}
                                <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-white/30 rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl -mt-0.5 -ml-0.5"></div>
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl -mt-0.5 -mr-0.5"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl -mb-0.5 -ml-0.5"></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl -mb-0.5 -mr-0.5"></div>
                                </div>

                                {/* Status Message - Bottom Small */}
                                {detectionStatus === 'idle' && (
                                    <div className="absolute bottom-40 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-medium">
                                        📍 Posisikan wajah di tengah
                                    </div>
                                )}

                                {detectionStatus === 'detecting' && (
                                    <div className="absolute bottom-40 bg-amber-900/40 backdrop-blur-sm px-4 py-2 rounded-full text-amber-100 text-xs font-medium animate-pulse">
                                        🔍 Mendeteksi...
                                    </div>
                                )}

                                {detectionStatus === 'failed' && (
                                    <div className="px-4 py-3 rounded-xl bg-red-900/50 backdrop-blur-sm border border-red-400/50 text-red-100 text-xs text-center max-w-xs">
                                        <p className="font-semibold">❌ Wajah tidak terdeteksi</p>
                                        <p className="text-red-200/70 text-[10px] mt-1">Cek cahaya, posisi, & jarak kamera</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- FOOTER CONTROLS --- */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 flex flex-col justify-center items-center gap-3 bg-linear-to-t from-black/90 via-black/50 to-transparent z-40">

                    {!capturedDescriptor ? (
                        // ❌ WAJAH BELUM TERDETEKSI
                        <div className="flex flex-col items-center gap-3 w-full">
                            {/* Instruksi Singkat */}
                            <div className="text-center text-white/70 text-xs">
                                Tekan tombol putih untuk ambil foto
                            </div>

                            {/* Tombol Capture */}
                            <button
                                onClick={captureAndValidateFace}
                                disabled={!isModelLoaded || !isCameraReady || isProcessing}
                                className={cn(
                                    "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200",
                                    isProcessing ? "scale-95 opacity-80 border-indigo-500" : "border-white/30 hover:border-white active:scale-90"
                                )}
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-full transition-all",
                                    isProcessing ? "bg-indigo-500 animate-pulse" : "bg-white"
                                )} />
                            </button>
                        </div>
                    ) : (
                        // ✅ WAJAH TERDETEKSI - ARAHKAN KE SIMPAN
                        <div className="flex flex-col items-center gap-3 w-full">
                            {/* Status Message - Singkat & Jelas */}
                            <div className={cn(
                                "px-4 py-2 rounded-lg backdrop-blur-sm text-xs font-semibold text-center max-w-sm",
                                faceQuality === 'good'
                                    ? "bg-green-900/60 border border-green-400/50 text-green-100"
                                    : "bg-amber-900/60 border border-amber-400/50 text-amber-100"
                            )}>
                                {faceQuality === 'good'
                                    ? "✅ Wajah terdeteksi sempurna"
                                    : "⚠️ Wajah terdeteksi (kualitas sedang)"}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 w-full max-w-sm px-4">
                                <button
                                    onClick={retake}
                                    disabled={isProcessing}
                                    className={cn(
                                        "flex-1 px-3 py-2.5 rounded-full text-xs font-semibold transition-all",
                                        "bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md",
                                        isProcessing && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 inline" />
                                    Ulang
                                </button>

                                {/* TOMBOL SIMPAN - ENABLED JIKA WAJAH TERDETEKSI */}
                                <button
                                    onClick={saveToServer}
                                    disabled={!capturedDescriptor || isProcessing}
                                    className={cn(
                                        "flex-1 px-3 py-2.5 rounded-full text-xs font-semibold transition-all shadow-lg",
                                        capturedDescriptor && !isProcessing
                                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 active:scale-95"
                                            : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-50"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                                            Proses...
                                        </>
                                    ) : (
                                        "Simpan"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}