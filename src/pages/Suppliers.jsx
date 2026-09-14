import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  Truck,
  Plus,
  Trash2,
  Pencil,
  Search,
} from "lucide-react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/supplierService";

export default function Suppliers() {
  const [suppliers, setSuppliers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [openModal, setOpenModal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] = useState({
    supplier_code: "",
    name: "",
    phone: "",
    location: "",
  });
  const { t, i18n } = useTranslation();


  const validateSupplier = () => {
  const missing = [];

  if (!form.supplier_code.trim()) {
    missing.push(t("supplierId"));
  }

  if (!form.name.trim()) {
    missing.push(t("name"));
  }

  if (!form.phone.trim()) {
    missing.push(t("phone"));
  }

  if (!form.location.trim()) {
    missing.push(t("location"));
  }

  if (missing.length > 0) {
    toast.error(
      `${t("fillAllFields")}:\n${missing.join(", ")}`
    );
    return false;
  }

  return true;
};


  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers =
    async () => {
      try {
        const res =
          await getSuppliers();

        setSuppliers(res.data);
      } catch {
        toast.error(
          t("failedLoadSuppliers")
        );
      }
    };

  const resetForm = () => {
    setEditing(null);

    setForm({
      supplier_code: "",
      name: "",
      phone: "",
      location: "",
    });
  };

  const saveSupplier =
    async () => {
      if (!validateSupplier()) return;
      try {
        if (editing) {
          await updateSupplier(
            editing.id,
            form
          );

          toast.success(
            t("supplierUpdated")
          );
        } else {
          await createSupplier(form);

          toast.success(
            t("supplierCreated")
          );
        }

        setOpenModal(false);

        resetForm();

        loadSuppliers();
      } catch {
        toast.error(
          t("operationFailed")
        );
      }
    };

  const editSupplier = (
    supplier
  ) => {
    setEditing(supplier);

    setForm({
      supplier_code:
        supplier.supplier_code,
      name: supplier.name,
      phone: supplier.phone,
      location:
        supplier.location,
    });

    setOpenModal(true);
  };

  const removeSupplier =
    async (id) => {
      if (
        !window.confirm(
          t("deleteSupplier")
        )
      )
        return;

      try {
        await deleteSupplier(id);

        toast.success(
          t("supplierDeleted")
        );

        loadSuppliers();
      } catch {
        toast.error(
          t("deleteFailed")
        );
      }
    };

  const filtered =
    suppliers.filter((s) =>
      `${s.supplier_code}
       ${s.name}
       ${s.phone}
       ${s.location}`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div className="space-y-6">

      <Card>

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              {t("suppliers")}
            </h1>

            <p className="text-gray-500">
              {t("manageSuppliers")}
            </p>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setOpenModal(true);
            }}
          >
            <Plus size={18} />
            {t("addSupplier")}
          </Button>

        </div>

      </Card>

      <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid md:grid-cols-3 gap-4">

        <Card>
          <div className="flex justify-between">
            <div>
              <p>{t("totalSuppliers")}</p>

              <h2 className="text-3xl font-bold">
                {suppliers.length}
              </h2>
            </div>

            <Truck className="text-orange-500" />
          </div>
        </Card>

      </div>

      <Card>

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="relative mb-4">

          <Search
            size={18}
            className="absolute left-3 top-4 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder={t("searchSuppliers")}
            className="
              w-full
              rounded-2xl
              border
              border-gray-200
              pl-10
              px-4
              py-3
            "
          />

        </div>

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">
                {t("supplierId")}
              </th>

              <th className="p-3 text-left">
                {t("name")}
              </th>

              <th className="p-3 text-left">
                {t("phone")}
              </th>

              <th className="p-3 text-left">
                {t("location")}
              </th>

              <th className="p-3 text-left">
                {t("action")}
              </th>
            </tr>
          </thead>

          <tbody>

            {filtered.map(
              (supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b"
                >
                  <td className="p-3 font-medium">
                    {
                      supplier.supplier_code
                    }
                  </td>

                  <td className="p-3">
                    {supplier.name}
                  </td>

                  <td className="p-3">
                    {supplier.phone}
                  </td>

                  <td className="p-3">
                    {
                      supplier.location
                    }
                  </td>

                  <td className="p-3">

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          editSupplier(
                            supplier
                          )
                        }
                        className="
                          p-2
                          rounded-xl
                          bg-blue-100
                          text-blue-600
                        "
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() =>
                          removeSupplier(
                            supplier.id
                          )
                        }
                        className="
                          p-2
                          rounded-xl
                          bg-red-100
                          text-red-600
                        "
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>
                </tr>
              )
            )}

          </tbody>

        </table>

      </Card>

      <Modal
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        title={
          editing
            ? t("editSupplier")
            : t("addSupplier")
        }
      >

        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid md:grid-cols-2 gap-4">

          <Input
            label={t("supplierId")}
            value={
              form.supplier_code
            }
            onChange={(e) =>
              setForm({
                ...form,
                supplier_code:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("name")}
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("phone")}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone:
                  e.target.value,
              })
            }
          />

          <Input
            label={t("location")}
            value={form.location}
            onChange={(e) =>
              setForm({
                ...form,
                location:
                  e.target.value,
              })
            }
          />

        </div>

        <div className="flex justify-end mt-6">

          <Button
            onClick={saveSupplier}
          >
            {t("saveSupplier")}
          </Button>

        </div>

      </Modal>

    </div>
  );
}