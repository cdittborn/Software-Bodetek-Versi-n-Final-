import { toast } from "sonner";

export function notifyUploadSuccess(fileName?: string | null) {
  const label = fileName?.trim();
  toast.success(label ? `${label} subido` : "Archivo subido", {
    duration: 2500,
  });
}
