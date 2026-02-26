import { Capacitor } from '@capacitor/core';

export function registerServiceWorker() {
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const shouldRegister = (import.meta.env.PROD || Capacitor.isNativePlatform()) && !isLocalHost;

    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!shouldRegister) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister();
            });
        });

        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Service worker registration failed:', error);
        });
    });
}
