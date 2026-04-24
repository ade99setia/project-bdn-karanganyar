import { Search, ShoppingCart, Banknote } from 'lucide-react';

type Tab = 'products' | 'cart' | 'checkout';

interface Props {
    activeTab: Tab;
    totalItems: number;
    onTabChange: (tab: Tab) => void;
}

export default function MobileTabBar({ activeTab, totalItems, onTabChange }: Props) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex">
            <TabButton label="Produk" tab="products" active={activeTab === 'products'} onTabChange={onTabChange}>
                <Search size={18} />
            </TabButton>
            <TabButton label="Keranjang" tab="cart" active={activeTab === 'cart'} onTabChange={onTabChange}>
                <ShoppingCart size={18} />
                {totalItems > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-18px)] bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {totalItems}
                    </span>
                )}
            </TabButton>
            <TabButton label="Bayar" tab="checkout" active={activeTab === 'checkout'} onTabChange={onTabChange}>
                <Banknote size={18} />
            </TabButton>
        </div>
    );
}

interface TabButtonProps {
    label: string;
    tab: Tab;
    active: boolean;
    children: React.ReactNode;
    onTabChange: (tab: Tab) => void;
}

function TabButton({ label, tab, active, children, onTabChange }: TabButtonProps) {
    return (
        <button
            onClick={() => onTabChange(tab)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors relative ${active ? 'text-indigo-600' : 'text-gray-400'}`}
        >
            {children}
            <span>{label}</span>
        </button>
    );
}
