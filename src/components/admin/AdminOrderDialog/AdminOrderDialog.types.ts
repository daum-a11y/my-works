export interface AdminOrderDialogItem {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  inactive?: boolean;
}

export interface AdminOrderDialogProps {
  title: string;
  description?: string;
  items: AdminOrderDialogItem[];
  isOpen: boolean;
  isSaving: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSave: (ids: string[]) => Promise<void> | void;
}
