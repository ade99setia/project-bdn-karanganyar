import * as faceapi from 'face-api.js';
import { X, Loader2, ScanFace } from 'lucide-react';
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

const getEyeAspectRatio = (eye: faceapi.Point[]) => {
    const d1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const d2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const d3 = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (d1 + d2) / (2.0 * d3);
};

export default function FaceVerificationModal({ isOpen, onClose, onVerified, checkType, storedDescriptor, userName }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState<'load' | 'match' | 'neutral' | 'blink' | 'smile' | 'success'>('load');
    const [feedback, setFeedback] = useState("Memuat AI...");

    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const isBlinkingRef = useRef(false);
    const blinkCountRef = useRef(0);
    const targetDescriptorRef = useRef<Float32Array | null>(null);
    const stepRef = useRef<'load' | 'match' | 'neutral' | 'blink' | 'smile' | 'success'>('load');

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = undefined;
        }
    }, []);

    const handleSuccess = useCallback(() => {
        if (stepRef.current === 'success') return;
        setStep('success');
        setFeedback("Verifikasi Berhasil! ✅");
        stopCamera();

        setTimeout(() => {
            onVerified(checkType);
            onClose();
        }, 1000);
    }, [checkType, onVerified, onClose, stopCamera]);

    const runLivenessChallenge = useCallback((detection: faceapi.WithFaceExpressions<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>>) => {
        const { expressions, landmarks } = detection;
        const currentStep = stepRef.current;

        switch (currentStep) {
            case 'match':
            case 'neutral':
                setFeedback("Tunjukkan wajah datar/neutral 😐");
                if (expressions.neutral > 0.6) {
                    setStep('blink');
                }
                break;

            case 'blink': {
                setFeedback(`Kedipkan mata 2 kali (${blinkCountRef.current}/2) 😉`);

                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();
                const leftEAR = getEyeAspectRatio(leftEye);
                const rightEAR = getEyeAspectRatio(rightEye);

                const avgEAR = (leftEAR + rightEAR) / 2;
                const isClosed = avgEAR < 0.26;

                if (isClosed) {
                    if (!isBlinkingRef.current) {
                        isBlinkingRef.current = true;
                    }
                } else {
                    if (isBlinkingRef.current) {
                        isBlinkingRef.current = false;
                        blinkCountRef.current += 1;
                    }
                }

                if (blinkCountRef.current >= 2) {
                    setStep('smile');
                }
                break;
            }

            case 'smile':
                setFeedback("Sekarang tersenyum lebar! 😃");
                if (expressions.happy > 0.7) {
                    handleSuccess();
                }
                break;

            case 'success':
                break;

            default:
                break;
        }
    }, [handleSuccess]);

    const detectFace = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !targetDescriptorRef.current) return;

        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        const loop = async () => {
            if (!isOpen || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

            try {
                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor()
                    .withFaceExpressions();

                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, displaySize.width, displaySize.height);

                if (detection) {
                    const distance = faceapi.euclideanDistance(detection.descriptor, targetDescriptorRef.current!);

                    if (distance > 0.55) {
                        setFeedback("Wajah tidak dikenali! 🚫");
                        if (stepRef.current !== 'match') setStep('match');
                        blinkCountRef.current = 0;
                    } else {
                        runLivenessChallenge(detection);
                    }
                } else {
                    setFeedback("Wajah tidak terdeteksi 🔍");
                }
            } catch (error) {
                console.warn("Detection error frame", error);
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        loop();
    }, [isOpen, runLivenessChallenge]);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().then(() => {
                        setIsLoading(false);
                        setStep('match');
                        detectFace();
                    }).catch(e => console.error("Play error", e));
                };
            }
        } catch (err) {
            console.error(err);
            toast.error("Gagal akses kamera.");
            onClose();
        }
    }, [onClose, detectFace]);

    useEffect(() => {
        if (!isOpen) return;

        blinkCountRef.current = 0;
        isBlinkingRef.current = false;
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || step !== 'load') return;

        const startUp = async () => {
            try {
                const parsed = JSON.parse(storedDescriptor);
                targetDescriptorRef.current = new Float32Array(parsed);

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models')
                ]);

                startCamera();
            } catch (e) {
                console.error(e);
                toast.error("Gagal memuat model AI atau data wajah.");
                onClose();
            }
        };

        startUp();

        return () => {
            stopCamera();
        };
    }, [isOpen, step, storedDescriptor, startCamera, stopCamera, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-screen! h-dvh! max-w-none! rounded-none! border-0 p-0 m-0 bg-black flex flex-col overflow-hidden">

                <div className="relative w-full h-full bg-slate-900">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className={`w-full h-full object-cover transform -scale-x-100 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transform -scale-x-100 pointer-events-none" />

                    {/* UI Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 z-10 bg-linear-to-b from-black/60 via-transparent to-black/80">
                        <div className="flex justify-between items-start pt-safe">
                            <div className="flex items-center gap-2 text-white/90 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/10">
                                <ScanFace size={16} className="text-cyan-400" />
                                {userName}
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                                <X size={24} />
                            </Button>
                        </div>

                        <div className="flex flex-col items-center gap-4 text-center pb-8">
                            {isLoading ? (
                                <div className="flex flex-col items-center text-cyan-400">
                                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                                    <p className="text-sm font-medium">Memulai Kamera...</p>
                                </div>
                            ) : (
                                <div className={`w-full max-w-xs mx-auto p-4 rounded-2xl backdrop-blur-md border shadow-lg transition-all duration-300 ${step === 'success' ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-900/60 border-white/10'
                                    }`}>
                                    <div className="text-4xl mb-3">
                                        {step === 'neutral' && '😐'}
                                        {step === 'blink' && '😉'}
                                        {step === 'smile' && '😃'}
                                        {step === 'success' && '✅'}
                                        {step === 'match' && '🔍'}
                                    </div>
                                    <h3 className={`text-xl font-bold ${step === 'success' ? 'text-emerald-400' : 'text-white'}`}>
                                        {feedback}
                                    </h3>

                                    {step !== 'success' && step !== 'match' && step !== 'load' && (
                                        <div className="flex justify-center gap-2 mt-4">
                                            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'neutral' || step === 'blink' || step === 'smile' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'blink' || step === 'smile' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'smile' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}