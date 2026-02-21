import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import MobileGate from '@/components/mobile-gate';
import AlertModal from '@/components/modal/alert-modal';
import ThemeToggle from "@/components/ui/toggle-theme";
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

interface FlashProps {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

interface AlertConfigType {
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    onConfirm: () => void;
    isFatal: boolean;
}

export default function AppLayoutMobile({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { flash } = usePage<{ flash: FlashProps }>().props;

    const [alertConfig, setAlertConfig] = useState<AlertConfigType>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
        onConfirm: () => { },
        isFatal: false
    });

    useEffect(() => {
        const showAlert = (title: string, message: string, type: "success" | "error" | "warning" | "info", onConfirm?: () => void, isFatal = false) => {
            setAlertConfig({
                isOpen: true,
                title,
                message,
                type,
                onConfirm: onConfirm || (() => setAlertConfig((prev: AlertConfigType) => ({ ...prev, isOpen: false }))),
                isFatal
            });
        };

        if (flash.warning) {
            showAlert('Perhatian', flash.warning, 'warning');
        } else if (flash.success) {
            showAlert('Berhasil', flash.success, 'success');
        } else if (flash.error) {
            showAlert('Gagal', flash.error, 'error');
        } else if (flash.info) {
            showAlert('Informasi', flash.info, 'info');
        }
    }, [flash]);

    return (
        <MobileGate>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}

                <div className="fixed bottom-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                <Toaster position="top-right" />

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={() => setAlertConfig((prev: AlertConfigType) => ({ ...prev, isOpen: false }))}
                    onPrimaryClick={alertConfig.onConfirm}
                    primaryButtonText={alertConfig.type === 'error' ? 'Tutup' : 'OK Mengerti'}
                    disableBackdropClick={alertConfig.isFatal}
                />
            </AppLayoutTemplate>
        </MobileGate>
    );
}