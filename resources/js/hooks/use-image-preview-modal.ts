import { useCallback, useState } from 'react';

export function useImagePreviewModal() {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const openPreview = useCallback((url: string) => {
        setPreviewUrl(url);
        setIsPreviewOpen(true);
    }, []);

    const closePreview = useCallback(() => {
        setIsPreviewOpen(false);
        setPreviewUrl('');
    }, []);

    return {
        isPreviewOpen,
        previewUrl,
        openPreview,
        closePreview,
        setIsPreviewOpen,
        setPreviewUrl,
    };
}
