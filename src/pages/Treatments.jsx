import { useEffect, useMemo, useState } from "react";
import {
  Syringe,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  PackageMinus,
} from "lucide-react";
import axios from "axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from "../services/treatmentService";

import { getDogs } from "../services/dogService";
import { getInventory } from "../services/inventoryService";
import TreatmentFormModal from "../components/TreatmentFormModal";
import TreatmentDetailsModal from "../components/TreatmentDetailsModal";

export default function Treatments() {
  const API_URL = import.meta.env.VITE_API_URL;

  const getToken = () => localStorage.getItem("token");

  const [treatments, setTreatments] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [originalItems, setOriginalItems] = useState([]);

  const emptyForm = {
    dogId: "",
    treatmentType: "",
    treatmentDate: "",
    veterinarianName: "",
    status: "ongoing",
    notes: "",
    items: [],
  };

  const [form, setForm] = useState(emptyForm);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const validateTreatment = () => {
    const missing = [];

    if (!form.dogId) {
      missing.push(t("dogs"));
    }

    if (!form.treatmentType.trim()) {
      missing.push(t("treatmentType"));
    }

    if (!form.treatmentDate) {
      missing.push(t("treatmentDate"));
    }

    if (!form.veterinarianName.trim()) {
      missing.push(t("veterinarian"));
    }

    // catch duplicate / over-stock inventory rows before hitting the API.
    // when editing, this treatment's own previously-committed quantities
    // get added back to what's "available", since the backend restores
    // them before reapplying the new amounts.
    const requestedByItem = {};

    for (const row of form.items) {
      if (!row.inventoryId) continue;
      requestedByItem[row.inventoryId] =
        (requestedByItem[row.inventoryId] || 0) +
        Number(row.quantityUsed || 0);
    }

    for (const [inventoryId, requested] of Object.entries(
      requestedByItem
    )) {
      const invItem = inventory.find(
        (i) => String(i.id) === String(inventoryId)
      );

      if (!invItem) continue;

      const originalUsed = originalItems
        .filter((o) => String(o.inventoryId) === String(inventoryId))
        .reduce((sum, o) => sum + Number(o.quantityUsed || 0), 0);

      const available = Number(invItem.quantity || 0) + originalUsed;

      if (requested > available) {
        toast.error(`${t("notEnoughStock")}: ${invItem.name}`);
        return false;
      }
    }

    if (missing.length > 0) {
      toast.error(`${t("fillAllFields")}:\n${missing.join(", ")}`);
      return false;
    }

    return true;
  };

  const [veterinarians, setVeterinarians] = useState([]);

  const fetchVeterinarians = async () => {
    try {
      const res = await axios.get(`${API_URL}/veterinarians`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setVeterinarians(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingTreatment(null);
    setOriginalItems([]);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEditModal = async (id) => {
    try {
      const res = await getTreatment(id);

      const treatment = res.data.treatment;
      const items = res.data.items || [];

      const mappedItems = items.map((it) => ({
        inventoryId: it.inventory_id,
        quantityUsed: it.quantity_used,
      }));

      setEditingTreatment(treatment);
      setOriginalItems(mappedItems);

      setForm({
        dogId: treatment.dog_id,
        treatmentType: treatment.treatment_type,
        treatmentDate: formatDate(treatment.treatment_date),
        veterinarianName: treatment.veterinarian_name,
        status: treatment.status,
        notes: treatment.notes || "",
        items: mappedItems,
      });

      setOpenForm(true);
    } catch (err) {
      console.error(err);
      toast.error(t("toastWrong"));
    }
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditingTreatment(null);
    setOriginalItems([]);
    setForm(emptyForm);
  };

  const openTreatmentDetails = async (id) => {
    try {
      const res = await getTreatment(id);

      setSelectedTreatment({
        ...res.data.treatment,
        items: res.data.items,
      });

      setOpenDetails(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    fetchVeterinarians();
  }, []);

  async function loadData() {
    // each fetch has its own try/catch on purpose: if /treatments
    // isn't ready on the backend yet (or errors for any reason),
    // dogs and inventory should still load into the form.
    try {
      const tr = await getTreatments();
      setTreatments(tr.data || tr);
    } catch (err) {
      console.error("Failed to load treatments:", err);
    }

    try {
      const d = await getDogs();
      setDogs(d.data || d);
    } catch (err) {
      console.error("Failed to load dogs:", err);
    }

    try {
      const i = await getInventory();
      setInventory(i.data || i);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  }

  const filteredTreatments = useMemo(() => {
    return treatments.filter((tr) =>
      JSON.stringify(tr).toLowerCase().includes(search.toLowerCase())
    );
  }, [treatments, search]);

  const totalTreatments = treatments.length;

  const completedCount = treatments.filter(
    (tr) => tr.status === "completed"
  ).length;

  const ongoingCount = treatments.filter(
    (tr) => tr.status !== "completed"
  ).length;

  const totalItemsUsed = treatments.reduce(
    (sum, tr) => sum + Number(tr.items_used || 0),
    0
  );

  async function handleSaveTreatment() {
    if (!validateTreatment()) return;

    const isEdit = Boolean(editingTreatment);

    const loadingToast = toast.loading(
      isEdit ? t("toastUpdatingTreatment") : t("toastCreatingTreatment")
    );

    try {
      if (isEdit) {
        await updateTreatment(editingTreatment.id, form);

        toast.success(t("toastTreatmentUpdated"), {
          id: loadingToast,
        });
      } else {
        await createTreatment(form);

        toast.success(t("toastTreatmentCreated"), {
          id: loadingToast,
        });
      }

      closeForm();
      loadData();
    } catch (err) {
      console.error(err);

      toast.error(
        isEdit
          ? t("toastTreatmentUpdateFailed")
          : t("toastTreatmentCreateFailed"),
        { id: loadingToast }
      );
    }
  }

  async function handleDelete(id) {
    if (!confirm(t("deleteTreatment"))) return;

    const loadingToast = toast.loading(t("toastDeletingTreatment"));

    try {
      await deleteTreatment(id);

      loadData();

      toast.success(t("toastTreatmentDeleted"), {
        id: loadingToast,
      });
    } catch (err) {
      console.error(err);

      toast.error(t("toastTreatmentDeleteFailed"), {
        id: loadingToast,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div
        dir={["ar", "ku"].includes(i18n.language) ? "rtl" : "ltr"}
      >
        <h1 className="text-3xl font-bold text-gray-800">
          {t("treatments")}
        </h1>

        <p className="text-gray-500 mt-1">
          {t("manageTreatmentsAndInventoryUsage")}
        </p>
      </div>

      <div
        dir={["ar", "ku"].includes(i18n.language) ? "rtl" : "ltr"}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("totalTreatments")}
              </p>
              <h2 className="text-3xl font-bold">
                {totalTreatments}
              </h2>
            </div>

            <Syringe className="text-orange-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("completed")}
              </p>
              <h2 className="text-3xl font-bold">
                {completedCount}
              </h2>
            </div>

            <CheckCircle className="text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("ongoing")}
              </p>
              <h2 className="text-3xl font-bold">
                {ongoingCount}
              </h2>
            </div>

            <Clock className="text-yellow-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("itemsUsed")}
              </p>
              <h2 className="text-3xl font-bold">
                {Number(totalItemsUsed)}
              </h2>
            </div>

            <PackageMinus className="text-blue-500" />
          </div>
        </Card>
      </div>

      <Card>
        <div
          dir={["ar", "ku"].includes(i18n.language) ? "rtl" : "ltr"}
          className="flex gap-3 flex-wrap"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-4 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-2xl border border-gray-200 pl-10 px-4 py-3"
            />
          </div>

          <Button onClick={openAddModal}>
            <Plus size={18} />
            {t("addTreatment")}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">{t("dogs")}</th>
                <th className="text-left p-3">
                  {t("treatmentType")}
                </th>
                <th className="text-left p-3">
                  {t("veterinarian")}
                </th>
                <th className="text-left p-3">{t("dates")}</th>
                <th className="text-left p-3">{t("status")}</th>
                <th className="text-left p-3">{t("action")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredTreatments.map((tr) => (
                <tr key={tr.id} className="border-b">
                  <td className="p-3">{tr.dog_code}</td>

                  <td className="p-3">{tr.treatment_type}</td>

                  <td className="p-3">{tr.veterinarian_name}</td>

                  <td className="p-3">
                    {new Date(tr.treatment_date).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tr.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tr.status === "completed"
                        ? t("completed")
                        : t("ongoing")}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTreatmentDetails(tr.id)}
                        className="p-2 rounded-xl bg-blue-100 text-blue-600 cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => openEditModal(tr.id)}
                        className="p-2 rounded-xl bg-orange-100 text-orange-600 cursor-pointer"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(tr.id)}
                        className="p-2 rounded-xl bg-red-100 text-red-600 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TreatmentFormModal
        open={openForm}
        onClose={closeForm}
        form={form}
        setForm={setForm}
        dogs={dogs}
        inventory={inventory}
        veterinarians={veterinarians}
        onSave={handleSaveTreatment}
        editingTreatment={editingTreatment}
        originalItems={originalItems}
      />

      <TreatmentDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        treatment={selectedTreatment}
      />
    </div>
  );
}