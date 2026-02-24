import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { Loader } from 'lucide-react';
import { useState, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: (photoUrl: string) => void;
    previousAvatarUrl?: string | null;
}

export default function AvatarUploadModal({
    isOpen,
    onClose,
    onUploadSuccess,
    previousAvatarUrl = null,
}: AvatarUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onCropComplete = (_croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Compress image jika terlalu besar
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error compressing image:', error);
        }
    };

    const getCroppedImage = async (): Promise<Blob | null> => {
        if (!imageSrc || !croppedAreaPixels) return null;

        return new Promise((resolve) => {
            const image = new Image();
            image.src = imageSrc;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }

                // Set canvas size ke cropped area (1:1 ratio)
                const size = Math.min(
                    croppedAreaPixels.width,
                    croppedAreaPixels.height
                );
                canvas.width = size;
                canvas.height = size;

                // Draw cropped image
                ctx.drawImage(
                    image,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/webp', 0.9);
            };
        });
    };

    const handleUpload = async () => {
        try {
            setIsLoading(true);
            const croppedBlob = await getCroppedImage();
            if (!croppedBlob) return;

            const formData = new FormData();
            formData.append('photo', croppedBlob, 'avatar.webp');

            const { data } = await axios.post('/settings/profile/avatar', formData, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (data.success) {
                onUploadSuccess(data.photo_path);
                setImageSrc(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                onClose();
            } else {
                alert('Gagal upload: ' + data.message);
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Terjadi kesalahan saat upload foto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Foto Profil</DialogTitle>
                    <DialogDescription>
                        Silahkan pilih foto profil yang ingin diupload.
                    </DialogDescription>
                </DialogHeader>

                {!imageSrc ? (
                    <>
                        <div className="flex items-center justify-center p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full h-full rounded-full overflow-hidden border border-neutral-300 bg-white flex items-center justify-center">
                                    {previousAvatarUrl ? (
                                        <img
                                            src={previousAvatarUrl}
                                            alt="Avatar saat ini"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-neutral-400">Belum ada</span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-600 text-center">Avatar Saat Ini</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-blue-50/50 border-blue-300 hover:bg-blue-50/70"
                            >
                                Pilih Foto
                            </Button>
                            <p className="text-sm text-neutral-500 text-center">
                                Format: JPG, PNG, WebP (Max 2MB)
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div
                            className="relative w-full bg-neutral-100 rounded-lg overflow-hidden"
                            style={{ height: '300px' }}
                        >
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onMediaLoaded={() => { }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Upload...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
