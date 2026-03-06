import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AnnouncementPayload = {
    id: number;
    title: string;
    content_html: string;
    created_at: string | null;
    can_view_recipients?: boolean;
    recipients?: Array<{
        id: number;
        name: string;
        role_name?: string | null;
    }>;
};

interface Props {
    announcement: AnnouncementPayload;
}

const formatDateTime = (value: string | null) => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

export default function AnnouncementShowPage({ announcement }: Props) {
    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = contentRef.current;

        if (!container) {
            return;
        }

        const handleImageClick = (event: MouseEvent) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            const imageElement = target.closest('img');

            if (!(imageElement instanceof HTMLImageElement)) {
                return;
            }

            const imageUrl = imageElement.currentSrc || imageElement.src;

            if (!imageUrl) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            openPreview(imageUrl);
        };

        container.addEventListener('click', handleImageClick);

        return () => {
            container.removeEventListener('click', handleImageClick);
        };
    }, [openPreview]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Notifikasi',
            href: '/notifications',
        },
        {
            title: 'Announcements',
            href: `/announcements/${announcement.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${announcement.title}`} />

            {/* Background layar dibuat lebih netral dengan padding yang nyaman */}
            <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
                
                {/* Max-width 4xl (bukan 5xl) adalah ukuran optimal untuk kenyamanan membaca artikel */}
                <div className="mx-auto max-w-4xl">
                    
                    <article className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/60 transition-all dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
                        
                        {/* Area Header Pengumuman */}
                        <header className="border-b border-slate-100 bg-white px-6 py-10 sm:px-12 sm:py-14 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-5 flex items-center">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                    Announcements
                                </span>
                            </div>
                            
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl sm:leading-tight dark:text-white">
                                {announcement.title}
                            </h1>
                            
                            <div className="mt-6 flex items-center text-sm text-slate-500 dark:text-slate-400">
                                <svg className="mr-2 h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                <span>Diterima pada {formatDateTime(announcement.created_at)}</span>
                            </div>
                        </header>

                        {/* Area Konten */}
                        <div className="px-6 py-8 sm:px-12 sm:py-10">
                            <div
                                ref={contentRef}
                                className="max-w-none text-base leading-relaxed text-slate-600 dark:text-slate-300 
                                [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-slate-900 dark:[&_h1]:text-white 
                                [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-slate-900 dark:[&_h2]:text-white 
                                [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white 
                                [&_p]:mb-4 last:[&_p]:mb-0 
                                [&_ul]:mb-4 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mb-2 
                                [&_ol]:mb-4 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mb-2 
                                [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-blue-500 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300 
                                [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:text-lg [&_blockquote]:italic [&_blockquote]:text-slate-700 dark:[&_blockquote]:border-blue-500 dark:[&_blockquote]:bg-slate-800/50 dark:[&_blockquote]:text-slate-200 [&_blockquote]:rounded-r-xl
                                [&_img]:my-8 [&_img]:w-full [&_img]:cursor-zoom-in [&_img]:rounded-2xl [&_img]:shadow-lg [&_img]:ring-1 [&_img]:ring-slate-900/5 dark:[&_img]:ring-white/10 
                                [&_hr]:my-10 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800"
                                dangerouslySetInnerHTML={{ __html: announcement.content_html }}
                            />
                        </div>
                    </article>

                    {announcement.can_view_recipients && (
                        <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Daftar Penerima Pesan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Total penerima: {announcement.recipients?.length ?? 0}
                            </p>

                            {(announcement.recipients?.length ?? 0) === 0 ? (
                                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                    Belum ada data penerima.
                                </div>
                            ) : (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {announcement.recipients?.map((recipient) => (
                                        <span
                                            key={recipient.id}
                                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        >
                                            {recipient.name}
                                            {recipient.role_name ? ` • ${recipient.role_name}` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                </div>
            </div>

            <ImagePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                imageUrl={previewUrl}
            />
        </AppLayout>
    );
}