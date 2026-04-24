import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Product, CartItem, Member, CashierShift, CartPreview, Transaction } from '@/types/pos';

export function usePOS(currentShift: CashierShift | null) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [member, setMember] = useState<Member | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [productQuery, setProductQuery] = useState('');
    const [memberQuery, setMemberQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [cartPreview, setCartPreview] = useState<CartPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [cashReceived, setCashReceived] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState('');
    const [shift, setShift] = useState<CashierShift | null>(currentShift);
    const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
    const [isAddingMore, setIsAddingMore] = useState(false);
    const [waAutoSent, setWaAutoSent] = useState(false);

    const isFirstProductRender = useRef(true);
    const isFirstMemberRender = useRef(true);
    const productsRef = useRef<Product[]>([]);

    useEffect(() => { productsRef.current = products; }, [products]);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async (q: string) => {
        setIsLoadingProducts(true);
        try {
            const res = await axios.get('/pos/products/search', { params: { query: q } });
            setProducts(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal mencari produk');
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const fetchMembers = useCallback(async (q: string) => {
        setIsLoadingMembers(true);
        try {
            const res = await axios.get('/settings/membership/members/search', { params: { query: q } });
            setMembers(res.data);
        } catch {
            // silent
        } finally {
            setIsLoadingMembers(false);
        }
    }, []);

    // ── Debounced search ───────────────────────────────────────────────────
    useEffect(() => {
        if (isFirstProductRender.current) { isFirstProductRender.current = false; return; }
        const t = setTimeout(() => fetchProducts(productQuery), productQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [productQuery, fetchProducts]);

    useEffect(() => {
        if (isFirstMemberRender.current) { isFirstMemberRender.current = false; return; }
        const t = setTimeout(() => fetchMembers(memberQuery), memberQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [memberQuery, fetchMembers]);

    // ── Cart preview ───────────────────────────────────────────────────────
    useEffect(() => {
        if (cart.length === 0) { setCartPreview(null); return; }
        const t = setTimeout(async () => {
            setIsLoadingPreview(true);
            try {
                const res = await axios.post('/pos/cart/preview', {
                    cart_items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
                    member_id: member?.id || null,
                });
                setCartPreview(res.data);
            } catch { /* silent */ } finally { setIsLoadingPreview(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [cart, member]);

    // ── Cart actions ───────────────────────────────────────────────────────
    const addToCart = useCallback((product: Product) => {
        setError('');
        setCart(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.available_stock) {
                    setError(`Stok habis. Tersedia: ${product.available_stock}`);
                    return prev;
                }
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                product_id: product.id,
                product_name: product.name,
                quantity: 1,
                unit_price: product.price,
                available_stock: product.available_stock,
                image: product.image,
            }];
        });
    }, []);

    const updateQty = useCallback((productId: number, qty: number) => {
        if (qty <= 0) { setCart(prev => prev.filter(i => i.product_id !== productId)); return; }
        setCart(prev => {
            const item = prev.find(i => i.product_id === productId);
            if (!item) return prev;
            if (qty > item.available_stock) { setError(`Stok tidak cukup. Tersedia: ${item.available_stock}`); return prev; }
            setError('');
            return prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i);
        });
    }, []);

    const removeItem = useCallback((productId: number) => {
        setCart(prev => prev.filter(i => i.product_id !== productId));
    }, []);

    const clearCart = useCallback(() => {
        if (!confirm('Kosongkan keranjang?')) return;
        setCart([]); setMember(null); setCashReceived(''); setCartPreview(null); setIsAddingMore(false);
    }, []);

    // ── Barcode ────────────────────────────────────────────────────────────
    const handleBarcodeDetected = useCallback((code: string): boolean => {
        const normalized = code.trim().toUpperCase();
        const list = productsRef.current;
        const match = list.find(p =>
            p.sku.toUpperCase() === normalized ||
            p.sku.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized.replace(/[^A-Z0-9]/g, '')
        ) ?? list.find(p => p.name.toUpperCase() === normalized);

        if (match) { addToCart(match); return true; }

        setProductQuery(code.trim());
        fetchProducts(code.trim());
        return false;
    }, [addToCart, fetchProducts]);

    // ── Rehydrate cart dari transaksi sebelumnya (untuk tambah produk) ────────
    const rehydrateFromTransaction = useCallback(async (tx: Transaction) => {
        // Fetch stok aktual untuk semua produk di transaksi
        let stockMap: Record<number, number> = {};
        try {
            const ids = tx.items.map(i => i.product_id).filter(Boolean);
            if (ids.length > 0) {
                const res = await axios.get('/pos/products/search', {
                    params: { query: '', ids: ids.join(',') },
                });
                (res.data as Product[]).forEach((p: Product) => {
                    stockMap[p.id] = p.available_stock;
                });
            }
        } catch { /* pakai fallback */ }

        setCart(tx.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            available_stock: stockMap[item.product_id] ?? item.quantity, // fallback ke qty saat ini
            image: item.product?.image ?? item.product?.file_path,
        })));

        if (tx.member) {
            setMember({
                id: tx.member.id,
                name: tx.member.name,
                member_number: tx.member.member_number,
                phone: tx.member.phone,
                membership_tier: tx.member.membership_tier,
            });
        }
        setCashReceived('');
        setCompletedTransaction(null);
        setIsAddingMore(true);
    }, []);

    // ── Checkout ───────────────────────────────────────────────────────────
    const handleCheckout = useCallback(async () => {
        if (!shift) { setError('Buka shift terlebih dahulu'); return; }
        if (cart.length === 0) { setError('Keranjang kosong'); return; }
        if (isLoadingPreview) { setError('Menghitung total, tunggu sebentar...'); return; }
        const cash = parseFloat(cashReceived);
        const total = cartPreview?.grand_total ?? 0;
        if (total === 0) { setError('Total belum terhitung, tunggu sebentar...'); return; }
        if (isNaN(cash) || cash < total) {
            setError('Uang diterima kurang dari total'); return;
        }
        setIsCheckingOut(true); setError('');
        try {
            const res = await axios.post('/pos/transactions/checkout', {
                cart_items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
                member_id: member?.id || null,
                cash_received: cash,
            });
            setCompletedTransaction(res.data.transaction);
            setWaAutoSent(res.data.wa_auto_sent ?? false);
            setCart([]); setMember(null); setCashReceived(''); setCartPreview(null); setIsAddingMore(false);
        } catch (err: any) {
            const data = err.response?.data;
            // Laravel validation errors → ambil pesan pertama
            if (data?.errors) {
                const first = Object.values(data.errors as Record<string, string[]>)[0];
                setError(Array.isArray(first) ? first[0] : String(first));
            } else {
                setError(data?.error || data?.message || 'Gagal checkout');
            }
        } finally { setIsCheckingOut(false); }
    }, [shift, cart, cashReceived, cartPreview, member]);

    // ── Derived ────────────────────────────────────────────────────────────
    const grandTotal = cartPreview?.grand_total ?? 0;
    const cashAmount = parseFloat(cashReceived) || 0;
    const change = cashAmount - grandTotal;
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    return {
        // state
        cart, member, setMember,
        products, members,
        productQuery, setProductQuery,
        memberQuery, setMemberQuery,
        isLoadingProducts, isLoadingMembers,
        cartPreview, isLoadingPreview,
        cashReceived, setCashReceived,
        isCheckingOut, error, setError,
        shift, setShift,
        completedTransaction, setCompletedTransaction,
        isAddingMore, waAutoSent,
        // actions
        fetchProducts, fetchMembers,
        addToCart, updateQty, removeItem, clearCart,
        handleBarcodeDetected, handleCheckout, rehydrateFromTransaction,
        // derived
        grandTotal, cashAmount, change, totalItems,
    };
}
