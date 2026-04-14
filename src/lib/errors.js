import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/axios';

export function showApiError(error) {
  const message = extractErrorMessage(error);
  toast.error(message);
}

export function showSuccess(message) {
  toast.success(message);
}
