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
                const [cam, loc] = await Promise.all([
                    Camera.requestPermissions(),
                    Geolocation.requestPermissions(),
                ]);

                if (cam.camera === 'granted' && loc.location === 'granted') {
                    setStatus('granted');
                } else {
                    setStatus('permission_denied');
                }
            } catch (err) {
                console.error('Permission check failed:', err);
                setStatus('permission_denied');
            }
        };

        checkAccess();
    }, []);

    // ── LOADING ── Elegant minimal spinner
    if (status === 'loading') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full border-4 border-indigo-200 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                        </div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">Memverifikasi akses perangkat...</p>
                </div>
            </div>
        );
    }

    // ── WEB BLOCK ── Premium blocked state
    if (status === 'web_block') {
        return (
            <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-5 sm:p-6">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 sm:p-10 text-center space-y-8">
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-400/20 shadow-inner">
                            <svg
                                className="w-10 h-10 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.8}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                />
                            </svg>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Akses Terbatas</h1>
                            <p className="text-gray-300 text-base leading-relaxed">
                                Fitur ini hanya tersedia di aplikasi mobile karena memerlukan akses langsung ke kamera dan lokasi.
                            </p>
                        </div>

                        <a
                            href="/settings/profile"
                            className="inline-flex items-center justify-center px-8 py-4 w-full sm:w-auto bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-[0.98]"
                        >
                            Kembali ke Profil
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── PERMISSION DENIED ── Trust-focused, calming & actionable
    if (status === 'permission_denied') {
        return (
            <div className="fixed inset-0 bg-linear-to-br from-gray-50 to-white flex items-center justify-center p-5 sm:p-6 safe-area-inset">
                <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl shadow-gray-300/40 overflow-hidden">
                    <div className="p-8 sm:p-10 space-y-8 text-center">
                        <div className="space-y-4">
                            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Izinkan Akses</h1>
                            <p className="text-gray-600 text-base leading-relaxed max-w-prose mx-auto">
                                Aplikasi ini memerlukan izin <strong className="text-indigo-700">Kamera</strong> dan <strong className="text-indigo-700">Lokasi</strong> untuk berfungsi optimal.
                            </p>
                            <p className="text-sm text-gray-500">
                                Data hanya digunakan untuk fitur inti dan dilindungi sesuai kebijakan privasi kami.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                const platform = Capacitor.getPlatform();
                                if (platform === 'ios') {
                                    AppLauncher.openUrl({ url: 'app-settings:' });
                                } else if (platform === 'android') {
                                    AppLauncher.openUrl({ url: 'android.settings.APPLICATION_DETAILS_SETTINGS' }); // Lebih spesifik & modern
                                }
                            }}
                            className="w-full sm:w-auto px-10 py-4 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white active:scale-[0.98]"
                        >
                            Buka Pengaturan Izin
                        </button>

                        <p className="text-xs text-gray-500 pt-4">
                            Anda dapat mengubah izin kapan saja di pengaturan perangkat.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}