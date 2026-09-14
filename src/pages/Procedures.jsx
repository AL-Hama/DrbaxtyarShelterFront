import { useEffect, useMemo, useState } from "react";
import {
  Stethoscope,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  PackageMinus,
} from "lucide-react";
import axios from "axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  getProcedures,
  getProcedure,
  createProcedure,
  deleteProcedure,
} from "../services/procedureService";

import { getDogs } from "../services/dogService";
import { getInventory } from "../services/inventoryService";
import ProcedureFormModal from "../components/ProcedureFormModal";
import ProcedureDetailsModal from "../components/ProcedureDetailsModal";

export default function Procedures() {
  const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");
  const [procedures, setProcedures] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [selectedProcedure, setSelectedProcedure] =
    useState(null);

  const [form, setForm] = useState({
    dogId: "",
    procedureType: "",
    procedureDate: "",
    veterinarianName: "",
    surgerySuccessful: true,
    notes: "",
    items: [],
  });



  const validateProcedure = () => {
  const missing = [];

  if (!form.dogId) {
    missing.push(t("dogs"));
  }

  if (!form.procedureType.trim()) {
    missing.push(t("procedures"));
  }

  if (!form.procedureDate) {
    missing.push(t("procedureDate"));
  }

  if (!form.veterinarianName.trim()) {
    missing.push(t("veterinarian"));
  }

  if (missing.length > 0) {
    toast.error(
      `${t("fillAllFields")}:\n${missing.join(", ")}`
    );
    return false;
  }

  return true;
};


  const [veterinarians, setVeterinarians] = useState([]);
  const fetchVeterinarians = async () => {
  try {
    console.log(getToken());
    const res = await axios.get(
      `${API_URL}/veterinarians`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    setVeterinarians(res.data);
  } catch (err) {
    console.error(err);
  }
};

  const openProcedureDetails = async (id) => {
  try {
    const res = await getProcedure(id);

    setSelectedProcedure({
      ...res.data.procedure,
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
    try {
      const [p, d, i] = await Promise.all([
        getProcedures(),
        getDogs(),
        getInventory(),
      ]);

      setProcedures(p.data || p);
      setDogs(d.data || d);
      setInventory(i.data || i);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredProcedures = useMemo(() => {
    return procedures.filter((p) =>
      JSON.stringify(p)
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [procedures, search]);

  const totalProcedures = procedures.length;

  const successfulCount = procedures.filter(
    (p) => p.surgery_successful === true
  ).length;

  const failedCount = procedures.filter(
    (p) => p.surgery_successful === false
  ).length;

 const totalItemsUsed = procedures.reduce(
  (sum, p) => sum + Number(p.items_used || 0),
  0
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

    setForm({
      ...form,
      items,
    });
  }

  function removeInventoryRow(index) {
    const items = [...form.items];

    items.splice(index, 1);

    setForm({
      ...form,
      items,
    });
  }

async function handleCreateProcedure() {
  if (!validateProcedure()) return;

  const loadingToast = toast.loading(
    t("toastCreatingProcedure")
  );

  try {
    await createProcedure(form);

    toast.success(t("toastProcedureCreated"), {
      id: loadingToast,
    });

    setOpenForm(false);

    setForm({
      dogId: "",
      procedureType: "",
      procedureDate: "",
      veterinarianName: "",
      surgerySuccessful: true,
      notes: "",
      items: [],
    });

    loadData();
  } catch (err) {
    console.error(err);

    toast.error(t("toastProcedureCreateFailed"), {
      id: loadingToast,
    });
  }
}

async function handleDelete(id) {
  if (!confirm(t("deleteProcedure"))) return;

  const loadingToast = toast.loading(
    t("toastDeletingProcedure")
  );

  try {
    await deleteProcedure(id);

    loadData();

    toast.success(t("toastProcedureDeleted"), {
      id: loadingToast,
    });
  } catch (err) {
    console.error(err);

    toast.error(t("toastProcedureDeleteFailed"), {
      id: loadingToast,
    });
  }
}

  const selectedDog = dogs.find(
    (d) => String(d.id) === String(form.dogId)
  );

  return (
    <div  className="space-y-6">

      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } >
        <h1 className="text-3xl font-bold text-gray-800">
          {t("medicalProcedures")}
        </h1>

        <p className="text-gray-500 mt-1">
          {t("manageSurgeriesAndInventoryUsage")}
        </p>
      </div>

      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="grid gap-4 md:grid-cols-4">

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("totalProcedures")}
              </p>
              <h2 className="text-3xl font-bold">
                {totalProcedures}
              </h2>
            </div>

            <Stethoscope className="text-orange-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("successful")}
              </p>
              <h2 className="text-3xl font-bold">
                {successfulCount}
              </h2>
            </div>

            <CheckCircle className="text-green-500" />
          </div>
        </Card>

        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {t("failed")}
              </p>
              <h2 className="text-3xl font-bold">
                {failedCount}
              </h2>
            </div>

            <XCircle className="text-red-500" />
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

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="flex gap-3 flex-wrap">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-4 text-gray-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={t("search")}
              className="w-full rounded-2xl border border-gray-200 pl-10 px-4 py-3"
            />

          </div>

          <Button
            onClick={() => setOpenForm(true)}
          >
            <Plus size={18} />
            {t("addProcedure")}
          </Button>

        </div>

      </Card>

      <Card>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  {t("dogs")}
                </th>

                <th className="text-left p-3">
                  {t("procedures")}
                </th>

                <th className="text-left p-3">
                  {t("veterinarian")}
                </th>

                <th className="text-left p-3">
                  {t("dates")}
                </th>

                <th className="text-left p-3">
                  {t("status")}
                </th>

                <th className="text-left p-3">
                  {t("action")}
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredProcedures.map((p) => (

                <tr
                  key={p.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {p.dog_code}
                  </td>

                  <td className="p-3">
                    {p.procedure_type}
                  </td>

                  <td className="p-3">
                    {p.veterinarian_name}
                  </td>

                    <td className="p-3">
                      {new Date(p.procedure_date).toLocaleDateString()}
                    </td>

                  <td className="p-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.surgery_successful
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.surgery_successful
                        ? t("successful")
                        : t("failed")}
                    </span>

                  </td>

                  <td className="p-3">

                    <div className="flex gap-2">

                    <button
                    onClick={() => openProcedureDetails(p.id)}
                    className="p-2 rounded-xl bg-blue-100 text-blue-600"
                    >
                    <Eye size={16} />
                    </button>

                      <button
                        onClick={() =>
                          handleDelete(p.id)
                        }
                        className="p-2 rounded-xl bg-red-100 text-red-600"
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

              <ProcedureFormModal
            open={openForm}
            onClose={() => setOpenForm(false)}
            form={form}
            setForm={setForm}
            dogs={dogs}
            inventory={inventory}
            veterinarians={veterinarians}
            onSave={handleCreateProcedure}
            />

            <ProcedureDetailsModal
            open={openDetails}
            onClose={() => setOpenDetails(false)}
            procedure={selectedProcedure}
            />

   
    </div>
  );
}