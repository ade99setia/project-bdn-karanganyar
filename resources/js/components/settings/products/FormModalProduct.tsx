import imageCompression from 'browser-image-compression';
import { Upload, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface FormData {
    name: string;
    sku: string;
    category: string;
    description: string;
    price: string;
    is_active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData, imageFile: File | null) => void;
    form: FormData;
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isEdit: boolean;
    loading: boolean;
    editingProductId?: number | null;
    currentImage?: string | null;
}

export default function FormModalProduct({
    isOpen,
    onClose,
    onSubmit,
    form,
    onChange,
    isEdit,
    loading,
    currentImage,
}: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEdit && currentImage) {
            setImagePreview(`/storage/${currentImage}`);
        } else {
            setImagePreview(null);
        }
        setSelectedImage(null);
    }, [isOpen, isEdit, currentImage]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            // Convert to WebP di frontend
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: 1024,
                fileType: 'image/webp',
                initialQuality: 0.8,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            const webpFile = new File([compressedFile], `product-${Date.now()}.webp`, { type: 'image/webp' });
            
            setSelectedImage(webpFile);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('Gagal memproses gambar. Coba gambar lain.');
        } finally {
            setIsCompressing(false);
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(form, selectedImage);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-full! max-w-5xl! mx-auto p-0 gap-0 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden">
                {/* Header Section */}
                <div className="shrink-0 border-b border-gray-200 px-6 py-4 flex items-center bg-white dark:bg-gray-900 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Produk' : 'Tambah Produk'}
                    </h2>
                </div>

                {/* Scrollable Content Section */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Image Upload */}
                            <div className="flex flex-col">
                                <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Gambar Produk
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    disabled={loading || isCompressing}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading || isCompressing}
                                    className="flex-1 flex flex-col"
                                >
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-48 lg:h-64 w-full rounded-xl object-cover flex-1"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 lg:py-12 flex-1 dark:border-gray-700 dark:bg-gray-800/50">
                                            {isCompressing ? (
                                                <>
                                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                                    <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Mengkonversi ke WebP...
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-gray-400" />
                                                    <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Klik untuk upload gambar
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </button>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Format: JPG, PNG, GIF, WebP | Max: 2MB (auto convert ke WebP)
                                </p>
                            </div>

                            {/* Right Column - Form Fields */}
                            <div className="space-y-4 flex flex-col">
                                {/* Name */}
                                <div>
                                    <label className="mb-2 block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        Nama Produk <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={onChange}
                                        placeholder="Contoh: Laptop Dell XPS 13"
                                        disabled={loading || isCompressing}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>

                                {/* SKU */}
                                <div>
                                    <label className="mb-2 block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        SKU <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={form.sku}
                                        onChange={onChange}
                                        placeholder="Contoh: LAPXPS13001"
                                        disabled={loading || isCompressing}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="mb-2 block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={form.category}
                                        onChange={onChange}
                                        placeholder="Contoh: Elektronik, Pakaian, dll"
                                        disabled={loading || isCompressing}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="mb-2 block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        Harga (Rp) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={onChange}
                                        placeholder="0"
                                        disabled={loading || isCompressing}
                                        required
                                        min="0"
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>

                                {/* Is Active */}
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 shrink-0">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        id="is_active"
                                        checked={form.is_active === true}
                                        onChange={(e) => {
                                            onChange({
                                                target: {
                                                    name: 'is_active',
                                                    value: e.target.checked.toString(),
                                                },
                                            } as React.ChangeEvent<HTMLInputElement>);
                                        }}
                                        disabled={loading || isCompressing}
                                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                                        Produk Aktif
                                    </label>
                                </div>

                                {/* Description - Takes remaining space */}
                                <div className="flex-1 flex flex-col">
                                    <label className="mb-2 block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={onChange}
                                        placeholder="Deskripsi produk..."
                                        disabled={loading || isCompressing}
                                        className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Section - Fixed at bottom */}
                <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-white dark:bg-gray-900 dark:border-gray-800 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading || isCompressing}
                        className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 sm:py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || isCompressing}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 sm:py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 text-sm sm:text-base"
                    >
                        {(loading || isCompressing) && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
