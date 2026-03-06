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
    const hasHandledPrimaryRef = React.useRef(false);

    React.useEffect(() => {
        if (isOpen) {
            hasHandledPrimaryRef.current = false;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const variants = {
        success: {
            iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
            iconColor: "text-emerald-600 dark:text-emerald-300",
            ring: "ring-emerald-100/70 dark:ring-emerald-900/35",
            button: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
            shadow: "shadow-emerald-500/20",
        },
        error: {
            iconBg: "bg-rose-100 dark:bg-rose-900/30",
            iconColor: "text-rose-600 dark:text-rose-300",
            ring: "ring-rose-100/70 dark:ring-rose-900/35",
            button: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800",
            shadow: "shadow-rose-500/20",
        },
        warning: {
            iconBg: "bg-amber-100 dark:bg-amber-900/30",
            iconColor: "text-amber-600 dark:text-amber-300",
            ring: "ring-amber-100/70 dark:ring-amber-900/35",
            button: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
            shadow: "shadow-amber-500/20",
        },
        info: {
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-300",
            ring: "ring-blue-100/70 dark:ring-blue-900/35",
            button: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
            shadow: "shadow-blue-500/20",
        },
    };

    const v = variants[type];

    const handlePrimary = () => {
        if (hasHandledPrimaryRef.current) return;
        hasHandledPrimaryRef.current = true;

        onClose();
        onPrimaryClick?.();
    };

    return createPortal(
        <AnimatePresence>
            <div
                className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md transition-opacity duration-300"
                onClick={() => !disableBackdropClick && onClose()}
            >
                <div
                    className={`
          relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-white dark:bg-zinc-950 rounded-2xl 
          shadow-[0_20px_70px_-10px_rgba(0,0,0,0.25)]
          border border-gray-100/80 dark:border-zinc-800/70
          overflow-hidden max-h-[90vh] overflow-y-auto
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
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 rounded-full text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100/80 dark:hover:bg-zinc-800/70 transition-all duration-200"
                            aria-label="Close"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    )}

                    {/* Icon header */}
                    <div className="pt-8 sm:pt-10 pb-5 sm:pb-6 flex justify-center">
                        <div
                            className={`
              p-4 sm:p-5 rounded-2xl ${v.iconBg} ${v.iconColor}
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
                    <div className="px-5 sm:px-8 pb-2 text-center">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                            {title}
                        </h2>

                        <div className="mt-3 text-gray-600 dark:text-zinc-300 text-sm sm:text-[15px] leading-relaxed font-light wrap-break-word">
                            {message}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                        {secondaryButtonText && (
                            <button
                                onClick={onSecondaryClick || onClose}
                                className={`
                flex-1 py-3.5 px-5 rounded-xl font-medium text-sm
                bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 active:bg-gray-300 dark:active:bg-zinc-700
                text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700
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
                            transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-zinc-950
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