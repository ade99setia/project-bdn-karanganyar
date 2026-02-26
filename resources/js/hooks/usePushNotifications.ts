import { Capacitor } from '@capacitor/core';
import { router } from '@inertiajs/react';
import { useEffect, useCallback } from 'react';

const PUSH_TOKEN_STORAGE_KEY = 'sales_push_device_token';

type PushNotificationCallback = (title: string, body: string, data?: Record<string, unknown>) => void;

interface UsePushNotificationsOptions {
    onReceived?: PushNotificationCallback;
    onActionPerformed?: PushNotificationCallback;
    autoRefreshOnReceive?: boolean;
    setupListeners?: boolean;
}

async function showForegroundNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        let permission = await LocalNotifications.checkPermissions();
        if (permission.display !== 'granted') {
            permission = await LocalNotifications.requestPermissions();
        }

        if (permission.display !== 'granted') {
            return;
        }

        const notificationId = Math.floor(Date.now() % 2147483647);

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: notificationId,
                    title,
                    body,
                    channelId: 'default',
                    smallIcon: 'ic_stat_name',
                    extra: data,
                    schedule: { at: new Date(Date.now() + 100) },
                },
            ],
        });
    } catch (error) {
        console.error('Error showing foreground system notification:', error);
    }
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
        setupListeners: shouldSetupListeners = true,
    } = options;

    // Setup listeners untuk handle push notifications yang masuk
    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !shouldSetupListeners) return;

        const cleanupFunctions: (() => void)[] = [];

        const handleNotificationAction = (
            title: string,
            body: string,
            data?: Record<string, unknown>
        ) => {
            const actionUrl = data?.action_url;

            if (actionUrl && typeof actionUrl === 'string') {
                router.visit(actionUrl);
            }

            if (onActionPerformed) {
                onActionPerformed(title, body, data);
            }

            if (autoRefreshOnReceive && !actionUrl) {
                router.reload({ only: ['notifications', 'unreadCount', 'unreadNotificationCount'] });
            }
        };

        const initListeners = async () => {
            try {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const { LocalNotifications } = await import('@capacitor/local-notifications');

                // Listener ketika notifikasi diterima saat app dibuka (foreground)
                const receivedListener = await PushNotifications.addListener(
                    'pushNotificationReceived',
                    async (notification) => {
                        console.log('Push received (foreground):', notification);

                        await showForegroundNotification(
                            notification.title || 'Notifikasi Baru',
                            notification.body || '',
                            notification.data
                        );
                        
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

                        handleNotificationAction(
                            notification.notification.title || '',
                            notification.notification.body || '',
                            notification.notification.data
                        );
                    }
                );

                const localActionListener = await LocalNotifications.addListener(
                    'localNotificationActionPerformed',
                    (event) => {
                        console.log('Local notification action performed:', event);

                        const localNotification = event.notification;
                        const extraData =
                            localNotification?.extra && typeof localNotification.extra === 'object'
                                ? (localNotification.extra as Record<string, unknown>)
                                : undefined;

                        handleNotificationAction(
                            localNotification?.title || '',
                            localNotification?.body || '',
                            extraData
                        );
                    }
                );

                cleanupFunctions.push(
                    () => receivedListener.remove(),
                    () => actionListener.remove(),
                    () => localActionListener.remove()
                );
            } catch (error) {
                console.error('Error setting up push listeners:', error);
            }
        };

        initListeners();

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [onReceived, onActionPerformed, autoRefreshOnReceive, shouldSetupListeners]);

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

            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.requestPermissions();
            } catch (error) {
                console.warn('Local notification permission request skipped:', error);
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

                        if (result.success) {
                            localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token.value);
                        }

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

    const disablePush = useCallback(async (): Promise<{
        success: boolean;
        message: string;
    }> => {
        if (!Capacitor.isNativePlatform()) {
            return {
                success: false,
                message: 'Fitur ini hanya tersedia di aplikasi mobile native.',
            };
        }

        try {
            const storedToken = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

            const response = await requestJson('/notifications/device-token/deactivate', {
                method: 'POST',
                body: JSON.stringify({
                    token: storedToken,
                    platform: Capacitor.getPlatform(),
                }),
            });

            try {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                await PushNotifications.unregister();
            } catch (error) {
                console.warn('Push unregister skipped:', error);
            }

            localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);

            return {
                success: true,
                message: typeof response.message === 'string' ? response.message : 'Push notification berhasil dinonaktifkan.',
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Gagal menonaktifkan push notification.',
            };
        }
    }, []);

    const checkPushStatus = useCallback(async (): Promise<boolean> => {
        if (!Capacitor.isNativePlatform()) {
            return false;
        }

        try {
            const platform = Capacitor.getPlatform();
            const response = await requestJson(`/notifications/device-token/status?platform=${platform}`, {
                method: 'GET',
            });

            return Boolean(response.enabled);
        } catch (error) {
            console.warn('Gagal cek status push:', error);
            return false;
        }
    }, []);

    return {
        enablePush,
        disablePush,
        checkPushStatus,
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
    const data = await requestJson('/notifications/device-token', {
        method: 'POST',
        body: JSON.stringify({
            token: token,
            platform: Capacitor.getPlatform(),
        }),
    });

    return {
        success: true,
        message: typeof data.message === 'string' ? data.message : 'Push notification berhasil diaktifkan!',
        token: token,
    };
}

function buildJsonHeaders(): Record<string, string> {
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

    return headers;
}

async function requestJson(
    url: string,
    init: RequestInit
): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
        credentials: 'include',
        headers: buildJsonHeaders(),
        ...init,
    });

    const contentType = response.headers.get('content-type');
    let data: Record<string, unknown>;

    if (contentType?.includes('application/json')) {
        data = await response.json() as Record<string, unknown>;
    } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
    }

    if (response.ok) {
        return data;
    }

    const message = typeof data.message === 'string' ? data.message : JSON.stringify(data);
    throw new Error(message);
}
