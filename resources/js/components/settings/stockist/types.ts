export interface Warehouse {
    id: number;
    name: string;
    code: string;
    file_path?: string | null;
    is_active: boolean;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    category?: string | null;
    file_path?: string | null;
}

export interface SalesUser {
    id: number;
    name: string;
    warehouse_id: number | null;
    phone?: string | null;
    avatar?: string | null;
}

export interface SalesStockSummaryRow {
    id: number;
    quantity: number;
    user: {
        id: number | null;
        name: string | null;
        avatar?: string | null;
    };
    warehouse: {
        id: number | null;
        name: string | null;
        code: string | null;
        file_path?: string | null;
    };
    product: {
        id: number | null;
        name: string | null;
        sku: string | null;
        category?: string | null;
        file_path?: string | null;
    };
}

export interface ProductStockRow {
    id: number;
    quantity: number;
    product: Product;
    warehouse: Warehouse;
}

export interface SalesVisitRef {
    id: number;
    activity_type: string;
    visited_at: string;
}

export interface StockMovementRow {
    id: number;
    type: 'in' | 'out';
    quantity: number;
    reference?: string | null;
    note?: string | null;
    created_at: string;
    product: Pick<Product, 'id' | 'name' | 'sku'>;
    warehouse: Warehouse;
    sales_visit?: SalesVisitRef | null;
    user?: {
        id: number;
        name: string;
        phone?: string | null;
    } | null;
    created_by?: {
        id: number;
        name: string;
        phone?: string | null;
    } | null;
}

export interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PageProps {
    stocks: Pagination<ProductStockRow>;
    movements: StockMovementRow[];
    products: Product[];
    salesStockSummaries: SalesStockSummaryRow[];
    salesUsers: SalesUser[];
    warehouses: Warehouse[];
    filters: {
        warehouse_id?: number;
        search?: string;
        per_page?: number;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

export interface StockAdjustForm {
    product_id: string;
    warehouse_id: string;
    user_id: string;
    type: 'in' | 'out';
    quantity: string;
    reference: string;
    note: string;
}

export interface StockAdjustLine {
    user_id: number;
    quantity: number;
    reference?: string | null;
    note?: string | null;
}
