import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function TreatmentFormModal({
  open,
  onClose,
  form,
  setForm,
  dogs,
  inventory,
  veterinarians,
  onSave,
  editingTreatment = null,
  originalItems = [],
}) {
  const { t, i18n } = useTranslation();

  const dir = ["ar", "ku"].includes(i18n.language) ? "rtl" : "ltr";

  const selectedDog = dogs.find(
    (d) => String(d.id) === String(form.dogId)
  );

  function addInventoryRow() {
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
  }

  function updateInventoryRow(index, field, value) {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  }

  function removeInventoryRow(index) {
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
  }

  // an inventory item can't be picked twice, and quantity used
  // can't exceed what's currently in stock. When editing, this
  // treatment's own previously-committed quantity gets added back
  // in (since the backend restores it before reapplying on save).
  function getAvailableQty(inventoryId, currentRowIndex) {
    const invItem = inventory.find(
      (i) => String(i.id) === String(inventoryId)
    );

    if (!invItem) return 0;

    const originalUsed = originalItems
      .filter((o) => String(o.inventoryId) === String(inventoryId))
      .reduce((sum, o) => sum + Number(o.quantityUsed || 0), 0);

    const usedElsewhere = form.items.reduce((sum, row, idx) => {
      if (idx === currentRowIndex) return sum;
      if (String(row.inventoryId) === String(inventoryId)) {
        return sum + Number(row.quantityUsed || 0);
      }
      return sum;
    }, 0);

    return (
      Number(invItem.quantity || 0) + originalUsed - usedElsewhere
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTreatment ? t("editTreatment") : t("addTreatment")}
      className="max-w-4xl"
    >
      <div dir={dir} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
            {t("basicInfo")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t("dogs")}
              </label>

              <select
                value={form.dogId}
                onChange={(e) =>
                  setForm({ ...form, dogId: e.target.value })
                }
                className="w-full rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-gray-700 shadow-sm transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:outline-none"
              >
                <option value="">{t("selectDog")}</option>

                {dogs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dog_id || `${t("dogs")} #${d.id}`}
                  </option>
                ))}
              </select>

              {selectedDog && (
                <p className="mt-1 text-xs text-gray-500">
                  {selectedDog.coat_color} · {selectedDog.sex}
                </p>
              )}
            </div>

            <Input
              label={t("treatmentType")}
              value={form.treatmentType}
              onChange={(e) =>
                setForm({ ...form, treatmentType: e.target.value })
              }
            />

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("treatmentDate")}
              </label>

              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none"
                value={form.treatmentDate}
                onChange={(e) =>
                  setForm({ ...form, treatmentDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="w-full rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-gray-700 shadow-sm transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:outline-none"
              >
                <option value="">{t("selectVeterinarian")}</option>

                {veterinarians.map((v) => {
                  const fullName = `${v.first_name || ""} ${
                    v.last_name || ""
                  }`.trim();

                  const displayName =
                    fullName || v.username || `${t("veterinarian")} #${v.id}`;

                  return (
                    <option key={v.id} value={fullName || displayName}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t("status")}
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="w-full rounded-xl border border-orange-200 bg-orange-50/50 px-4 py-3 text-gray-700 shadow-sm transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:outline-none"
              >
                <option value="ongoing">{t("ongoing")}</option>
                <option value="completed">{t("completed")}</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              {t("note")}
            </label>

            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none"
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />
          </div>
        </div>

        {/* Inventory used */}
        <div>
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold text-orange-600">
              {t("itemsUsed")}
            </h3>

            <Button
              variant="secondary"
              className="h-9 px-3 text-sm"
              onClick={addInventoryRow}
            >
              <Plus size={16} />
              {t("addItem")}
            </Button>
          </div>

          {form.items.length === 0 && (
            <p className="text-sm text-gray-400">
              {t("noItemsAddedYet")}
            </p>
          )}

          <div className="space-y-3">
            {form.items.map((row, index) => {
              const available = getAvailableQty(
                row.inventoryId,
                index
              );

              const overLimit =
                row.inventoryId &&
                Number(row.quantityUsed || 0) > available;

              return (
                <div
                  key={index}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/30 p-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={row.inventoryId}
                      onChange={(e) =>
                        updateInventoryRow(
                          index,
                          "inventoryId",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">{t("selectItem")}</option>

                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.quantity} {t("inStock")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      min={1}
                      value={row.quantityUsed}
                      onChange={(e) =>
                        updateInventoryRow(
                          index,
                          "quantityUsed",
                          e.target.value
                        )
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${
                        overLimit
                          ? "border-red-500"
                          : "border-orange-200"
                      }`}
                    />

                    {row.inventoryId && (
                      <p
                        className={`mt-1 text-xs ${
                          overLimit ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {available} {t("available")}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeInventoryRow(index)}
                    className="mt-1 rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t pt-4">
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>

        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={onSave}
        >
          {editingTreatment ? t("updateTreatment") : t("saveTreatment")}
        </Button>
      </div>
    </Modal>
  );
}