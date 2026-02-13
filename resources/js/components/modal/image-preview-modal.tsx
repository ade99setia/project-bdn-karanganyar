import { AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl }: ImagePreviewModalProps) {
    if (!isOpen || !imageUrl) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-9999 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                onClick={onClose}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
                >
                    <X size={24} />
                </button>

                <div
                    className="fixed inset-0 flex items-center justify-center p-0 m-0 z-40"
                    style={{ pointerEvents: 'auto' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={5}
                        centerOnInit={true}
                        wheel={{ step: 0.2 }}
                        doubleClick={{ disabled: false }}
                        panning={{ velocityDisabled: false }}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                {/* Gambar Utama */}
                                <TransformComponent wrapperClass="w-screen h-screen flex items-center justify-center">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="w-auto h-auto max-w-screen max-h-screen object-contain shadow-2xl drop-shadow-2xl m-auto"
                                        style={{ display: 'block', margin: 'auto', maxWidth: '100vw', maxHeight: '100vh' }}
                                    />
                                </TransformComponent>

                                <div
                                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 bg-white/10 border border-white/10 backdrop-blur-md rounded-full shadow-lg"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => zoomOut()} className="text-white hover:text-blue-400 transition-colors">
                                        <ZoomOut size={20} />
                                    </button>
                                    <div className="w-px h-5 bg-white/20"></div>
                                    <button onClick={() => resetTransform()} className="text-white hover:text-blue-400 transition-colors">
                                        <RotateCcw size={18} />
                                    </button>
                                    <div className="w-px h-5 bg-white/20"></div>
                                    <button onClick={() => zoomIn()} className="text-white hover:text-blue-400 transition-colors">
                                        <ZoomIn size={20} />
                                    </button>
                                </div>
                            </>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        </AnimatePresence >
    );
}