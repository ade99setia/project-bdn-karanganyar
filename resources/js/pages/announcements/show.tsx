import { Capacitor } from '@capacitor/core';
import { Head } from '@inertiajs/react';
import { Calendar, Megaphone, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';
import AppLayout from '@/layouts/app-layout';
import AppLayoutMobile from '@/layouts/app-layout-mobile';
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
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value)).replace('.', ':');
};

export default function AnnouncementShowPage({ announcement }: Props) {
    const Layout = Capacitor.isNativePlatform() ? AppLayoutMobile : AppLayout;

    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        const handleImageClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const imageElement = target.closest('img');
            if (!(imageElement instanceof HTMLImageElement)) return;

            const imageUrl = imageElement.currentSrc || imageElement.src;
            if (!imageUrl) return;

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
            title: 'Detail Pengumuman',
            href: `/announcements/${announcement.id}`,
        },
    ];

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title={`${announcement.title}`} />

            {/* Background layar senada dengan halaman list (slate-50) */}
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 pt-6 px-4 sm:px-6 lg:px-8 font-sans">

                <div className="mx-auto max-w-3xl space-y-6">

                    {/* Card Artikel Utama */}
                    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800">

                        {/* Area Header Pengumuman */}
                        <header className="border-b border-slate-100 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex items-center">
                                {/* Badge Kategori dengan nuansa Biru */}
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Megaphone size={14} />
                                    Pengumuman
                                </span>
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl sm:leading-tight dark:text-white">
                                {announcement.title}
                            </h1>

                            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                                <span>{formatDateTime(announcement.created_at)}</span>
                            </div>
                        </header>

                        {/* Area Konten HTML (Styling Khusus Prose) */}
                        <div className="p-5 sm:p-8">
                            <div
                                ref={contentRef}
                                className="max-w-none text-base leading-relaxed text-slate-700 dark:text-slate-300 
                                /* Headings */
                                [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 dark:[&_h1]:text-white 
                                [&_h2]:my-5 [&_h2]:rounded-r-xl [&_h2]:border-l-4 [&_h2]:border-blue-500 [&_h2]:bg-blue-50 [&_h2]:px-4 [&_h2]:py-2.5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-blue-900 dark:[&_h2]:border-blue-400 dark:[&_h2]:bg-blue-900/20 dark:[&_h2]:text-blue-100 
                                [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-white 
                                /* Paragraphs & Lists */
                                [&_p]:mb-4 last:[&_p]:mb-0 
                                [&_ul]:mb-4 [&_ul]:list-outside [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mb-2 [&_ul>li]:pl-1
                                [&_ol]:mb-4 [&_ol]:list-outside [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mb-2 [&_ol>li]:pl-1
                                /* Links (Biru) */
                                [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300 
                                /* Blockquote (Aksen Oranye) */
                                [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:bg-orange-50/50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-base [&_blockquote]:italic [&_blockquote]:text-slate-700 [&_blockquote]:rounded-r-2xl dark:[&_blockquote]:border-orange-500 dark:[&_blockquote]:bg-orange-500/5 dark:[&_blockquote]:text-slate-300
                                /* Images */
                                [&_img]:my-6 [&_img]:w-full [&_img]:cursor-zoom-in [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-100 [&_img]:bg-slate-50 dark:[&_img]:border-slate-800 dark:[&_img]:bg-slate-900/50 
                                /* Horizontal Rule */
                                [&_hr]:my-8 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-800"
                                dangerouslySetInnerHTML={{ __html: announcement.content_html }}
                            />
                        </div>
                    </article>

                    {/* Card Daftar Penerima (Hanya muncul jika diizinkan) */}
                    {announcement.can_view_recipients && (
                        <section className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Penerima Pesan
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Total: <span className="text-slate-700 dark:text-slate-300">{announcement.recipients?.length ?? 0} orang</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                {(announcement.recipients?.length ?? 0) === 0 ? (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            Tidak ada data penerima spesifik.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {announcement.recipients?.map((recipient) => (
                                            <span
                                                key={recipient.id}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/60 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-700"
                                            >
                                                {recipient.name}
                                                {recipient.role_name && (
                                                    <span className="text-slate-400 dark:text-slate-500 font-normal">
                                                        • {recipient.role_name}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                </div>
            </div>

            <ImagePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                imageUrl={previewUrl}
            />
        </Layout>
    );
}