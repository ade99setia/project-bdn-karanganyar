import { AppLauncher } from '@capacitor/app-launcher';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useEffect, useState } from 'react';

export default function MobileGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'web_block' | 'permission_denied' | 'granted'>('loading');

    useEffect(() => {
        const checkAccess = async () => {
            if (Capacitor.getPlatform() === 'web') {
                setStatus('web_block');
                return;
            }

            try {
                const cam = await Camera.requestPermissions();
                const loc = await Geolocation.requestPermissions();

                const isCameraGranted = cam.camera === 'granted' || cam.photos === 'granted';
                const isLocationGranted = loc.location === 'granted' || loc.coarseLocation === 'granted';

                if (isCameraGranted && isLocationGranted) {
                    setStatus('granted');
                } else {
                    console.warn('Izin kurang:', { cam, loc });
                    setStatus('permission_denied');
                }
            } catch (err) {
                console.error('Permission check failed:', err);
                setStatus('permission_denied');
            }
        };

        checkAccess();
    }, []);

    // ── LOADING ──
    if (status === 'loading') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-6 safe-area-inset">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-200 dark:border-indigo-800 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin dark:border-indigo-400" />
                        </div>
                    </div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Memverifikasi akses perangkat...
                    </p>
                </div>
            </div>
        );
    }

    // ── WEB BLOCK ──
    if (status === 'web_block') {
        return (
            <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-md bg-white/5 dark:bg-black/30 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 text-center space-y-8">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 dark:bg-red-900/20 flex items-center justify-center border border-red-400/20 dark:border-red-500/30 shadow-inner">
                            <svg className="w-10 h-10 text-red-400 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white dark:text-white tracking-tight">Akses Terbatas</h1>
                            <p className="text-gray-300 dark:text-gray-400 text-base leading-relaxed">
                                Fitur ini hanya tersedia di aplikasi mobile karena memerlukan akses langsung ke kamera dan lokasi.
                            </p>
                        </div>
                        <a
                            href="/settings/profile"
                            className="inline-flex items-center justify-center px-8 py-4 w-full sm:w-auto bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 dark:from-indigo-700 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/30 dark:shadow-indigo-700/40 transition-all duration-300 hover:shadow-indigo-500/40 dark:hover:shadow-indigo-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 dark:focus:ring-offset-gray-950 active:scale-[0.98]"
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
            <div className="fixed inset-0 bg-linear-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl shadow-gray-300/40 dark:shadow-black/50 overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Izinkan Akses</h1>
                            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-prose mx-auto">
                                Aplikasi ini memerlukan izin{' '}
                                <strong className="text-indigo-700 dark:text-indigo-400">Kamera</strong> dan{' '}
                                <strong className="text-indigo-700 dark:text-indigo-400">Lokasi</strong> untuk berfungsi optimal.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                    // Note: Jika 'package:' gagal, fallback ke:
                                    AppLauncher.openUrl({ url: 'android.settings.APPLICATION_DETAILS_SETTINGS' });
                                }
                            }}
                            className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 dark:from-indigo-700 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/30 dark:shadow-indigo-700/40 transition-all duration-300 hover:shadow-indigo-500/40 dark:hover:shadow-indigo-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 active:scale-[0.98]"
                        >
                            Buka Pengaturan Izin
                        </button>

                        <p className="text-xs text-gray-500 dark:text-gray-400 pt-4">
                            Anda dapat mengubah izin kapan saja di pengaturan perangkat.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}