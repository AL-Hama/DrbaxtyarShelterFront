import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import Input from "./ui/Input";
import LocationPicker from "../components/LocationPicker";
import { useTranslation } from "react-i18next";
import {
  createDog,
  updateDog,
} from "../services/dogService";


function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

export default function DogFormModal({
  open,
  dog,
  onClose,
  onSaved,
}) {
const emptyDog = {
  dog_id: "",

  capture_date: "",
  capture_location: "",
  capture_lat: "",
  capture_lng: "",

  sex: "",
  estimated_age: "",
  weight: "",

  coat_color: "",
  identifying_marks: "",

  healthy: true,
  health_notes: "",

  vaccination_details: "",
  surgery_details: "",

  release_date: null,
  release_location: "",
  release_lat: "",
  release_lng: "",

  behavior: [],

  reproductive_status: [],
  reproductive_surgery_date: null,

  outcome: "",
};
 const { t, i18n } = useTranslation();
const [form, setForm] = useState(emptyDog);
const behaviorOptions = [
  t("friendly"),
  t("aggressive"),
  t("fearful"),
  t("humanSocialized"),
  t("dogSocialized"),
];

const toggleReproductiveStatus = (status) => {
  const exists =
    form.reproductive_status.includes(status);

  if (exists) {
    setForm({
      ...form,
      reproductive_status:
        form.reproductive_status.filter(
          (item) => item !== status
        ),
    });
  } else {
    setForm({
      ...form,
      reproductive_status: [
        ...form.reproductive_status,
        status,
      ],
    });
  }
};



const toggleBehavior = (behavior) => {
  const exists = form.behavior.includes(behavior);

  if (exists) {
    setForm({
      ...form,
      behavior: form.behavior.filter(
        (item) => item !== behavior
      ),
    });
  } else {
    setForm({
      ...form,
      behavior: [...form.behavior, behavior],
    });
  }
};


useEffect(() => {
  if (dog) {
    setForm({
      ...emptyDog,
      ...dog,
      behavior: dog.behavior || [],
    });
  } else {
    setForm(emptyDog);
  }
}, [dog]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
  const missing = [];

  if (!form.dog_id?.trim()) {
    missing.push(t("dogId"));
  }

  if (!form.capture_date) {
    missing.push(t("capturedate"));
  }

  if (!form.capture_location?.trim()) {
    missing.push(t("captureLocation"));
  }

  if (!form.sex) {
    missing.push(t("sex"));
  }

  if (!form.estimated_age) {
    missing.push(t("estimatedAge"));
  }

  if (!form.weight) {
    missing.push(t("weight"));
  }

  if (missing.length > 0) {
    toast.error(
      `${t("fillAllFields")}:\n${missing.join(", ")}`
    );
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  try {
    const payload = {
      ...form,

      estimated_age:
        form.estimated_age === ""
          ? null
          : Number(form.estimated_age),
      weight:
        form.weight === ""
          ? null
          : Number(form.weight),

      capture_lat:
        form.capture_lat === ""
          ? null
          : Number(form.capture_lat),

      capture_lng:
        form.capture_lng === ""
          ? null
          : Number(form.capture_lng),

      release_lat:
        form.release_lat === ""
          ? null
          : Number(form.release_lat),

      release_lng:
        form.release_lng === ""
          ? null
          : Number(form.release_lng),
    };

    const promise = dog
      ? updateDog(dog.id, payload)
      : createDog(payload);

    await toast.promise(promise, {
      loading: dog
        ? t("updatingDogs")
        : t("creatingDog"),

      success: dog
        ? t("dogUpdatedSucc")
        : t("dogCreatedSucc"),

      error: t("faildSaveDog"),
    });

    onSaved();
    onClose();
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div  dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">

          <h2 className="text-2xl font-bold">
            {dog ? t("editDog") : t("addDog")}
          </h2>

          <button onClick={onClose}>
            <X size={24} />
          </button>

        </div>

        {/* Body */}
<div className="flex-1 overflow-y-auto p-6 space-y-8">

  {/* Capture Information */}
  <section>
    <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
      {t("captureinfo")}
    </h3>

    <div className="grid md:grid-cols-2 gap-4">
      
      <Input
        name="dog_id"
        label={t("dogId")}
        value={form.dog_id}
        onChange={handleChange}
      />
      

      <Input
        type="date"
        label={t("capturedate")}
        name="capture_date"
        value={form.capture_date || ""}
        onChange={handleChange}
      />

      <Input
        name="capture_location"
        label={t("captureLocation")}
        value={form.capture_location}
        onChange={handleChange}
      />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("captureLocationMap")}
          </label>

            <LocationPicker
              latitude={form.capture_lat}
              longitude={form.capture_lng}
              onChange={(lat, lng) =>
                setForm((prev) => ({
                  ...prev,
                  capture_lat: lat,
                  capture_lng: lng,
                }))
              }
            />

          {form.latitude && form.longitude && (
            <p className="text-xs text-gray-500 mt-2">
              Selected:
              {" "}
              {form.latitude.toFixed(6)},
              {" "}
              {form.longitude.toFixed(6)}
            </p>
          )}
        </div>

    </div>
  </section>

  {/* Physical Information */}
  <section>
    <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
      {t("physicalInfo")}
    </h3>

    <div className="grid md:grid-cols-3 gap-4">

    <FormField label={t("sex")}>
      <select
        name="sex"
        value={form.sex}
        onChange={handleChange}
        className="w-full rounded-xl border p-3 bg-white"
      >
        <option value="">{t("selectSex")}</option>
        <option value="Male">{t("male")}</option>
        <option value="Female">{t("female")}</option>
      </select>
    </FormField>

      <Input
        type="number"
        label={t("estimatedAge")}
        name="estimated_age"
        value={form.estimated_age}
        onChange={handleChange}
      />

      <Input
        type="number"
        label={t("weight")}
        name="weight"
        value={form.weight}
        onChange={handleChange}
      />

      <Input
        name="coat_color"
        label={t("coatColor")}
        value={form.coat_color}
        onChange={handleChange}
      />

      <Input
        name="identifying_marks"
        label={t("identifingMark")}
        value={form.identifying_marks}
        onChange={handleChange}
      />

    </div>
  </section>

  {/* Health */}
  <section>
    <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
      {t("healthInfo")}
    </h3>

    <div className="grid md:grid-cols-2 gap-4">

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.healthy}
          onChange={(e) =>
            setForm({
              ...form,
              healthy: e.target.checked,
            })
          }
        />
        {t("dogHealthy")}
      </label>
    <FormField label={t("healthNotes")}>
      <textarea
        name="health_notes"
        value={form.health_notes}
        onChange={handleChange}
        className="w-full rounded-xl border p-3"
        rows={4}
      />
      </FormField>
      <FormField label={t("vaccinationDetails")}>
      <textarea
        name="vaccination_details"
        value={form.vaccination_details}
        onChange={handleChange}
        className="w-full rounded-xl border p-3"
        rows={4}
      />
      </FormField>

        <FormField label={t("surgeryDetails")}>
      <textarea
        name="surgery_details"
        value={form.surgery_details}
        onChange={handleChange}
        className="w-full rounded-xl border p-3"
        rows={4}
      />
        </FormField>
    </div>
  </section>

  {/* Behavior */}
<section>
  <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
    {t("behaviorInfo")}
  </h3>

  <div className="space-y-6">

    <FormField label={t("behaviorTraits")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {behaviorOptions.map((behavior) => (
          <label
            key={behavior}
            className="
              flex
              items-center
              gap-2
              p-3
              rounded-xl
              border
              cursor-pointer
              hover:bg-orange-50
            "
          >
            <input
              type="checkbox"
              checked={form.behavior.includes(
                behavior
              )}
              onChange={() =>
                toggleBehavior(behavior)
              }
            />

            <span>{behavior}</span>
          </label>
        ))}

      </div>
    </FormField>

    <div className="grid md:grid-cols-1 gap-4">

      <FormField label={t("reproductiveStatuus")}>

        <div className="grid md:grid-cols-3 gap-3">

          {[
            t("intact"),
            t("pregnant"),
            t("sprayedNeutered"),
          ].map((status) => (

            <label
              key={status}
              className={`
                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition

                ${
                  form.reproductive_status.includes(
                    status
                  )
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200"
                }
              `}
            >
              <input
                type="checkbox"
                
                checked={form.reproductive_status.includes(
                  status
                )}
                onChange={() =>
                  toggleReproductiveStatus(status)
                }
                
              />

              <span>{status}</span>

            </label>

          ))}

        </div>

      </FormField>

      <div className="mt-4 max-w-xs">
      <FormField label={t("reproductiveSurgeryDate")}>
        <Input
          type="date"
          name="reproductive_surgery_date"
          value={
            form.reproductive_surgery_date || ""
          }
          onChange={handleChange}
        />
      </FormField>
      </div>

    </div>

  </div>
</section>

  {/* Release */}
  <section>
    <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
      {t("releaseInfo")}
    </h3>

    <div className="grid md:grid-cols-2 gap-4">

      <Input
        type="date"
        label={t("releasedDate")}
        name="release_date"
        value={form.release_date || ""}
        onChange={handleChange}
      />

      <Input
        name="release_location"
        label={t("releasedLocation")}
        value={form.release_location}
        onChange={handleChange}
      />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t("releasedLocationMap")}
          </label>

            <LocationPicker
              latitude={form.capture_lat}
              longitude={form.capture_lng}
              onChange={(lat, lng) =>
                setForm((prev) => ({
                  ...prev,
                  release_lat: lat,
                  release_lng: lng,
                }))
              }
            />

          {form.latitude && form.longitude && (
            <p className="text-xs text-gray-500 mt-2">
              Selected:
              {" "}
              {form.latitude.toFixed(6)},
              {" "}
              {form.longitude.toFixed(6)}
            </p>
          )}
        </div>

    </div>
  </section>

  {/* Outcome */}
  <section>
    <h3 className="text-xl font-semibold text-orange-500 border-b border-orange-300 pb-2 mb-4">
      {t("outcomeInfo")}
    </h3>

      <FormField label={t("outcome")}>

        <div className="grid md:grid-cols-2 gap-3">

          {[
            t("adopted"),
            t("released"),
            t("lontTermShelterResident"),
            t("deceased"),
            t("euthanized"),
            t("treated"),
            t("underTretment"),
            t("realesedToCage"),
          ].map((outcome) => (
            <label
              key={outcome}
              className={`
                flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition
                ${
                  form.outcome === outcome
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200"
                }
              `}
            >
              <input
                type="radio"
                name="outcome"
                checked={form.outcome === outcome}
                onChange={() =>
                  setForm({
                    ...form,
                    outcome,
                  })
                }
              />

              <span>{outcome}</span>
            </label>
          ))}

        </div>

      </FormField>
  </section>

</div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">

          <Button
            variant="secondary"
            onClick={onClose}
          >
            {t("cancel")}
          </Button>

          <Button onClick={handleSubmit}>
            {dog ? t("updateDog") : t("createDog")}
          </Button>

        </div>

      </div>
    </div>
  );
}