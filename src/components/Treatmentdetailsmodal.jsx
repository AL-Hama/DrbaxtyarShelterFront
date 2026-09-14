import { useTranslation } from "react-i18next";
import Modal from "./ui/Modal";

export default function TreatmentDetailsModal({
  open,
  onClose,
  treatment,
}) {
  const { t, i18n } = useTranslation();

  const dir = ["ar", "ku"].includes(i18n.language) ? "rtl" : "ltr";

  if (!treatment) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("treatmentDetails")}
      className="max-w-2xl"
    >
      <div dir={dir} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t("dogs")}</p>
            <p className="font-semibold">{treatment.dog_code}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              {t("treatmentType")}
            </p>
            <p className="font-semibold">
              {treatment.treatment_type}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              {t("veterinarian")}
            </p>
            <p className="font-semibold">
              {treatment.veterinarian_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("dates")}</p>
            <p className="font-semibold">
              {new Date(
                treatment.treatment_date
              ).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("status")}</p>

            <span
              className={`inline-flex mt-1 rounded-full px-3 py-1 text-xs font-semibold ${
                treatment.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {treatment.status === "completed"
                ? t("completed")
                : t("ongoing")}
            </span>
          </div>
        </div>

        {treatment.notes && (
          <div>
            <p className="text-sm text-gray-500">{t("note")}</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-3 text-gray-700">
              {treatment.notes}
            </p>
          </div>
        )}

        <div>
          <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
            {t("itemsUsed")}
          </h3>

          {(!treatment.items || treatment.items.length === 0) && (
            <p className="text-sm text-gray-400">
              {t("noItemsAddedYet")}
            </p>
          )}

          <div className="space-y-2">
            {treatment.items?.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/30 p-3"
              >
                <span className="font-medium">
                  {item.inventory_name}
                </span>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {item.quantity_used} {t("used")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}