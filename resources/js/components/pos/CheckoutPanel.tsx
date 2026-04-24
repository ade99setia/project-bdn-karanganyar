import { useState, useRef, useEffect } from 'react';
import { User, Banknote, ShoppingCart, Loader2, XCircle, Eye, EyeOff, Plus, ArrowLeft } from 'lucide-react';
import ShiftManager from '@/components/pos/ShiftManager';
import type { Member, CashierShift, CartPreview, CartItem } from '@/types/pos';
import { getMemberTier } from '@/types/pos';

interface Props {
    cart: CartItem[];
    cartPreview: CartPreview | null;
    member: Member | null;
    members: Member[];
    memberQuery: string;
    isLoadingMembers: boolean;
    shift: CashierShift | null;
    cashReceived: string;
    isCheckingOut: boolean;
    grandTotal: number;
    cashAmount: number;
    change: number;
    totalItems: number;
    isVisible: boolean;
    onSetMember: (m: Member | null) => void;
    onMemberQueryChange: (q: string) => void;
    onFetchMembers: (q: string) => void;
    onSetCashReceived: (v: string) => void;
    onCheckout: () => void;
    onShiftChange: (shift: CashierShift | null) => void;
    isAddingMore?: boolean;
}

export default function CheckoutPanel({
    cart, cartPreview, member, members, memberQuery, isLoadingMembers,
    shift, cashReceived, isCheckingOut, grandTotal, cashAmount, change, totalItems,
    isVisible, onSetMember, onMemberQueryChange, onFetchMembers,
    onSetCashReceived, onCheckout, onShiftChange, isAddingMore,
}: Props) {
    const [shiftInfoVisible, setShiftInfoVisible] = useState(false);
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const memberRef = useRef<HTMLDivElement>(null);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
                setShowMemberDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className={`shrink-0 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto
            w-full md:w-72 xl:w-80
            ${!isVisible ? 'hidden md:flex' : 'flex'}
            pb-14 md:pb-0
        `}>
            {/* Shift */}
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                {shiftInfoVisible ? (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Info Shift</p>
                            <button onClick={() => setShiftInfoVisible(false)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                <EyeOff size={12} /> Sembunyikan
                            </button>
                        </div>
                        <ShiftManager currentShift={shift} onShiftChange={onShiftChange} />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${shift ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {shift ? 'Shift sedang berjalan' : 'Shift belum dibuka'}
                            </p>
                        </div>
                        <button onClick={() => setShiftInfoVisible(true)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                            <Eye size={12} /> Tampilkan
                        </button>
                    </div>
                )}
            </div>

            {shift && (
                <>
                    {/* Member */}
                    <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <User size={11} /> Member
                        </p>
                        <div className="relative" ref={memberRef}>
                            {member ? (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                        <User size={13} className="text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.member_number} • {getMemberTier(member)?.name ?? '—'}</p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md shrink-0">
                                        -{getMemberTier(member)?.default_discount_percentage ?? 0}%
                                    </span>
                                    <button onClick={() => { onSetMember(null); onMemberQueryChange(''); }} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                        <User size={13} className="text-gray-400 shrink-0" />
                                        <input
                                            type="text"
                                            value={memberQuery}
                                            onChange={e => { onMemberQueryChange(e.target.value); setShowMemberDropdown(true); }}
                                            onFocus={() => { setShowMemberDropdown(true); if (members.length === 0) onFetchMembers(''); }}
                                            placeholder="Cari member (opsional)..."
                                            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                        {isLoadingMembers && <Loader2 size={12} className="animate-spin text-gray-400" />}
                                    </div>
                                    {showMemberDropdown && members.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {members.map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => { onSetMember(m); onMemberQueryChange(''); setShowMemberDropdown(false); }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left border-b border-gray-100 dark:border-zinc-800 last:border-0"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                        <User size={12} className="text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{m.member_number} • {m.phone}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-indigo-600 shrink-0">{getMemberTier(m)?.name ?? '—'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ringkasan</p>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal ({totalItems} item)</span>
                            <span>Rp {(cartPreview?.subtotal ?? cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)).toLocaleString('id-ID')}</span>
                        </div>
                        {(cartPreview?.total_discount ?? 0) > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Diskon Member</span>
                                <span>-Rp {cartPreview!.total_discount.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-100 dark:border-zinc-800">
                            <span>Total</span>
                            <span className="text-indigo-600 dark:text-indigo-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Cash input */}
                    <CashInput
                        grandTotal={grandTotal}
                        cashReceived={cashReceived}
                        cashAmount={cashAmount}
                        change={change}
                        onSetCashReceived={onSetCashReceived}
                    />

                    {/* Checkout button */}
                    <div className="p-3 mt-auto">
                        {showCheckoutConfirm ? (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <Plus size={12} /> Masih ada tambahan produk?
                                </p>
                                <p className="text-[11px] text-amber-600 dark:text-amber-500">
                                    Pastikan semua produk sudah masuk keranjang sebelum proses transaksi.
                                </p>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setShowCheckoutConfirm(false)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                    >
                                        <ArrowLeft size={12} /> Tambah Dulu
                                    </button>
                                    <button
                                        onClick={() => { setShowCheckoutConfirm(false); onCheckout(); }}
                                        disabled={isCheckingOut}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors disabled:opacity-50"
                                    >
                                        {isCheckingOut
                                            ? <Loader2 size={12} className="animate-spin" />
                                            : <><ShoppingCart size={12} /> Proses</>
                                        }
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => isAddingMore ? setShowCheckoutConfirm(true) : onCheckout()}
                                disabled={cart.length === 0 || isCheckingOut || !cashReceived || change < 0}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
                            >
                                {isCheckingOut
                                    ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                                    : <><ShoppingCart size={16} /> Proses Transaksi</>
                                }
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Sub-component: cash input + quick amounts ──────────────────────────────
interface CashInputProps {
    grandTotal: number;
    cashReceived: string;
    cashAmount: number;
    change: number;
    onSetCashReceived: (v: string) => void;
}

function CashInput({ grandTotal, cashReceived, cashAmount, change, onSetCashReceived }: CashInputProps) {
    const quickAmounts = buildQuickAmounts(grandTotal);

    const fmt = (v: number) => {
        if (v >= 1000000) {
            const jt = Math.floor(v / 1000000);
            const sisa = Math.round((v % 1000000) / 1000);
            return sisa > 0 ? `${jt}jt${sisa}rb` : `${jt}jt`;
        }
        if (v >= 1000) return `${+(v / 1000).toFixed(1).replace(/\.0$/, '')}rb`;
        return v.toLocaleString('id-ID');
    };

    return (
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Banknote size={11} /> Pembayaran Tunai
            </p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <span className="text-xs font-bold text-gray-400 shrink-0">Rp</span>
                <input
                    type="number"
                    value={cashReceived}
                    onChange={e => onSetCashReceived(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent text-sm font-bold outline-none text-gray-900 dark:text-white"
                />
                {cashReceived && (
                    <button onClick={() => onSetCashReceived('')} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={13} />
                    </button>
                )}
            </div>

            {/* Quick amounts */}
            {grandTotal > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                    {quickAmounts.map(amount => (
                        <button
                            key={amount}
                            onClick={() => onSetCashReceived(String(amount))}
                            className={`text-xs py-1.5 rounded-lg font-semibold transition-all border ${cashReceived === String(amount) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-600'}`}
                        >
                            {fmt(amount)}
                        </button>
                    ))}
                </div>
            )}

            {/* Change display + reduce buttons */}
            {cashAmount > 0 && grandTotal > 0 && (
                <div className="space-y-1.5">
                    <div className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-bold ${change >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                        <span>{change >= 0 ? 'UANG KEMBALIAN' : 'UANG KURANG'}</span>
                        <span>Rp {Math.abs(change).toLocaleString('id-ID')}</span>
                    </div>
                    {change > 0 && (() => {
                        const pecahan = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
                        const reductions = pecahan.filter(p => p < cashAmount && cashAmount - p >= grandTotal);
                        if (reductions.length === 0) return null;
                        const fmtR = (v: number) => v >= 1000000 ? `${v / 1000000}jt` : `-${v / 1000}rb`;
                        return (
                            <div className="flex gap-1.5 flex-wrap">
                                {reductions.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => onSetCashReceived(String(cashAmount - p))}
                                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:border-rose-400 hover:text-rose-600 font-semibold transition-all"
                                    >
                                        {fmtR(p)}
                                    </button>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

function buildQuickAmounts(grandTotal: number): number[] {
    const seen = new Set<number>();
    const result: number[] = [];

    seen.add(grandTotal);
    result.push(grandTotal);

    const bills = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
    const candidates: number[] = [];
    for (const bill of bills) {
        const rounded = Math.ceil(grandTotal / bill) * bill;
        if (rounded > grandTotal && !seen.has(rounded)) {
            candidates.push(rounded);
            seen.add(rounded);
        }
    }
    candidates.sort((a, b) => a - b);
    for (const c of candidates) {
        if (result.length >= 6) break;
        result.push(c);
    }

    const fillStep = grandTotal >= 1000000 ? 500000 : grandTotal >= 200000 ? 100000 : 50000;
    let fill = Math.ceil((result[result.length - 1] + 1) / fillStep) * fillStep;
    while (result.length < 6) {
        if (!seen.has(fill)) result.push(fill);
        fill += fillStep;
    }

    return result.slice(0, 6);
}
