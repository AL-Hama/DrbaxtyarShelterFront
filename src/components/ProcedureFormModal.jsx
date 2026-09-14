import Card from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import { useTranslation } from "react-i18next";
export default function ProcedureFormModal({
  open,
  onClose,
  form,
  setForm,
  dogs,
  inventory,
  veterinarians,
  onSave,
}) {
  const selectedDog = dogs.find(
    (d) => String(d.id) === String(form.dogId)
  );
const { t, i18n } = useTranslation();
  const addInventoryRow = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          inventoryId: "",
          quantityUsed: 1,
        },
      ],
    });
  };

  const updateInventoryRow = (
    index,
    field,
    value
  ) => {
    const items = [...form.items];

    items[index][field] = value;

    setForm({
      ...form,
      items,
    });
  };

  const removeInventoryRow = (index) => {
    const items = [...form.items];

    items.splice(index, 1);

    setForm({
      ...form,
      items,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Medical Procedure"
    >
      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="space-y-6">

        <Card title={t("dogInformation")}>

          <select
            value={form.dogId}
            onChange={(e) =>
              setForm({
                ...form,
                dogId: e.target.value,
              })
            }
            className="
              w-full
              rounded-2xl
              border
              border-orange-200
              px-4
              py-3
            "
          >
            <option value="">
              {t("selectDog")}
            </option>

            {dogs.map((dog) => (
              <option
                key={dog.id}
                value={dog.id}
              >
                {dog.dog_id}
              </option>
            ))}
          </select>

          {selectedDog && (
            <div
              className="
                mt-4
                rounded-3xl
                border
                border-orange-200
                bg-orange-50
                p-5
              "
            >
              <div className="grid md:grid-cols-4 gap-4">

                <div>
                  <p className="text-xs text-gray-500">
                    {t("dogId")}
                  </p>

                  <p className="font-bold">
                    {selectedDog.dog_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {t("sex")}
                  </p>

                  <p className="font-bold">
                    {selectedDog.sex}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {t("age")}
                  </p>

                  <p className="font-bold">
                    {
                      selectedDog.estimated_age
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    {t("weight")}
                  </p>

                  <p className="font-bold">
                    {selectedDog.weight}
                  </p>
                </div>

              </div>
            </div>
          )}

        </Card>

        <Card title={t("procedureInformation")}>

          <div className="grid md:grid-cols-2 gap-4">

            <Input
              label={t("procedureType")}
              value={form.procedureType}
              onChange={(e) =>
                setForm({
                  ...form,
                  procedureType:
                    e.target.value,
                })
              }
            />

              <div>
                <label className="font-medium text-gray-700">
                  {t("veterinarian")}
                </label>

                <select
                  value={form.veterinarianName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      veterinarianName: e.target.value,
                    })
                  }
                  className="
                    mt-2
                    w-full
                    rounded-2xl
                    border
                    border-gray-200
                    px-4
                    py-3
                  "
                >
                  <option value="">
                    {t("selectVeterinarian")}
                  </option>

                  {veterinarians.map((vet) => (
                    <option
                      key={vet.id}
                      value={`${vet.first_name} ${vet.last_name}`}
                    >
                      {vet.first_name} {vet.last_name}
                    </option>
                  ))}
                </select>
              </div>
            <Input
              type="date"
              label={t("procedureDate")}
              value={form.procedureDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  procedureDate:
                    e.target.value,
                })
              }
            />

            <div>
              <label className="font-medium text-gray-700">
                {t("status")}
              </label>

              <select
                value={
                  form.surgerySuccessful
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    surgerySuccessful:
                      e.target.value ===
                      "true",
                  })
                }
                className="
                  mt-2
                  w-full
                  rounded-2xl
                  border
                  border-gray-200
                  px-4
                  py-3
                "
              >
                <option value="true">
                  {t("successful")}
                </option>

                <option value="false">
                  {t("failed")}
                </option>
              </select>
            </div>

          </div>

        </Card>

        <Card title={t("InventoryUsage")}>

          <div className="space-y-3">

            {form.items.map(
              (item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3"
                >

                  <select
                    value={
                      item.inventoryId
                    }
                    onChange={(e) =>
                      updateInventoryRow(
                        index,
                        "inventoryId",
                        e.target.value
                      )
                    }
                    className="
                      col-span-7
                      rounded-2xl
                      border
                      border-gray-200
                      px-4
                      py-3
                    "
                  >
                    <option value="">
                      {t("selectItem")}
                    </option>

                    {inventory.map(
                      (inv) => (
                        <option
                          key={inv.id}
                          value={inv.id}
                        >
                          {inv.name}
                        </option>
                      )
                    )}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={
                      item.quantityUsed
                    }
                    onChange={(e) =>
                      updateInventoryRow(
                        index,
                        "quantityUsed",
                        e.target.value
                      )
                    }
                    className="
                      col-span-3
                      rounded-2xl
                      border
                      border-gray-200
                      px-4
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeInventoryRow(
                        index
                      )
                    }
                    className="
                      col-span-2
                      rounded-2xl
                      bg-red-100
                      text-red-600
                    "
                  >
                    ✕
                  </button>

                </div>
              )
            )}

            <Button
              variant="outline"
              onClick={addInventoryRow}
            >
              {t("addItmes")}
            </Button>

          </div>

        </Card>

        <Card title={t("note")}>

          <textarea
            rows={5}
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
            className="
              w-full
              rounded-2xl
              border
              border-gray-200
              p-4
            "
          />

        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave}>
            {t("saveProcedure")}
          </Button>
        </div>

      </div>
    </Modal>
  );
}