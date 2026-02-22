import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';
import { initializeOfflineHttp } from './lib/offline-http';
import { registerServiceWorker } from './lib/service-worker';

// Set status bar to not overlay the webview and use dark text for better visibility on light backgrounds
StatusBar.setOverlaysWebView({ overlay: false });
StatusBar.setStyle({ style: Style.Dark });

initializeOfflineHttp();
registerServiceWorker();

const verificationPathPattern = /^\/email\/verify\//;

const navigateFromIncomingUrl = (incomingUrl: string) => {
    try {
        const parsedUrl = new URL(incomingUrl);

        if (!verificationPathPattern.test(parsedUrl.pathname)) {
            return;
        }

        const targetUrl = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;

        if (window.location.pathname + window.location.search + window.location.hash === targetUrl) {
            return;
        }

        window.location.href = targetUrl;
    } catch {
        // Ignore malformed incoming URLs.
    }
};

if (Capacitor.isNativePlatform()) {
    void App.getLaunchUrl().then((launchUrl) => {
        if (launchUrl?.url) {
            navigateFromIncomingUrl(launchUrl.url);
        }
    });

    void App.addListener('appUrlOpen', ({ url }) => {
        if (url) {
            navigateFromIncomingUrl(url);
        }
    });
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
