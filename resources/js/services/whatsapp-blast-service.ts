import axios from 'axios';

interface SendWhatsappBlastOptions {
    targetUserIds: number[];
    title: string;
    message: string;
    type?: string;
    attachments?: File[];
    attachmentDeliveryMode?: 'single_combined' | 'separate';
}

export class WhatsappBlastService {
    static async sendTargeted(options: SendWhatsappBlastOptions) {
        const {
            targetUserIds,
            title,
            message,
            type = 'settings_whatsapp_blast',
            attachments = [],
            attachmentDeliveryMode = 'single_combined',
        } = options;

        if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
            return {
                success: false,
                message: 'Target user kosong.',
                sent: 0,
                failed: 0,
                recipient_count: 0,
                skipped_no_phone: 0,
            };
        }

        const formData = new FormData();

        targetUserIds.forEach((userId) => {
            formData.append('target_user_ids[]', String(userId));
        });

        formData.append('title', title);
        formData.append('message', message);
        formData.append('type', type);
        formData.append('attachment_delivery_mode', attachmentDeliveryMode);

        attachments.forEach((attachment) => {
            if (attachment instanceof File) {
                formData.append('attachments[]', attachment);
            }
        });

        const response = await axios.post('/settings/whatsapp-blasting/send', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data as {
            success: boolean;
            message: string;
            sent: number;
            failed: number;
            recipient_count: number;
            skipped_no_phone: number;
        };
    }
}
