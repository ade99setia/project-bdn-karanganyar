import { router } from '@inertiajs/react';

interface SendTestPushOptions {
    title?: string;
    message?: string;
    priority?: 'low' | 'normal' | 'high';
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

/**
 * Push Notification Service
 * Utility service untuk operasi push notification yang umum
 */
export class PushNotificationService {
    /**
     * Kirim test push notification ke user yang sedang login
     * 
     * @example
     * ```typescript
     * PushNotificationService.sendTest({
     *   title: 'Tes Notifikasi',
     *   message: 'Ini adalah test',
     *   onSuccess: (msg) => showAlert('Berhasil', msg, 'success')
     * });
     * ```
     */
    static sendTest(options: SendTestPushOptions = {}) {
        const {
            title = 'Tes Push Notifikasi',
            message = 'Notifikasi push test berhasil dikirim ke perangkat Anda.',
            priority = 'high',
            onSuccess,
            onError,
        } = options;

        router.post(
            '/sales/notifications/test-push',
            {
                title,
                message,
                priority,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = (page.props as Record<string, unknown>).flash as Record<string, string> | undefined;
                    if (flash?.success && onSuccess) {
                        onSuccess(flash.success);
                    } else if (flash?.error && onError) {
                        onError(flash.error);
                    } else if (flash?.warning && onError) {
                        onError(flash.warning);
                    }
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).join(', ');
                    if (onError) {
                        onError(errorMessage);
                    }
                },
            }
        );
    }

    /**
     * Mark notifikasi sebagai sudah dibaca
     */
    static markAsRead(notificationId: number) {
        router.patch(
            `/sales/notifications/${notificationId}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    }

    /**
     * Mark semua notifikasi sebagai sudah dibaca
     */
    static markAllAsRead() {
        router.patch(
            '/sales/notifications/read-all',
            {},
            {
                preserveScroll: true,
            }
        );
    }

    /**
     * Refresh data notifikasi
     */
    static refresh() {
        router.reload({
            only: ['notifications', 'unreadCount', 'unreadNotificationCount'],
        });
    }
}
