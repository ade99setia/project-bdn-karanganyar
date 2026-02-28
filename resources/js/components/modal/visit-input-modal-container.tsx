import { router } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { useEffect, useRef, useState } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import VisitInputModal from '@/components/modal/visit-input-modal';

interface Customer {
    id: number;
    name: string;
    address: string;
    distance?: number;
    phone?: string;
    notes?: string;
}

interface Product {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
    category?: string;
    price?: number;
    stock_quantity?: number;
}

interface CartItem {
    product_id: number;
    quantity: number;
    action_type: string;
    product_name?: string;
    unit_price?: number;
}

interface LocationPosition {
    coords: {
        latitude: number;
        longitude: number;
    };
}

interface VisitInputModalContainerProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    getVerifiedLocation: () => Promise<LocationPosition | null>;
    onPreviewImage: (url: string) => void;
    showAlert?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void, isFatal?: boolean) => void;
}

export default function VisitInputModalContainer({
    isOpen,
    onClose,
    products,
    getVerifiedLocation,
    onPreviewImage,
    showAlert: showAlertFromProps,
}: VisitInputModalContainerProps) {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: () => { },
        isFatal: false,
    });

    const showAlert = showAlertFromProps || ((title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void, isFatal = false) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, isOpen: false })) ),
            isFatal,
        });
    });
    const [processing, setProcessing] = useState(false);
    const [customerMode, setCustomerMode] = useState<'database' | 'manual'>('database');
    const [nearbyCustomers, setNearbyCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [manualCustomerNote, setManualCustomerNote] = useState('');
    const [manualCustomerPhone, setManualCustomerPhone] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [tempContactData, setTempContactData] = useState({ name: '', notes: '', phone: '' });
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    const [visitType, setVisitType] = useState('visit');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isStartingCamera, setIsStartingCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [tempProdId, setTempProdId] = useState<string>('');
    const [tempQty, setTempQty] = useState<number>(0);
    const [tempAction, setTempAction] = useState<string>('terjual');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (!photo) {
            setPhotoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(photo);
        setPhotoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [photo]);

    useEffect(() => {
        if (!isOpen) return;

        setNearbyCustomers([]);
        setSelectedCustomerId(null);
        setCustomerMode('database');
        setIsLoadingCustomers(true);

        const loadNearbyCustomers = async () => {
            const pos = await getVerifiedLocation();

            if (!pos) {
                setCustomerMode('manual');
                setIsLoadingCustomers(false);
                return;
            }

            try {
                const { latitude, longitude } = pos.coords;
                const res = await axios.post('/sales/utils/nearby-customers', {
                    lat: latitude,
                    lng: longitude,
                });

                const customers = Array.isArray(res.data) ? res.data : res.data.data || [];
                setNearbyCustomers(customers);
                setCustomerMode(customers.length > 0 ? 'database' : 'manual');
            } catch (error: unknown) {
                if (error instanceof Error) {
                    showAlert(
                        'Gagal Mengambil Lokasi Terdekat',
                        `Error: ${error.message || 'Tidak ada customer terdekat dalam radius 2km'}`,
                        'warning'
                    );
                }
                setCustomerMode('manual');
            } finally {
                setIsLoadingCustomers(false);
            }
        };

        void loadNearbyCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const getXsrfToken = () => decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsCameraOpen(false);
    };

    const startCamera = async () => {
        if (isStartingCamera || isCompressing) return;

        setIsStartingCamera(true);
        setCameraError(null);

        try {
            stopCamera();

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = mediaStream;
            setIsCameraOpen(true);
        } catch {
            setCameraError('Kamera tidak bisa diakses. Cek izin kamera pada browser/perangkat.');
            stopCamera();
        } finally {
            setIsStartingCamera(false);
        }
    };

    useEffect(() => {
        if (!isCameraOpen || !streamRef.current || !videoRef.current) return;

        const videoElement = videoRef.current;
        videoElement.srcObject = streamRef.current;

        void videoElement.play().catch(() => {
            setCameraError('Preview kamera tidak bisa ditampilkan. Coba tutup lalu buka kamera lagi.');
        });
    }, [isCameraOpen]);

    const processPhotoFile = async (file: File) => {
        setIsCompressing(true);
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.35,
                maxWidthOrHeight: 1024,
                fileType: 'image/webp',
                initialQuality: 0.72,
                useWebWorker: false,
            });
            const finalFile = new File([compressed], `visit-${Date.now()}.webp`, { type: 'image/webp' });
            setPhoto(finalFile);
        } catch {
            showAlert(
                'Gagal Memproses Foto',
                'Terjadi kesalahan saat mengompresi foto. Silakan coba lagi dengan foto yang berbeda.',
                'error'
            );
        } finally {
            setIsCompressing(false);
        }
    };

    const handlePhotoCapture = (file: File) => {
        void processPhotoFile(file);
    };

    const handleCaptureFromCamera = () => {
        const video = videoRef.current;
        if (!video) return;

        const sourceWidth = video.videoWidth || 1280;
        const sourceHeight = video.videoHeight || 720;
        const maxWidth = 1280;
        const targetWidth = Math.min(sourceWidth, maxWidth);
        const targetHeight = Math.round((sourceHeight / sourceWidth) * targetWidth);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setCameraError('Gagal memproses hasil kamera. Coba lagi.');
            return;
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        canvas.toBlob((blob) => {
            if (!blob) {
                setCameraError('Gagal mengambil foto dari kamera. Coba ulangi.');
                return;
            }

            const file = new File([blob], `visit-${Date.now()}.webp`, { type: 'image/webp' });
            handlePhotoCapture(file);
            stopCamera();
        }, 'image/webp', 0.78);
    };

    useEffect(() => {
        if (isOpen) return;

        setCameraError(null);
        stopCamera();
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const addToCart = () => {
        if (!tempProdId) return;
        const selectedProduct = products.find(p => p.id === Number(tempProdId));
        if (!selectedProduct) return;

        const normalizedAction = tempAction === 'sold' ? 'terjual' : tempAction;
        const requestedQty = Math.max(0, Number(tempQty) || 0);

        if (requestedQty <= 0) {
            showAlert(
                'Qty Tidak Valid',
                'Jumlah produk harus lebih dari 0.',
                'warning'
            );
            return;
        }

        if (normalizedAction === 'terjual') {
            const stockQty = Math.max(0, Number(selectedProduct.stock_quantity ?? 0));
            const soldQtyInCart = cart
                .filter(c => c.product_id === Number(tempProdId) && (c.action_type === 'terjual' || c.action_type === 'sold'))
                .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

            if ((soldQtyInCart + requestedQty) > stockQty) {
                const remaining = Math.max(0, stockQty - soldQtyInCart);
                showAlert(
                    'Stok Tidak Cukup',
                    `Stok tersisa untuk produk ini hanya ${remaining} unit di gudang Anda.`,
                    'warning'
                );
                return;
            }
        }

        const existingIndex = cart.findIndex(c => c.product_id === Number(tempProdId) && c.action_type === tempAction);

        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += tempQty;
            if (!newCart[existingIndex].unit_price) {
                newCart[existingIndex].unit_price = selectedProduct.price || 0;
            }
            setCart(newCart);
        } else {
            setCart([...cart, {
                product_id: Number(tempProdId),
                quantity: tempQty,
                action_type: tempAction,
                product_name: selectedProduct.name,
                unit_price: selectedProduct.price || 0,
            }]);
        }
        setTempProdId('');
        setTempQty(1);
    };

    const isNegativeAction = (actionType: string) => actionType === 'retur' || actionType === 'returned';

    const selectedProductForInput = tempProdId
        ? products.find(p => p.id === Number(tempProdId))
        : undefined;

    const selectedProductStock = Math.max(0, Number(selectedProductForInput?.stock_quantity ?? 0));

    const soldQtyInCartForSelectedProduct = tempProdId
        ? cart
            .filter(item => item.product_id === Number(tempProdId) && (item.action_type === 'terjual' || item.action_type === 'sold'))
            .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        : 0;

    const remainingStockForSelectedProduct = Math.max(0, selectedProductStock - soldQtyInCartForSelectedProduct);

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleSelectCustomer = (cust: Customer) => {
        setSelectedCustomerId(cust.id);

        setTempContactData({
            name: cust.name || '',
            notes: cust.notes || '',
            phone: cust.phone || '',
        });
        setShowContactModal(true);
    };

    const handleSaveContactUpdate = () => {
        const { name, notes, phone } = tempContactData;

        if (!name.trim()) {
            showAlert(
                'Nama Pelanggan Wajib Diisi',
                'Silakan isi nama pelanggan / toko terlebih dahulu.',
                'error'
            );
            return;
        }

        if (phone) {
            const phoneRegex = /^628\d{8,11}$/;

            if (!phoneRegex.test(phone)) {
                showAlert(
                    'Nomor Telepon Tidak Valid',
                    'Nomor telepon harus diawali dengan "628" dan memiliki panjang 11-14 digit.',
                    'error'
                );
                return;
            }
        }

        router.patch(`/sales/customers/${selectedCustomerId}/update-contact`, {
            name: name.trim(),
            notes: notes.trim() || null,
            phone: phone,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNearbyCustomers(prev => prev.map(cust =>
                    cust.id === selectedCustomerId
                        ? { ...cust, name: name.trim(), notes: notes.trim(), phone: phone }
                        : cust
                ));

                setShowContactModal(false);
            },
            onError: () => {
                showAlert(
                    'Gagal Menyimpan Data',
                    'Terjadi kesalahan saat menyimpan data kontak. Pastikan koneksi internet stabil dan coba lagi.',
                    'error'
                );
            }
        });
    };

    const handleVisitTypeChange = (nextVisitType: string) => {
        const isLocked = visitType === 'kunjungan' || visitType === 'pengiriman';

        if (isLocked && nextVisitType !== visitType) {
            showAlert(
                'Kategori Sudah Terkunci',
                `Anda sudah memilih kategori ${visitType}. Tutup form lalu buat laporan baru jika ingin ganti kategori.`,
                'warning'
            );
            return;
        }

        setVisitType(nextVisitType);
    };

    const resetFormState = () => {
        setDescription('');
        setPhoto(null);
        setVisitType('visit');
        setCart([]);
        setTempProdId('');
        setTempQty(1);
        setSearchQuery('');
        setShowResults(false);
    };

    const submitVisitReport = async () => {
        const isKunjungan = visitType === 'kunjungan';
        const isPengiriman = visitType === 'pengiriman';

        if (!isKunjungan && !isPengiriman) {
            showAlert(
                'Jenis Aktivitas Wajib Dipilih',
                'Silakan pilih kategori aktivitas terlebih dahulu.',
                'error'
            );
            return;
        }

        if (!description.trim()) {
            showAlert(
                'Catatan Kunjungan Wajib Diisi',
                'Silakan isi catatan kunjungan terlebih dahulu.',
                'error'
            );
            return;
        }

        if (!photo) {
            showAlert(
                'Foto Wajib Diunggah',
                'Silakan unggah foto bukti kehadiran terlebih dahulu.',
                'error'
            );
            return;
        }

        if (isPengiriman && cart.length === 0) {
            showAlert(
                'Produk Wajib Diisi',
                'Untuk kategori pengiriman, tambahkan minimal 1 produk terlebih dahulu.',
                'error'
            );
            return;
        }

        setProcessing(true);
        const pos = await getVerifiedLocation();

        if (!pos) {
            setProcessing(false);
            return;
        }

        const { latitude, longitude } = pos.coords;
        try {
            const geo = await fetch('/sales/utils/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            const { address } = await geo.json();

            if (manualCustomerPhone) {
                const phoneRegex = /^628\d{8,11}$/;

                if (!phoneRegex.test(manualCustomerPhone)) {
                    showAlert(
                        'Nomor Telepon Tidak Valid',
                        'Nomor telepon harus diawali dengan "628" dan memiliki panjang 11-14 digit.',
                        'error'
                    );
                    setProcessing(false);
                    return;
                }
            }

            router.post('/sales/visits', {
                activity_type: visitType,
                description,
                lat: latitude,
                lng: longitude,
                photo,
                address: address ?? 'Lokasi tidak ditemukan',
                products: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    action_type: item.action_type,
                    price: item.unit_price || 0,
                    value: (isNegativeAction(item.action_type) ? -1 : 1) * (item.unit_price || 0) * item.quantity,
                })),
                customer_mode: customerMode,
                customer_id: selectedCustomerId,
                customer_name: manualCustomerName,
                customer_note: manualCustomerNote,
                customer_phone: manualCustomerPhone,
            }, {
                forceFormData: true,
                onSuccess: () => {
                    resetFormState();
                    onClose();
                },
                onFinish: () => setProcessing(false),
            });
        } catch {
            setProcessing(false);
            showAlert(
                'Gagal Mengambil Lokasi',
                'Terjadi kesalahan saat mengambil data lokasi. Pastikan koneksi internet stabil dan coba lagi.',
                'error'
            );
        }

    };

    return (
        <>
            <VisitInputModal
                isOpen={isOpen}
                onClose={onClose}
                isLoadingCustomers={isLoadingCustomers}
                customerMode={customerMode}
                setCustomerMode={setCustomerMode}
                nearbyCustomers={nearbyCustomers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={handleSelectCustomer}
                showContactModal={showContactModal}
                tempContactData={tempContactData}
                setTempContactData={setTempContactData}
                onCloseContactModal={() => setShowContactModal(false)}
                onSaveContactUpdate={handleSaveContactUpdate}
                manualCustomerName={manualCustomerName}
                setManualCustomerName={setManualCustomerName}
                manualCustomerNote={manualCustomerNote}
                setManualCustomerNote={setManualCustomerNote}
                manualCustomerPhone={manualCustomerPhone}
                setManualCustomerPhone={setManualCustomerPhone}
                visitType={visitType}
                setVisitType={handleVisitTypeChange}
                description={description}
                setDescription={setDescription}
                photo={photo}
                photoPreview={photoPreview}
                isCameraOpen={isCameraOpen}
                isStartingCamera={isStartingCamera}
                cameraError={cameraError}
                videoRef={videoRef}
                onStartCamera={() => {
                    void startCamera();
                }}
                onCloseCamera={stopCamera}
                onCaptureFromCamera={handleCaptureFromCamera}
                products={products}
                tempProdId={tempProdId}
                setTempProdId={setTempProdId}
                tempQty={tempQty}
                setTempQty={setTempQty}
                tempAction={tempAction}
                setTempAction={setTempAction}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showResults={showResults}
                setShowResults={setShowResults}
                addToCart={addToCart}
                cart={cart}
                removeFromCart={removeFromCart}
                processing={processing}
                isCompressing={isCompressing}
                onSubmit={submitVisitReport}
                onPreviewImage={onPreviewImage}
                selectedProductStock={selectedProductStock}
                remainingStockForSelectedProduct={remainingStockForSelectedProduct}
                showAlert={showAlert}
            />

            <AlertModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onPrimaryClick={alertConfig.onConfirm}
                primaryButtonText={alertConfig.type === 'error' ? 'Tutup' : 'OK Mengerti'}
                disableBackdropClick={alertConfig.isFatal}
            />
        </>
    );
}
