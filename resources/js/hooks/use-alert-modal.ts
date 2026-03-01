import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertConfig {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    type: AlertType;
}

export function useAlertModal(initialType: AlertType = 'info') {
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        isOpen: false,
        title: '',
        message: '',
        type: initialType,
    });

    const showAlert = useCallback((title: string, message: ReactNode, type: AlertType = initialType) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
        });
    }, [initialType]);

    const closeAlert = useCallback(() => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        alertConfig,
        setAlertConfig,
        showAlert,
        closeAlert,
    };
}
