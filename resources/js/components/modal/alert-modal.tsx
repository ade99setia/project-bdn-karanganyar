import { AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    type?: "success" | "error" | "warning" | "info";
    primaryButtonText?: string;
    onPrimaryClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryClick?: () => void;
    disableBackdropClick?: boolean;
}

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
    primaryButtonText = "OK",
    onPrimaryClick,
    secondaryButtonText,
    onSecondaryClick,
    disableBackdropClick = false,
}: AlertModalProps) {
    if (!isOpen) return null;

    const variants = {
        success: {
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            ring: "ring-emerald-100/70",
            button: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
            shadow: "shadow-emerald-500/20",
        },
        error: {
            iconBg: "bg-rose-100",
            iconColor: "text-rose-600",
            ring: "ring-rose-100/70",
            button: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
            shadow: "shadow-rose-500/20",
        },
        warning: {
            iconBg: "bg-amber-100",
            iconColor: "text-amber-600",
            ring: "ring-amber-100/70",
            button: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
            shadow: "shadow-amber-500/20",
        },
        info: {
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            ring: "ring-blue-100/70",
            button: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
            shadow: "shadow-blue-500/20",
        },
    };

    const v = variants[type];

    const handlePrimary = () => {
        if (onPrimaryClick) {
            onPrimaryClick();
        } else {
            onClose();
        }
    };

    return createPortal(
        <AnimatePresence>
            <div
                className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md transition-opacity duration-300"
                onClick={() => !disableBackdropClick && onClose()}
            >
                <div
                    className={`
          relative w-full max-w-md bg-white rounded-2xl 
          shadow-[0_20px_70px_-10px_rgba(0,0,0,0.25)]
          border border-gray-100/80
          overflow-hidden
          transform transition-all
          scale-100 opacity-100
          animate-in zoom-in-95 fade-in duration-200
        `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    {!disableBackdropClick && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
                            aria-label="Close"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Icon header */}
                    <div className="pt-10 pb-6 flex justify-center">
                        <div
                            className={`
              p-5 rounded-2xl ${v.iconBg} ${v.iconColor}
              ring-8 ${v.ring}
              shadow-lg ${v.shadow}
              transition-transform duration-300 hover:scale-105
            `}
                        >
                            {type === "success" && <CheckCircle2 size={44} strokeWidth={2} />}
                            {type === "error" && <XCircle size={44} strokeWidth={2} />}
                            {type === "warning" && <AlertTriangle size={44} strokeWidth={2} />}
                            {type === "info" && <Info size={44} strokeWidth={2} />}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-2 text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                            {title}
                        </h2>

                        <div className="mt-3 text-gray-600 text-[15px] leading-relaxed font-light">
                            {message}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="px-8 pt-8 pb-10 flex gap-4">
                        {secondaryButtonText && (
                            <button
                                onClick={onSecondaryClick || onClose}
                                className={`
                flex-1 py-3.5 px-5 rounded-xl font-medium text-sm
                bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                text-gray-700 border border-gray-200
                transition-all duration-200
              `}
                            >
                                {secondaryButtonText}
                            </button>
                        )}

                        <button
                            onClick={handlePrimary}
                            className={`
              flex-1 py-3.5 px-5 rounded-xl font-medium text-sm
              text-white shadow-lg ${v.shadow}
              ${v.button}
              transition-all duration-200 active:scale-[0.98]
            `}
                        >
                            {primaryButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </AnimatePresence >
        ,
        document.body
    );
}