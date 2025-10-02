import useDialogState from '@/hooks/use-dialog-state';
import { Role } from '@/pages/roles/data/schema';
import React, { useMemo, useState } from 'react';

type RolesDialogType = 'create' | 'edit' | 'delete';

interface RolesContextType {
    open: RolesDialogType | null;
    setOpen: (open: RolesDialogType | null) => void;
    currentRow: Role | null;
    setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>;
    shouldReload: boolean;
    setShouldReload: React.Dispatch<React.SetStateAction<boolean>>;
}

const RolesContext = React.createContext<RolesContextType | null>(null);

interface Props {
    children: React.ReactNode;
}

export default function RolesProvider({ children }: Props) {
    const [open, setOpen] = useDialogState<RolesDialogType>(null);
    const [currentRow, setCurrentRow] = useState<Role | null>(null);
    const [shouldReload, setShouldReload] = useState(false);
    const value = useMemo(
        () => ({
            open,
            setOpen,
            currentRow,
            setCurrentRow,
            shouldReload,
            setShouldReload,
        }),
        [open, currentRow, shouldReload],
    );
    return (
        <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoles = () => {
    const context = React.useContext(RolesContext);
    if (!context) {
        throw new Error('useRoles must be used within a RolesProvider');
    }
    return context;
};
