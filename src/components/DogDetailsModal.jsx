import { X, Pencil } from "lucide-react";
import Button from "./ui/Button";
import LocationPicker from "./LocationPicker";
import { useTranslation } from "react-i18next";
function Field({ label, value }) {
  
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 min-h-[52px] flex items-center">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "-"}
      </div>
    </div>
  );
}



export default function DogDetailsModal({
  dog,
  open,
  onClose,
  onEdit,
}) {
  if (!open || !dog) return null;

  const { t, i18n } = useTranslation();
  return (
    <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">
              {t("dogDetails")}
            </h2>

            <p className="text-gray-500">
              {t("completeDogInfo")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[80vh] p-6 space-y-8">

          {/* Capture Information */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("captureinfo")}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("dogId")} value={dog.dog_id} />
              <Field label={t("capturedate")} value={dog.capture_date} />

              <Field
                label={t("captureLocation")}
                value={dog.capture_location}
              />

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("captureLocationMap")}
              </label>

              <LocationPicker
                latitude={dog.capture_lat}
                longitude={dog.capture_lng}
                readOnly={true}
              />
            </div>
            </div>
          </section>

          {/* Physical Information */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("physicalInfo")}
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label={t("sex")} value={dog.sex} />

              <Field
                label={t("estimatedAge")}
                value={dog.estimated_age}
              />

              <Field
                label={t("weight")}
                value={`${dog.weight || 0} kg`}
              />

              <Field
                label={t("coatColor")}
                value={dog.coat_color}
              />

              <Field
                label={t("identifingMark")}
                value={dog.identifying_marks}
              />
            </div>
          </section>

          {/* Health Information */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("healthInfo")}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label={t("dogHealthy")}
                value={
                  dog.healthy ? (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      {t("dogHealthy")}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                      {t("dogSick")}
                    </span>
                  )
                }
              />

              <Field
                label={t("healthNotes")}
                value={dog.health_notes}
              />

              <Field
                label={t("vaccinationDetails")}
                value={dog.vaccination_details}
              />

              <Field
                label={t("surgeryDetails")}
                value={dog.surgery_details}
              />
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("behaviorInfo")}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label={t("behavior")}
                value={
                  Array.isArray(dog.behavior)
                    ? dog.behavior.join(", ")
                    : dog.behavior
                }
              />

              <Field
                label={t("reproductiveStatuus")}
                value={dog.reproductive_status}
              />

              <Field
                label={t("reproductiveSurgeryDate")}
                value={dog.reproductive_surgery_date}
              />
            </div>
          </section>

          {/* Release Information */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("releaseInfo")}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label={t("releasedDate")}
                value={dog.release_date}
              />

              <Field
                label={t("releasedLocation")}
                value={dog.release_location}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("releasedLocationMap")}
                </label>

                <LocationPicker
                  latitude={dog.release_lat}
                  longitude={dog.release_lng}
                  readOnly={true}
                />
              </div>
            </div>
          </section>

          {/* Outcome Information */}
          <section>
            <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
              {t("outcomeInfo")}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label={t("outcome")}
                value={dog.outcome}
              />

              <Field
                label={t("createdAt")}
                value={
                  dog.created_at
                    ? new Date(
                        dog.created_at
                      ).toLocaleString()
                    : "-"
                }
              />

              <Field
                label={t("updatedAt")}
                value={
                  dog.updated_at
                    ? new Date(
                        dog.updated_at
                      ).toLocaleString()
                    : "-"
                }
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {t("close")}
          </Button>

          <Button onClick={() => onEdit?.(dog)}>
            <Pencil size={16} />
            {t("editDog")}
          </Button>
        </div>
      </div>
    </div>
  );
}