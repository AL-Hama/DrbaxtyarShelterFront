import Button from "./ui/Button";
import { useTranslation } from "react-i18next";
export default function DeleteConfirmModal({
  open,
  title = "Delete Item",
  message = "Are you sure you want to delete this item?",
  onCancel,
  onConfirm,
  loading = false,
}) {
  if (!open) return null;
const { t, i18n } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>

        <p className="mt-2 text-gray-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t("cancel")}
          </Button>

          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : t("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}