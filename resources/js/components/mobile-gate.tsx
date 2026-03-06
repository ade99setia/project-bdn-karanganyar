import { AppLauncher } from '@capacitor/app-launcher';
import { Camera } from '@capacitor/camera';
import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useCallback, useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface MockLocationPlugin {
    isMockLocationEnabled: () => Promise<{ isMockLocationEnabled: boolean }>;
}

interface DevModePlugin {
    isEnabled: () => Promise<{ enabled: boolean }>;
}

const MockLocationChecker = registerPlugin<MockLocationPlugin>('MockLocationChecker');
const DevMode = registerPlugin<DevModePlugin>('DevMode');

export default function MobileGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'web_block' | 'permission_denied' | 'notification_required' | 'fake_gps_detected' | 'developer_mode_detected' | 'granted'>('loading');
    const [isEnablingPush, setIsEnablingPush] = useState(false);
    const [pushEnableMessage, setPushEnableMessage] = useState<string | null>(null);

    const { enablePush, checkPushStatus } = usePushNotifications({
        setupListeners: false,
    });

    const checkAccess = useCallback(async () => {
        if (Capacitor.getPlatform() === 'web') {
            setStatus('web_block');
            return;
        }

        try {
            // ── CEK FAKE GPS / MOCK LOCATION ──
            try {
                if (MockLocationChecker) {
                    const mockLocationResult = await MockLocationChecker.isMockLocationEnabled();
                    if (mockLocationResult?.isMockLocationEnabled === true) {
                        console.warn('Fake GPS terdeteksi');
                        setStatus('fake_gps_detected');
                        return;
                    }
                }
            } catch (err) {
                console.warn('MockLocationChecker tidak tersedia:', err);
                // Lanjut ke check berikutnya jika plugin tidak tersedia
            }

            // ── CEK DEVELOPER MODE ──
            try {
                const devModeResult = await DevMode.isEnabled();
                if (devModeResult?.enabled === true) {
                    console.warn('Developer mode terdeteksi');
                    setStatus('developer_mode_detected');
                    return;
                }
            } catch (err) {
                console.warn('DevMode check tidak tersedia:', err);
                // Lanjut ke permission check
            }

            // ── CEK PERMISSIONS ──
            const cam = await Camera.requestPermissions();
            const loc = await Geolocation.requestPermissions();

            const isCameraGranted = cam.camera === 'granted' || cam.photos === 'granted';
            const isLocationGranted = loc.location === 'granted' || loc.coarseLocation === 'granted';

            if (!isCameraGranted || !isLocationGranted) {
                console.warn('Izin kurang:', { cam, loc });
                setStatus('permission_denied');
                return;
            }

            const isPushEnabled = await checkPushStatus();
            if (!isPushEnabled) {
                setStatus('notification_required');
                return;
            }

            setStatus('granted');
        } catch (err) {
            console.error('Permission check failed:', err);
            setStatus('permission_denied');
        }
    }, [checkPushStatus]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void checkAccess();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [checkAccess]);

    const handleEnablePushNotifications = async () => {
        if (isEnablingPush) {
            return;
        }

        setPushEnableMessage(null);
        setIsEnablingPush(true);

        const result = await enablePush();

        if (!result.success) {
            setPushEnableMessage(result.message || 'Gagal mengaktifkan notifikasi push.');
            setIsEnablingPush(false);
            return;
        }

        await checkAccess();
        setIsEnablingPush(false);
    };

    // ── LOADING ──
    if (status === 'loading') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-6 safe-area-inset">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-cyan-500/20 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                        </div>
                    </div>
                    <p className="text-lg font-medium text-cyan-200/90">
                        Memverifikasi akses perangkat...
                    </p>
                </div>
            </div>
        );
    }

    // ── WEB BLOCK ──
    if (status === 'web_block') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 text-center space-y-8">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 shadow-inner">
                            <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Akses Terbatas</h1>
                            <p className="text-cyan-200/70 text-base leading-relaxed">
                                Fitur ini hanya tersedia di aplikasi mobile karena memerlukan akses langsung ke kamera dan lokasi.
                            </p>
                        </div>
                        <a
                            href="/settings/profile"
                            className="inline-flex items-center justify-center px-8 py-4 w-full sm:w-auto bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98]"
                        >
                            Kembali ke Profil
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── PERMISSION DENIED ──
    if (status === 'permission_denied') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Izinkan Akses</h1>
                            <p className="text-cyan-200/70 text-base leading-relaxed max-w-prose mx-auto">
                                Aplikasi ini memerlukan izin{' '}
                                <strong className="text-cyan-400">Kamera</strong> dan{' '}
                                <strong className="text-cyan-400">Lokasi</strong> untuk berfungsi optimal.
                            </p>
                            <p className="text-sm text-cyan-200/50">
                                Data hanya digunakan untuk fitur inti dan dilindungi sesuai kebijakan privasi kami.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                const platform = Capacitor.getPlatform();
                                if (platform === 'ios') {
                                    AppLauncher.openUrl({ url: 'app-settings:' });
                                } else if (platform === 'android') {
                                    AppLauncher.openUrl({ url: 'package:' + 'com.your.package.name' });
                                    AppLauncher.openUrl({ url: 'android.settings.APPLICATION_DETAILS_SETTINGS' });
                                }
                            }}
                            className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98]"
                        >
                            Buka Pengaturan Izin
                        </button>

                        <p className="text-xs text-cyan-200/40 pt-4">
                            Anda dapat mengubah izin kapan saja di pengaturan perangkat.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── FAKE GPS DETECTED ──
    if (status === 'fake_gps_detected') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="relative">
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 shadow-inner">
                                <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m0 4v2M4.22 4.22a9 9 0 0110.02-2.01M19.78 19.78a9 9 0 01-10.02 2.01M4.22 19.78a9 9 0 01-2.01-10.02M19.78 4.22a9 9 0 012.01 10.02M9 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Lokasi Palsu Terdeteksi</h1>
                            <p className="text-cyan-200/70 text-base leading-relaxed max-w-prose mx-auto">
                                Aplikasi mendeteksi penggunaan <strong>Mock Location</strong> atau <strong>Fake GPS</strong>.
                            </p>
                            <p className="text-sm text-cyan-200/50">
                                Fitur ini hanya dapat diakses dengan lokasi GPS yang sebenarnya.
                            </p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <p className="text-xs text-cyan-400 font-medium">Cara mematikan Fake GPS:</p>
                            <p className="text-xs text-cyan-200/50 leading-relaxed">
                                📱 Buka Pengaturan → Aplikasi → Aplikasi penyedia lokasi → Nonaktifkan
                            </p>
                        </div>
                        <button
                            onClick={() => location.reload()}
                            className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98]"
                        >
                            Periksa Ulang
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── PUSH NOTIFICATION REQUIRED ──
    if (status === 'notification_required') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Aktifkan Notifikasi</h1>
                            <p className="text-cyan-200/70 text-base leading-relaxed max-w-prose mx-auto">
                                Sebelum masuk ke halaman utama, Anda wajib mengaktifkan izin notifikasi dan menerima push notification.
                            </p>
                            <p className="text-sm text-cyan-200/50">
                                Ini diperlukan agar update tugas dan info penting tidak terlewat.
                            </p>
                        </div>

                        {pushEnableMessage && (
                            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {pushEnableMessage}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleEnablePushNotifications}
                                disabled={isEnablingPush}
                                className="w-full px-10 py-4 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98] disabled:opacity-70"
                            >
                                {isEnablingPush ? 'Mengaktifkan Notifikasi...' : 'Aktifkan Notifikasi Sekarang'}
                            </button>

                            <button
                                onClick={() => {
                                    const platform = Capacitor.getPlatform();
                                    if (platform === 'ios') {
                                        AppLauncher.openUrl({ url: 'app-settings:' });
                                    } else if (platform === 'android') {
                                        AppLauncher.openUrl({ url: 'android.settings.APP_NOTIFICATION_SETTINGS' });
                                    }
                                }}
                                className="w-full px-10 py-4 bg-white/10 hover:bg-white/15 text-cyan-100 font-semibold rounded-2xl border border-cyan-400/30 transition-all duration-300"
                            >
                                Buka Pengaturan Notifikasi
                            </button>

                            <button
                                onClick={() => void checkAccess()}
                                className="w-full px-10 py-4 bg-transparent hover:bg-white/5 text-cyan-200/90 font-medium rounded-2xl border border-cyan-400/20 transition-all duration-300"
                            >
                                Cek Status Lagi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── DEVELOPER MODE DETECTED ──
    if (status === 'developer_mode_detected') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-950 via-indigo-950 to-black flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="relative">
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-400/20 shadow-inner">
                                <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4m0 6v2m0 0v2m0-6l-4-4M5 12a7 7 0 1114 0 7 7 0 01-14 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Mode Pengembang Aktif</h1>
                            <p className="text-cyan-200/70 text-base leading-relaxed max-w-prose mx-auto">
                                Aplikasi mendeteksi <strong>Developer Mode</strong> diaktifkan di perangkat Anda.
                            </p>
                            <p className="text-sm text-cyan-200/50">
                                Fitur ini tidak dapat diakses saat mode pengembang aktif untuk alasan keamanan.
                            </p>
                        </div>
                        <div className="pt-4 space-y-3">
                            <p className="text-xs text-cyan-400 font-medium">Cara menonaktifkan Developer Mode:</p>
                            <p className="text-xs text-cyan-200/50 leading-relaxed">
                                📱 Buka Pengaturan → Tentang Ponsel → Ketuk 7x Build Number → Kembali ke Pengaturan → Opsi Pengembang → Nonaktifkan
                            </p>
                        </div>
                        <button
                            onClick={() => location.reload()}
                            className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 font-semibold rounded-2xl shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98]"
                        >
                            Periksa Ulang
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
