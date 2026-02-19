import axios, {
    AxiosError,
    type AxiosRequestConfig,
    type AxiosResponse,
} from 'axios';

export interface QueuedRequest {
    id: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    data: unknown;
    createdAt: string;
}

interface OfflineSyncMeta {
    lastSyncedAt: string | null;
    lastFlushFailedAt: string | null;
}

export const OFFLINE_QUEUE_KEY = 'bdn_offline_http_queue';
export const OFFLINE_SYNC_META_KEY = 'bdn_offline_sync_meta';
export const OFFLINE_SYNC_EVENT = 'bdn:offline-sync-updated';
const OFFLINE_GET_CACHE_KEY = 'bdn_offline_get_cache';
const OFFLINE_FALLBACK_URL = '/offline.html';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

let isFlushing = false;

function readQueue(): QueuedRequest[] {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function writeQueue(queue: QueuedRequest[]) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyOfflineSyncUpdated();
}

function readSyncMeta(): OfflineSyncMeta {
    const raw = localStorage.getItem(OFFLINE_SYNC_META_KEY);

    return raw
        ? JSON.parse(raw)
        : {
              lastSyncedAt: null,
              lastFlushFailedAt: null,
          };
}

function writeSyncMeta(meta: OfflineSyncMeta) {
    localStorage.setItem(OFFLINE_SYNC_META_KEY, JSON.stringify(meta));
    notifyOfflineSyncUpdated();
}

function notifyOfflineSyncUpdated() {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT));
}

export function getOfflineSyncSnapshot() {
    const queueCount = readQueue().length;
    const meta = readSyncMeta();

    return {
        queueCount,
        isOnline: navigator.onLine,
        lastSyncedAt: meta.lastSyncedAt,
        lastFlushFailedAt: meta.lastFlushFailedAt,
    };
}

export function getOfflineQueuedRequests() {
    return readQueue();
}

export function clearOfflineQueue() {
    writeQueue([]);
}

export function removeOfflineQueuedRequest(id: string) {
    const queue = readQueue();
    const nextQueue = queue.filter((item) => item.id !== id);
    writeQueue(nextQueue);
}

export async function retryOfflineQueuedRequest(id: string) {
    if (!navigator.onLine) {
        return false;
    }

    const queue = readQueue();
    const target = queue.find((item) => item.id === id);

    if (!target) {
        return false;
    }

    try {
        await axios({
            url: target.url,
            method: target.method as AxiosRequestConfig['method'],
            headers: {
                ...target.headers,
                'x-offline-replay': '1',
            },
            data: target.data,
        });

        const nextQueue = queue.filter((item) => item.id !== id);
        writeQueue(nextQueue);

        const nowIso = new Date().toISOString();
        const currentMeta = readSyncMeta();

        writeSyncMeta({
            lastSyncedAt: nowIso,
            lastFlushFailedAt: nextQueue.length > 0 ? currentMeta.lastFlushFailedAt : null,
        });

        return true;
    } catch {
        writeSyncMeta({
            ...readSyncMeta(),
            lastFlushFailedAt: new Date().toISOString(),
        });

        return false;
    }
}

function cacheKey(config: AxiosRequestConfig) {
    const baseUrl = config.baseURL || '';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${baseUrl}${url}::${params}`;
}

function readGetCache(): Record<string, unknown> {
    const raw = localStorage.getItem(OFFLINE_GET_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
}

function writeGetCache(value: Record<string, unknown>) {
    localStorage.setItem(OFFLINE_GET_CACHE_KEY, JSON.stringify(value));
}

function canQueueBody(data: unknown) {
    return !(typeof FormData !== 'undefined' && data instanceof FormData);
}

function getHeaderValue(headers: unknown, key: string): string {
    if (!headers || typeof headers !== 'object') {
        return '';
    }

    const record = headers as Record<string, unknown>;
    return String(record[key] ?? record[key.toLowerCase()] ?? '');
}

function isLikelyPageRequest(config: AxiosRequestConfig) {
    const accept = getHeaderValue(config.headers, 'Accept');
    const inertia = getHeaderValue(config.headers, 'X-Inertia');

    return Boolean(inertia) || accept.includes('text/html') || accept.includes('application/xhtml+xml');
}

function redirectToOfflinePage() {
    if (window.location.pathname === OFFLINE_FALLBACK_URL) {
        return;
    }

    const from = `${window.location.pathname}${window.location.search}`;
    const target = `${OFFLINE_FALLBACK_URL}?from=${encodeURIComponent(from)}&ts=${Date.now()}`;
    window.location.replace(target);
}

async function enqueueRequest(config: AxiosRequestConfig) {
    const method = String(config.method || 'post').toLowerCase();

    if (!config.url || !MUTATING_METHODS.has(method) || !canQueueBody(config.data)) {
        return false;
    }

    const queue = readQueue();
    queue.push({
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        url: config.url,
        method,
        headers: (config.headers || {}) as Record<string, string>,
        data: config.data,
        createdAt: new Date().toISOString(),
    });

    writeQueue(queue);
    return true;
}

export async function flushOfflineQueue() {
    if (isFlushing || !navigator.onLine) {
        return;
    }

    isFlushing = true;

    try {
        const queue = readQueue();

        if (!queue.length) {
            return;
        }

        const remaining: QueuedRequest[] = [];

        for (const item of queue) {
            try {
                await axios({
                    url: item.url,
                    method: item.method as AxiosRequestConfig['method'],
                    headers: {
                        ...item.headers,
                        'x-offline-replay': '1',
                    },
                    data: item.data,
                });
            } catch {
                remaining.push(item);
            }
        }

        writeQueue(remaining);

        const nowIso = new Date().toISOString();
        const currentMeta = readSyncMeta();

        writeSyncMeta({
            lastSyncedAt: remaining.length === 0 ? nowIso : currentMeta.lastSyncedAt,
            lastFlushFailedAt: remaining.length > 0 ? nowIso : null,
        });
    } finally {
        isFlushing = false;
    }
}

export function initializeOfflineHttp() {
    axios.interceptors.request.use(async (config) => {
        const method = String(config.method || 'get').toLowerCase();
        const isReplay = Boolean((config.headers as Record<string, string> | undefined)?.['x-offline-replay']);

        if (!isReplay && !navigator.onLine && MUTATING_METHODS.has(method)) {
            const queued = await enqueueRequest(config);

            if (queued) {
                const syntheticResponse: AxiosResponse = {
                    data: {
                        queuedOffline: true,
                        message: 'Permintaan disimpan offline dan akan disinkronkan saat online.',
                    },
                    status: 202,
                    statusText: 'Accepted',
                    headers: {},
                    config,
                };

                throw new AxiosError('OFFLINE_QUEUED', 'ERR_CANCELED', config, undefined, syntheticResponse);
            }
        }

        return config;
    });

    axios.interceptors.response.use(
        (response) => {
            const method = String(response.config.method || 'get').toLowerCase();

            if (method === 'get' && response.status >= 200 && response.status < 300) {
                const key = cacheKey(response.config);
                const cache = readGetCache();
                cache[key] = {
                    data: response.data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                };
                writeGetCache(cache);
            }

            return response;
        },
        async (error: AxiosError) => {
            if (error.message === 'OFFLINE_QUEUED' && error.response) {
                return error.response;
            }

            const config = error.config;
            const method = String(config?.method || 'get').toLowerCase();
            const requestFailedOffline = !navigator.onLine || error.code === 'ERR_NETWORK';

            if (config && method === 'get' && requestFailedOffline) {
                const key = cacheKey(config);
                const cache = readGetCache();
                const cached = cache[key] as
                    | {
                          data: unknown;
                          status: number;
                          statusText: string;
                          headers: Record<string, string>;
                      }
                    | undefined;

                if (cached) {
                    return {
                        data: cached.data,
                        status: cached.status,
                        statusText: `${cached.statusText} (offline cache)`,
                        headers: cached.headers,
                        config,
                    } satisfies AxiosResponse;
                }

                if (isLikelyPageRequest(config)) {
                    redirectToOfflinePage();
                }
            }

            return Promise.reject(error);
        },
    );

    window.addEventListener('online', () => {
        void flushOfflineQueue();
    });

    void flushOfflineQueue();
}
