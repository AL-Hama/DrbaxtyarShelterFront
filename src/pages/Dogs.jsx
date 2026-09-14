import { useEffect, useState } from "react";
import DogDetailsModal from "../components/DogDetailsModal";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import DogFormModal from "../components/DogFormModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";

import {
  getDogs,
  deleteDog,
} from "../services/dogService";

export default function Dogs() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDog, setSelectedDog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [sexFilter, setSexFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [editingDog, setEditingDog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDogId, setDeleteDogId] = useState(null);
  const { t, i18n } = useTranslation();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const openDogDetails = (dog) => {
    setSelectedDog(dog);
    setShowModal(true);
    };

  async function loadDogs() {
    try {
      const data = await getDogs();
      setDogs(data);
    } catch (err) {
      console.log(err);
      toast.error(t("toastFaildLoadDogs"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDogs();
  }, []);


const handleDelete = async () => {
  if (!deleteDogId) return;

  try {
    setDeleteLoading(true);

    await deleteDog(deleteDogId);

    setDogs((prev) => prev.filter((d) => d.id !== deleteDogId));

    toast.success(t("toastDogDeletSucc"));
    setDeleteDogId(null);

  } catch (err) {
    if (
      err.response?.status === 409 &&
      err.response?.data?.message === "DOG_USED_IN_PROCEDURE"
    ) {
      toast.error(t("dogUsedInProcedure"));
    } else {
      toast.error(t("toastDogDeleteFaild"));
    }
  } finally {
    setDeleteLoading(false);
  }
};


const outcomes = [...new Set(dogs.map((d) => d.outcome).filter(Boolean))];
    const filteredDogs = dogs.filter((dog) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        dog.dog_id?.toLowerCase().includes(searchTerm) ||
        dog.capture_location?.toLowerCase().includes(searchTerm) ||
        dog.coat_color?.toLowerCase().includes(searchTerm) ||
        dog.sex?.toLowerCase().includes(searchTerm) ||
        dog.outcome?.toLowerCase().includes(searchTerm);

      const matchesSex =
        sexFilter === "all" ||
        dog.sex?.toLowerCase() === sexFilter;

      const matchesHealth =
        healthFilter === "all" ||
        (healthFilter === "healthy" && dog.healthy) ||
        (healthFilter === "sick" && !dog.healthy);

      const matchesOutcome =
        outcomeFilter === "all" ||
        dog.outcome === outcomeFilter;

      return (
        matchesSearch &&
        matchesSex &&
        matchesHealth &&
        matchesOutcome
      );
    });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {t("capturedDog")}
            </h1>

            <p className="text-gray-500 mt-1">
              {t("totalDogs")}{" "}
              <span className="font-semibold text-orange-500">
                {filteredDogs.length}
              </span>
            </p>
          </div>

            <Button
            onClick={() => {
                setEditingDog(null);
                setShowFormModal(true);
            }}
            >
            <Plus size={18} />
            {t("addDog")}
            </Button>
        </div>
      </Card>

      {/* Search */}
        <Card>
          <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex items-center gap-2">

            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <Input
                className="pl-11"
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Sex */}
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="
                        h-10
                        w-36
                        rounded-lg
                        border
                        border-gray-300
                        px-3
                        text-sm
                        focus:outline-none
                        focus:ring-2
                        focus:ring-orange-400
                      "
            >
              <option value="all">{t("allSex")}</option>
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
            </select>

            {/* Health */}
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="
                    h-10
                    w-36
                    rounded-lg
                    border
                    border-gray-300
                    px-3
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-orange-400
                  "
            >
              <option value="all">{t("dogAllHealth")}</option>
              <option value="healthy">{t("dogHealthy")}</option>
              <option value="sick">{t("dogSick")}</option>
            </select>

            {/* Outcome */}
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="
                      h-10
                      w-36
                      rounded-lg
                      border
                      border-gray-300
                      px-3
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-orange-400
                    "
            >
              <option value="all">All Outcomes</option>

              {outcomes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

          </div>
        </Card>

      {/* Table */}
      <Card>
        <div  className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-sm uppercase">
                  <th className="px-4 py-4 text-left">{t("id")}</th>
                  <th className="px-4 py-4 text-left">{t("location")}</th>
                  <th className="px-4 py-4 text-center">{t("sex")}</th>
                  <th className="px-4 py-4 text-center">{t("age")}</th>
                  <th className="px-4 py-4 text-center">{t("weight")}</th>
                  <th className="px-4 py-4 text-center">{t("dogHealthy")}</th>
                  <th className="px-4 py-4 text-center">{t("outcome")}</th>
                  <th className="px-4 py-4 text-center">{t("action")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredDogs.length > 0 ? (
                  filteredDogs.map((dog) => (
                    <tr
                    key={dog.id}
                    onClick={() => openDogDetails(dog)}
                    className="
                        border-b
                        hover:bg-orange-50
                        cursor-pointer
                        transition-all
                    "
                    >
                      <td className="px-4 py-4 font-semibold text-gray-800">
                        {dog.dog_id}
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {dog.capture_location}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            dog.sex?.toLowerCase() === "male"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-pink-100 text-pink-700"
                          }`}
                        >
                          {dog.sex}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {dog.estimated_age}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {dog.weight} kg
                      </td>

                      <td className="px-4 py-4 text-center">
                        {dog.healthy ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            {t("dogHealthy")}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            {t("dogSick")}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                          {dog.outcome}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                          >
                            <Pencil size={16} />
                          </button>

                            <button
                            onClick={async (e) => {
                                e.stopPropagation(); // 🔥 THIS FIXES THE MODAL ISSUE

                                setDeleteDogId(dog.id);

                                if (!confirmed) return;

                                try {
                                await deleteDog(dog.id);

                                // optional: better UX than reload
                                setDogs((prev) => prev.filter((d) => d.id !== dog.id));
                                 toast.success(t("toastDogDeletSucc"));
                                } catch (err) {
                                console.log(err);
                                toast.error(t("toastDogDeleteFaild"));
                                }
                            }}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-12 text-center text-gray-500"
                    >
                      {t("noDogFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>


     <DogDetailsModal
        dog={selectedDog}
        open={showModal}
        onClose={() => setShowModal(false)}
        onEdit={(dog) => {
        setSelectedDog(null);
        setShowModal(false);

        setEditingDog(dog);
        setShowFormModal(true);
        }}
    />

        <DogFormModal
        open={showFormModal}
        dog={editingDog}
        onClose={() => setShowFormModal(false)}
        onSaved={loadDogs}
        />

        <DeleteConfirmModal
            open={!!deleteDogId}
            title="Delete Dog"
            message={t("deleteItemMessage")}
            loading={deleteLoading}
            onCancel={() => setDeleteDogId(null)}
            onConfirm={handleDelete}
            />
            
    </div>
  );
}