import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import MobileGate from '@/components/mobile-gate';
import AlertModal from '@/components/modal/alert-modal';
import ThemeToggle from "@/components/ui/toggle-theme";
import { usePushNotifications } from '@/hooks/usePushNotifications';
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
    const page = usePage<{ flash: FlashProps; url?: string }>();
    const { flash, url = '' } = page.props;

    const rawCurrentUrl = page.url || url || (typeof window !== 'undefined' ? window.location.pathname : '');
    const currentPath = rawCurrentUrl.startsWith('http')
        ? new URL(rawCurrentUrl).pathname
        : rawCurrentUrl;

    const MOBILE_GATE_REQUIRED_URLS = [
        '/sales/dashboard',
    ];
    const needsMobileGate = MOBILE_GATE_REQUIRED_URLS.some((requiredUrl) => currentPath.startsWith(requiredUrl));

    usePushNotifications({
        autoRefreshOnReceive: true,
    });

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

    const content = (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <div className="pb-5">
                {children}
            </div>

            <div className="fixed bottom-30 right-4 z-50">
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

            <MobileBottomNav />
        </AppLayoutTemplate>
    );

    return needsMobileGate ? <MobileGate>{content}</MobileGate> : content;
}