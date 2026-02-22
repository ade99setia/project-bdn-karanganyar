import { router } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import VisitInputModal from '@/components/modal/visit-input-modal';

interface Customer {
    id: number;
    name: string;
    address: string;
    distance?: number;
    phone?: string;
    email?: string;
    notes?: string;
}

interface Product {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
    category?: string;
}

interface CartItem {
    product_id: number;
    quantity: number;
    action_type: string;
    product_name?: string;
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
}

export default function VisitInputModalContainer({
    isOpen,
    onClose,
    products,
    getVerifiedLocation,
    onPreviewImage,
}: VisitInputModalContainerProps) {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: () => { },
        isFatal: false,
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void, isFatal = false) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, isOpen: false }))),
            isFatal,
        });
    };
    const [processing, setProcessing] = useState(false);
    const [customerMode, setCustomerMode] = useState<'database' | 'manual'>('database');
    const [nearbyCustomers, setNearbyCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [manualCustomerNote, setManualCustomerNote] = useState('');
    const [manualCustomerPhone, setManualCustomerPhone] = useState('');
    const [manualCustomerEmail, setManualCustomerEmail] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [tempContactData, setTempContactData] = useState({ phone: '', email: '' });
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    const [visitType, setVisitType] = useState('visit');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [tempProdId, setTempProdId] = useState<string>('');
    const [tempQty, setTempQty] = useState<number>(0);
    const [tempAction, setTempAction] = useState<string>('sold');
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

    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsCompressing(true);
        try {
            const compressed = await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1400, fileType: 'image/webp' });
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

    const addToCart = () => {
        if (!tempProdId) return;
        const selectedProduct = products.find(p => p.id === Number(tempProdId));
        if (!selectedProduct) return;

        const existingIndex = cart.findIndex(c => c.product_id === Number(tempProdId) && c.action_type === tempAction);

        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += tempQty;
            setCart(newCart);
        } else {
            setCart([...cart, {
                product_id: Number(tempProdId),
                quantity: tempQty,
                action_type: tempAction,
                product_name: selectedProduct.name,
            }]);
        }
        setTempProdId('');
        setTempQty(1);
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleSelectCustomer = (cust: Customer) => {
        setSelectedCustomerId(cust.id);

        if (!cust.phone || !cust.email) {
            setTempContactData({
                phone: cust.phone || '',
                email: cust.email || '',
            });
            setShowContactModal(true);
        }
    };

    const handleSaveContactUpdate = () => {
        const { phone, email } = tempContactData;

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

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                showAlert(
                    'Format Email Tidak Valid',
                    'Format email tidak valid! (contoh: example@gmail.com)',
                    'error'
                );
                return;
            }
        }

        router.patch(`/sales/customers/${selectedCustomerId}/update-contact`, {
            phone: phone,
            email: email,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNearbyCustomers(prev => prev.map(cust =>
                    cust.id === selectedCustomerId
                        ? { ...cust, phone: phone, email: email }
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
        if (!photo) {
            showAlert(
                'Foto Wajib Diunggah',
                'Silakan unggah foto bukti kehadiran terlebih dahulu.',
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

            if (manualCustomerEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(manualCustomerEmail)) {
                    showAlert(
                        'Format Email Tidak Valid',
                        'Format email tidak valid! (contoh: example@gmail.com)',
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
                })),
                customer_mode: customerMode,
                customer_id: selectedCustomerId,
                customer_name: manualCustomerName,
                customer_note: manualCustomerNote,
                customer_phone: manualCustomerPhone,
                customer_email: manualCustomerEmail,
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
                manualCustomerEmail={manualCustomerEmail}
                setManualCustomerEmail={setManualCustomerEmail}
                visitType={visitType}
                setVisitType={setVisitType}
                description={description}
                setDescription={setDescription}
                onPhotoChange={handlePhotoChange}
                photo={photo}
                photoPreview={photoPreview}
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
