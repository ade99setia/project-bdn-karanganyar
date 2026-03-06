import { router } from '@inertiajs/react';
import axios from 'axios';

interface SendTargetedPushOptions {
    targetUserIds: number[];
    title: string;
    message: string;
    announcementTitle?: string;
    announcementContent?: string;
    priority?: 'low' | 'normal' | 'high';
    type?: string;
    actionUrl?: string;
    data?: Record<string, unknown>;
}

const TARGETED_PUSH_PRIORITY_BY_TYPE: Record<string, 'low' | 'normal' | 'high'> = {
    stock_assignment: 'normal',
};

/**
 * Push Notification Service
 * Utility service untuk operasi push notification yang umum
 */
export class PushNotificationService {
    /**
     * Kirim push notification ke user tertentu (targeted users)
     */
    static async sendTargeted(options: SendTargetedPushOptions) {
        const {
            targetUserIds,
            title,
            message,
            announcementTitle,
            announcementContent,
            priority,
            type = 'targeted_push',
            actionUrl,
            data = {},
        } = options;

        const resolvedPriority = priority ?? TARGETED_PUSH_PRIORITY_BY_TYPE[type] ?? 'normal';

        if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
            return {
                success: false,
                message: 'Target user kosong.',
                sent: 0,
                failed: 0,
                target_device_count: 0,
                recipient_count: 0,
                skipped_no_token: 0,
            };
        }

        const response = await axios.post('/notifications/targeted-push', {
            target_user_ids: targetUserIds,
            title,
            message,
            announcement_title: announcementTitle,
            announcement_content: announcementContent,
            priority: resolvedPriority,
            type,
            action_url: typeof actionUrl === 'string' && actionUrl.trim() !== '' ? actionUrl.trim() : undefined,
            data,
        });

        return response.data as {
            success: boolean;
            message: string;
            sent: number;
            failed: number;
            target_device_count: number;
            recipient_count: number;
            skipped_no_token: number;
        };
    }

    /**
     * Mark notifikasi sebagai sudah dibaca
     */
    static markAsRead(notificationId: number) {
        router.patch(
            `/notifications/${notificationId}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    }

    /**
     * Kembalikan notifikasi ke status belum dibaca
     */
    static markAsUnread(notificationId: number) {
        router.patch(
            `/notifications/${notificationId}/unread`,
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
            '/notifications/read-all',
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
