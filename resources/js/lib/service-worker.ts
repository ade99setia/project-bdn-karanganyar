import { Capacitor } from '@capacitor/core';

export function registerServiceWorker() {
    const shouldRegister = import.meta.env.PROD || Capacitor.isNativePlatform();

    if (!('serviceWorker' in navigator) || !shouldRegister) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Service worker registration failed:', error);
        });
    });
}
