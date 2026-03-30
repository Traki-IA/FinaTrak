import { toast as sonnerToast } from "sonner";

const DURATION = 2000;

function success(message: string) {
  const id = sonnerToast.success(message);
  setTimeout(() => sonnerToast.dismiss(id), DURATION);
}

function error(message: string) {
  const id = sonnerToast.error(message);
  setTimeout(() => sonnerToast.dismiss(id), DURATION);
}

export const toast = { success, error };
