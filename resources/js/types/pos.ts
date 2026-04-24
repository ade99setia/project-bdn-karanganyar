export interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    available_stock: number;
    image?: string;
}

export interface CartItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    subtotal?: number;
    available_stock: number;
    image?: string;
}

export interface Member {
    id: number;
    name: string;
    member_number: string;
    phone?: string;
    membershipTier?: { name: string; default_discount_percentage: number };
    membership_tier?: { name: string; default_discount_percentage: number };
}

export interface CashierShift {
    id: number;
    status: string;
    opened_at: string;
    opening_balance: number;
}

export interface CartPreview {
    subtotal: number;
    total_discount: number;
    grand_total: number;
    items: Array<{
        discount_percentage: number;
        discount_amount: number;
        subtotal: number;
    }>;
}

export interface TransactionItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    discount_amount: number;
    subtotal: number;
    product?: { id: number; name: string; image?: string; file_path?: string };
}

export interface Transaction {
    id: number;
    transaction_number: string;
    subtotal: number;
    total_discount: number;
    grand_total: number;
    cash_received: number;
    cash_change: number;
    payment_method: string;
    status: string;
    created_at: string;
    items: TransactionItem[];
    member?: {
        id: number;
        name: string;
        member_number: string;
        phone?: string;
        membership_tier?: { name: string; default_discount_percentage: number };
    };
    cashier?: { name: string };
    warehouse?: { name: string; address?: string; phone?: string; receipt_header?: string; receipt_footer?: string; file_path?: string };
}

export function getMemberTier(m: Member) {
    return m.membershipTier ?? m.membership_tier;
}
