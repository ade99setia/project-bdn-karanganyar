import { Capacitor } from '@capacitor/core';
import { router } from '@inertiajs/react';
import { useEffect, useCallback } from 'react';

type PushNotificationCallback = (title: string, body: string, data?: Record<string, unknown>) => void;

interface UsePushNotificationsOptions {
    onReceived?: PushNotificationCallback;
    onActionPerformed?: PushNotificationCallback;
    autoRefreshOnReceive?: boolean;
}

/**
 * Custom hook untuk handle push notifications
 * 
 * @example
 * ```tsx
 * const { enablePush, isRegistering } = usePushNotifications({
 *   onReceived: (title, body) => {
 *     showAlert('Notifikasi Baru', body, 'info');
 *   }
 * });
 * ```
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
    const {
        onReceived,
        onActionPerformed,
        autoRefreshOnReceive = true,
    } = options;

    // Setup listeners untuk handle push notifications yang masuk
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const cleanupFunctions: (() => void)[] = [];

        const setupListeners = async () => {
            try {
                const { PushNotifications } = await import('@capacitor/push-notifications');

                // Listener ketika notifikasi diterima saat app dibuka (foreground)
                const receivedListener = await PushNotifications.addListener(
                    'pushNotificationReceived',
                    (notification) => {
                        console.log('Push received (foreground):', notification);
                        
                        if (onReceived) {
                            onReceived(
                                notification.title || 'Notifikasi Baru',
                                notification.body || '',
                                notification.data
                            );
                        }

                        if (autoRefreshOnReceive) {
                            router.reload({ only: ['notifications', 'unreadCount', 'unreadNotificationCount'] });
                        }
                    }
                );

                // Listener ketika user tap notifikasi
                const actionListener = await PushNotifications.addListener(
                    'pushNotificationActionPerformed',
                    (notification) => {
                        console.log('Push action performed:', notification);
                        
                        // Navigate ke halaman yang ditentukan di action_url
                        const actionUrl = notification.notification.data?.action_url;
                        if (actionUrl && typeof actionUrl === 'string') {
                            router.visit(actionUrl);
                        }
                        
                        if (onActionPerformed) {
                            onActionPerformed(
                                notification.notification.title || '',
                                notification.notification.body || '',
                                notification.notification.data
                            );
                        }

                        if (autoRefreshOnReceive && !actionUrl) {
                            router.reload({ only: ['notifications', 'unreadCount', 'unreadNotificationCount'] });
                        }
                    }
                );

                cleanupFunctions.push(
                    () => receivedListener.remove(),
                    () => actionListener.remove()
                );
            } catch (error) {
                console.error('Error setting up push listeners:', error);
            }
        };

        setupListeners();

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [onReceived, onActionPerformed, autoRefreshOnReceive]);

    /**
     * Aktifkan push notifications dan register device token
     */
    const enablePush = useCallback(async (): Promise<{
        success: boolean;
        message: string;
        token?: string;
    }> => {
        if (!Capacitor.isNativePlatform()) {
            return {
                success: false,
                message: 'Push notification hanya tersedia di aplikasi mobile native.',
            };
        }

        try {
            const { PushNotifications } = await import('@capacitor/push-notifications');

            // Request permission
            const permission = await Promise.race([
                PushNotifications.requestPermissions(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Permission request timeout')), 10000)
                ),
            ]) as { receive: string };

            if (permission.receive !== 'granted') {
                return {
                    success: false,
                    message: 'Izin notifikasi ditolak. Silakan aktifkan di pengaturan perangkat.',
                };
            }

            // Register for push
            await Promise.race([
                PushNotifications.register(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Register timeout')), 10000)
                ),
            ]);

            // Wait for token registration
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({
                        success: false,
                        message: 'Timeout menunggu token registrasi.',
                    });
                }, 15000);

                PushNotifications.addListener('registration', async (token) => {
                    clearTimeout(timeout);

                    try {
                        const result = await registerDeviceToken(token.value);
                        resolve(result);
                    } catch (error) {
                        resolve({
                            success: false,
                            message: error instanceof Error ? error.message : 'Gagal mendaftar token',
                        });
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    clearTimeout(timeout);
                    console.error('Registration error:', error);
                    resolve({
                        success: false,
                        message: 'Gagal mendaftar push notification. Coba restart aplikasi.',
                    });
                });
            });
        } catch (error) {
            console.error('Error enabling push:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Terjadi kesalahan',
            };
        }
    }, []);

    return {
        enablePush,
    };
}

/**
 * Register device token ke server
 */
async function registerDeviceToken(token: string): Promise<{
    success: boolean;
    message: string;
    token?: string;
}> {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const xsrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
    }

    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
    }

    const response = await fetch('/sales/notifications/device-token', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
            token: token,
            platform: Capacitor.getPlatform(),
        }),
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
    }

    if (response.ok) {
        return {
            success: true,
            message: 'Push notification berhasil diaktifkan!',
            token: token,
        };
    } else {
        throw new Error(data.message || JSON.stringify(data));
    }
}
