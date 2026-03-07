import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { RefObject } from 'react';

interface VisitCameraModalProps {
    isOpen: boolean;
    isCompressing: boolean;
    videoRef: RefObject<HTMLVideoElement | null>;
    onClose: () => void;
    onCapture: () => void;
}

export default function VisitCameraModal({
    isOpen,
    isCompressing,
    videoRef,
    onClose,
    onCapture,
}: VisitCameraModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed inset-0 z-999 bg-black flex flex-col overflow-hidden"
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="absolute top-0 inset-x-0 px-6 py-5 flex justify-between items-center z-20">
                        <span className="text-white/90 font-medium tracking-wide text-sm drop-shadow-md">
                            Ambil Foto
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isCompressing}
                            className="p-2.5 rounded-full bg-black/20 text-white backdrop-blur-md border border-white/10 transition-all hover:bg-black/40 disabled:opacity-50"
                            aria-label="Tutup kamera"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>

                    <div className="absolute inset-x-0 top-21 bottom-42.5 pointer-events-none z-10 flex items-center justify-center px-4 sm:top-23 sm:bottom-46">
                        <div className="relative w-[82vw] max-w-md h-[56vh] max-h-105 opacity-60">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white rounded-tl-3xl" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white rounded-tr-3xl" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white rounded-bl-3xl" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white rounded-br-3xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-1 h-1 bg-white/50 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 pb-12 pt-32 bg-linear-to-t from-black/90 via-black/50 to-transparent z-20">
                        <div className="flex items-center justify-between w-full max-w-md mx-auto px-10">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isCompressing}
                                className="text-white/70 font-medium text-sm hover:text-white transition-colors disabled:opacity-50 w-16 text-left"
                            >
                                Batal
                            </button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={onCapture}
                                disabled={isCompressing}
                                className="relative flex items-center justify-center w-21 h-21 rounded-full border-[3px] border-white/80 disabled:opacity-50 transition-all hover:border-white focus:outline-none"
                                aria-label="Ambil Gambar"
                            >
                                {isCompressing ? (
                                    <div className="w-17 h-17 rounded-full bg-white/50 flex items-center justify-center animate-pulse">
                                        <Loader2 className="h-6 w-6 animate-spin text-black" />
                                    </div>
                                ) : (
                                    <div className="w-17 h-17 rounded-full bg-white transition-all hover:bg-slate-200" />
                                )}
                            </motion.button>

                            <div className="w-16" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
