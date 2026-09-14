import { useEffect,useMemo, useState } from "react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL;

import {
    Package,
    DollarSign,
    Boxes,
    TrendingUp,
    Plus,
    Search,
    Pencil,
    Trash2
} from "lucide-react";

const SUBCATEGORY_OPTIONS = ["Shop", "Clinic", "Salon", "Hotel"];

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [subcategoryFilter, setSubcategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { t, i18n } = useTranslation();
    const [form, setForm] = useState({
        name: "",
        category: "",
        subcategory: "",
        barcode: "",
        quantity: "",
        cost_price: "",
        unit_price: "",
        item_date: "",
        expire_date: "",
        supplier: "",
        location: "",
        notes: "",
        animaltype: ""
    });
const [suppliers, setSuppliers] = useState([]);
const [errors, setErrors] = useState({});
const fetchSuppliers = async () => {
    try {
        const res = await axios.get(`${API_URL}/suppliers`, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        setSuppliers(res.data);
    } catch (error) {
        console.error("Suppliers Error:", error);
        toast.error("Failed to load suppliers");
    }
};

  const formatIQD = (amount) =>
  new Intl.NumberFormat("en-IQ", {
    maximumFractionDigits: 0,
  }).format(amount);
  

  const validateForm = () => {
  const newErrors = {};

  if (!form.name.trim()) {
    newErrors.name = t("itemNameIsRequired");
  }

if (!form.barcode.trim()) {
    newErrors.barcode = t("barcodeisRequired");
  }
  if (!form.quantity) {
    newErrors.quantity = t("quantitesIsRequired");
  }

  if (!form.cost_price) {
    newErrors.cost_price = t("costPriceIsRequired");
  }

  if (!form.unit_price) {
    newErrors.unit_price = t("unitPriceIsRequired");
  }
    if (!form.item_date) {
    newErrors.item_date = t("purchaseDateIsRequired");
  }
    if (!form.expire_date) {
    newErrors.expire_date = t("expireDateIsRequired");
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

    
      const [stats, setStats] = useState({
      total_items: 0,
      total_quantity: 0,
      total_cost: 0,
      low_stock: 0,
    });

            const getToken = () => localStorage.getItem("token");

            const fetchInventory = async () => {
                try {
                    const res = await axios.get(
                        `${API_URL}/inventory`,
                        {
                            headers: {
                                Authorization: `Bearer ${getToken()}`
                            }
                        }
                    );

                    setItems(res.data);
                } catch (error) {
                    console.error("Inventory Error:", error);
                    toast.error(t("toastFailLoadInv"));
                }
            };

            const fetchStats = async () => {
                try {
                    const res = await axios.get(
                        `${API_URL}/inventory/stats`,
                        {
                            headers: {
                                Authorization: `Bearer ${getToken()}`
                            }
                        }
                    );

                    setStats(res.data);
                } catch (error) {
                    console.error("Stats Error:", error);
                    toast.error(t("toastFailLoadStatic"));
                }
            };

            useEffect(() => {
                fetchInventory();
                fetchStats();
                fetchSuppliers(); 
            }, []);



            const categories = [
                ...new Set(
                    items
                        .map(item => item.category)
                        .filter(Boolean)
                )
            ];


        const filteredItems = useMemo(() => {
            return items.filter((item) => {
                const matchesSearch =
                    (item.name || "")
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                    (item.barcode || "")
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                    (item.supplier || "")
                        .toLowerCase()
                        .includes(search.toLowerCase());

                const matchesCategory =
                    !categoryFilter ||
                    item.category === categoryFilter;

                const matchesSubcategory =
                    !subcategoryFilter ||
                    item.subcategory === subcategoryFilter;

                const qty = Number(item.quantity || 0);

                const today = new Date();

                const expireDate = item.expire_date
                    ? new Date(item.expire_date)
                    : null;

                const daysUntilExpire = expireDate
                    ? Math.ceil(
                        (expireDate - today) /
                            (1000 * 60 * 60 * 24)
                    )
                    : null;

                let matchesStatus = true;

                switch (statusFilter) {
                    case "out":
                        matchesStatus = qty === 0;
                        break;

                    case "low":
                        matchesStatus =
                            qty > 0 && qty < 30;
                        break;

                    case "expired":
                        matchesStatus =
                            expireDate &&
                            expireDate < today;
                        break;

                    case "near":
                        matchesStatus =
                            expireDate &&
                            daysUntilExpire >= 0 &&
                            daysUntilExpire <= 30;
                        break;

                    default:
                        matchesStatus = true;
                }

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesSubcategory &&
                    matchesStatus
                );
            });
        }, [
            items,
            search,
            categoryFilter,
            subcategoryFilter,
            statusFilter
        ]);

    const totalItems = stats.total_items;
    const totalQuantity = stats.total_quantity;

    const totalCost = useMemo(() => {
        return filteredItems.reduce((sum, item) => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.cost_price || 0);

            return sum + qty * cost;
        }, 0);
    }, [filteredItems]);

    const totalProfit = useMemo(() => {
        return filteredItems.reduce((sum, item) => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.cost_price || 0);
            const price = Number(item.unit_price || 0);

            return sum + (price - cost) * qty;
        }, 0);
    }, [filteredItems]);

    const openAddModal = () => {

        setEditingItem(null);

        setForm({
            name: "",
            category: "",
            subcategory: "",
            barcode: "",
            quantity: "",
            cost_price: "",
            unit_price: "",
            item_date: "",
            expire_date: "",
            supplier: "",
            location: "",
            notes: "",
            animaltype: ""
        });
        setErrors({});
        setModalOpen(true);
    };

        const formatDate = (date) => {
            if (!date) return "";

            return new Date(date)
                .toISOString()
                .split("T")[0];
        };

        const openEditModal = (item) => {
            setEditingItem(item);

            setForm({
                ...item,
                item_date: formatDate(item.item_date),
                expire_date: formatDate(item.expire_date),
            });
            setErrors({});
            setModalOpen(true);
        };

const saveItem = async () => {
    if (!validateForm()) return;


  const loadingToast = toast.loading(
    editingItem ? t("toastUpdatingItem") : t("toastSavingItem")

    
  );
  

  try {
    if (editingItem) {
      await axios.put(
        `${API_URL}/inventory/${editingItem.id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      toast.success(t("toastItemUpdateSucc"), {
        id: loadingToast,
      });
    } else {
      await axios.post(
        `${API_URL}/inventory`,
        form,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      toast.success(t("toastItemAddSucc"), {
        id: loadingToast,
      });
    }

    await fetchInventory();
    await fetchStats();

    setModalOpen(false);
  } catch (error) {
    console.error(error);

    toast.error(t("toastItemAddFaild"), {
      id: loadingToast,
    });
  }
};



const confirmDeleteItem = async () => {
  if (!deleteItemId) return;

  const loadingToast = toast.loading(t("toastDeletingItem"));

  try {
    await axios.delete(`${API_URL}/inventory/${deleteItemId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    await fetchInventory();
    await fetchStats();

    toast.success(t("toastItemDeleteSucc"), {
      id: loadingToast,
    });

    setDeleteItemId(null);
  } catch (error) {
    console.error(error);

    toast.error(t("toastFaildDeleteItem"), {
      id: loadingToast,
    });
  }
};


const cancelDelete = () => {
  setDeleteItemId(null);
};

const deleteItem = async (id) => {
    const deleteItem = (id) => {
    setDeleteItemId(id);
    };

  const loadingToast = toast.loading(t("toastDeletingItem"));

  try {
    await axios.delete(`${API_URL}/inventory/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    await fetchInventory();
    await fetchStats();

    toast.success(t("toastItemDeleteSucc"), {
      id: loadingToast,
    });
  } catch (error) {
    console.error(error);

    toast.error(t("toastFaildDeleteItem"), {
      id: loadingToast,
    });
  }
};

    return (
        <div className="space-y-6">

            {/* Stats */}

            <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <Card>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>{t("totalItems")}</p>
                            <h2 className="text-3xl font-bold">
                                {totalItems}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-orange-100 p-3">
                            <Package className="text-orange-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>{t("totalQuantity")}</p>
                            <h2 className="text-3xl font-bold">
                                {totalQuantity}
                            </h2>
                        </div>

                        <Boxes className="text-blue-500" />
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>{t("totalCost")}</p>
                            <h2 className="text-3xl font-bold">
                                {formatIQD(totalCost)} IQD
                            </h2>
                        </div>

                        <DollarSign className="text-green-500" />
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center">
                        <div>
                            <p>{t("totalProfit")}</p>
                            <h2 className={`text-3xl font-bold ${
                                totalProfit < 0 ? "text-red-600" : ""
                            }`}>
                                {formatIQD(totalProfit)} IQD
                            </h2>
                        </div>

                        <TrendingUp className={
                            totalProfit < 0 ? "text-red-500" : "text-green-500"
                        } />
                    </div>
                </Card>

            </div>

            {/* Toolbar */}

            <Card>

                <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        }  className="flex flex-wrap items-center gap-3 justify-between">

                    <div className="flex flex-wrap items-center gap-3 flex-1">

                        <div className="relative flex-1">

                            <Search
                                size={18}
                                className="absolute left-3 top-3 text-gray-400"
                            />

                            <input
                                className="w-full h-10 pl-10 border rounded-lg px-3 text-sm"
                                placeholder={t("search")}
                                value={search}
                                onChange={e =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>

                        <select
                            className="h-10 border rounded-lg px-3 text-sm min-w-[160px]"
                            value={categoryFilter}
                            onChange={e =>
                                setCategoryFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                All Categories
                            </option>

                            {[...new Set(
                                items.map(
                                    item => item.category
                                )
                            )].map(category => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            ))}

                        </select>

                        <select
                            className="h-10 border rounded-lg px-3 text-sm min-w-[160px]"
                            value={subcategoryFilter}
                            onChange={e =>
                                setSubcategoryFilter(
                                    e.target.value
                                )
                            }
                        >
                            <option value="">
                                {t("allSubcategories")}
                            </option>

                            {SUBCATEGORY_OPTIONS.map(option => (
                                <option
                                    key={option}
                                    value={option}
                                >
                                    {option}
                                </option>
                            ))}

                        </select>

                        <select
                            className="h-10 border rounded-lg px-3 text-sm min-w-[160px]"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option value="all">
                                {t("allItems")}
                            </option>

                            <option value="out">
                                {t("outOfStock")}
                            </option>

                            <option value="low">
                                {t("lowStock")}
                            </option>

                            <option value="near">
                                {t("nearExpired")}
                            </option>

                            <option value="expired">
                                {t("expired")}
                            </option>
                        </select>

                    </div>

                    <Button
                     className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                     onClick={openAddModal}
                     >
                        {t("addItmes")}
                    </Button>

                </div>

            </Card>

            {/* Table */}

            <Card>

<div  className="overflow-hidden rounded-xl border border-orange-100">
    <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("name")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("category")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("subCatagory")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("Barcode")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("quantites")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("cost")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("price")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("supplier")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                        {t("animalType")}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                        {t("status")}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                        {t("action")}
                    </th>

                </tr>
            </thead>

            <tbody>
                {filteredItems.map((item, index) => (
                    <tr
                        key={item.id}
                        className={`
                            border-b
                            hover:bg-orange-50
                            transition-colors
                            ${index % 2 === 0 ? "bg-white" : "bg-orange-50/30"}
                        `}
                    >
                        <td className="px-4 py-3 font-medium">
                            {item.name}
                        </td>

                        <td className="px-4 py-3">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                                {item.category}
                            </span>
                        </td>

                        <td className="px-4 py-3">
                            {item.subcategory && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                    {item.subcategory}
                                </span>
                            )}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                            {item.barcode}
                        </td>

                        <td className="px-4 py-3">
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    Number(item.quantity) < 5
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700"
                                }`}
                            >
                                {item.quantity}
                            </span>
                        </td>

                        <td className="px-4 py-3">
                            {formatIQD(item.cost_price)} IQD
                            
                        </td>

                        <td className="px-4 py-3 font-semibold text-orange-600">
                            {formatIQD(item.unit_price)} IQD
                        </td>

                        <td className="px-4 py-3">
                            {item.supplier}
                        </td>

                        <td className="px-4 py-3">
                            {item.animaltype}
                        </td>

                        
                    <td className="px-4 py-3 text-center">
                        {(() => {
                            const qty = Number(item.quantity || 0);

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const expireDate = item.expire_date
                                ? new Date(item.expire_date)
                                : null;

                            if (expireDate) {
                                expireDate.setHours(0, 0, 0, 0);
                            }

                            const daysLeft = expireDate
                                ? Math.ceil(
                                    (expireDate - today) /
                                        (1000 * 60 * 60 * 24)
                                )
                                : null;

                            if (qty === 0) {
                                return (
                                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                        {t("outOfStock")}
                                    </span>
                                );
                            }

                            if (expireDate && daysLeft < 0) {
                                return (
                                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                        {t("expired")}
                                    </span>
                                );
                            }

                            if (
                                expireDate &&
                                daysLeft >= 0 &&
                                daysLeft <= 30
                            ) {
                                return (
                                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                        {t("nearExpired")}
                                    </span>
                                );
                            }

                            if (qty < 30) {
                                return (
                                    <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                        {t("lowStock")}
                                    </span>
                                );
                            }

                            return (
                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                    {t("inStock")}
                                </span>
                            );
                        })()}
                    </td>
                        <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() =>
                                        openEditModal(item)
                                    }
                                    className="rounded-lg bg-orange-100 p-2 text-orange-600 transition hover:bg-orange-200"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() =>
                                        setDeleteItemId(item.id)
                                    }
                                    className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
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
</div>

            </Card>

            {/* Modal */}

            {modalOpen && (

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingItem ? t("editItem") : t("addItem")}
                className="max-w-5xl"
            >

                                <div dir={ ["ar", "ku"].includes(i18n.language)
                                        ? "rtl"
                                        : "ltr"
                                        }
                                        className="space-y-6">

                                    {/* Basic Information */}

                                    <div>
                                        <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
                                            {t("basicInfo")}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div className="flex flex-col">
                                                <Input
                                                label={t("itemName")}
                                                className={errors.name ? "border-red-500" : ""}
                                                value={form.name}
                                                onChange={(e) => {
                                                    setForm({
                                                    ...form,
                                                    name: e.target.value,
                                                    });

                                                    setErrors({
                                                    ...errors,
                                                    name: "",
                                                    });
                                                }}
                                                />

                                                {errors.name && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.name}
                                                </p>
                                                )}

                                                </div>


                                                <div className="flex flex-col">
                                                <Input
                                                label={t("Barcode")}
                                                className={errors.barcode ? "border-red-500" : ""}
                                                value={form.barcode}
                                                onChange={(e) =>{
                                                    setForm({
                                                        ...form,
                                                        barcode: e.target.value
                                                    })

                                                    setErrors({
                                                    ...errors,
                                                    barcode: "",
                                                    });
                                                }
                                                }
                                            />

                                                    {errors.barcode && (
                                                    <p className="mt-1 text-sm text-red-500">
                                                        {errors.barcode}
                                                    </p>
                                                )}

                                            </div>

                            <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                {t("category")}
                            </label>

                            <div className="relative">
                                <input
                                    list="categories"
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            category: e.target.value
                                        })
                                    }
                                    placeholder={t("selectorTypeCatagory")}
                                    className="
                                        w-full
                                        rounded-xl
                                        border border-orange-200
                                        bg-orange-50/50
                                        px-4 py-3
                                        pr-10
                                        text-gray-700
                                        shadow-sm
                                        transition
                                        focus:border-orange-500
                                        focus:bg-white
                                        focus:ring-4
                                        focus:ring-orange-100
                                        focus:outline-none
                                    "
                                />

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500">
                                    ▼
                                </div>

                                <datalist id="categories">
                                    {categories.map(category => (
                                        <option
                                            key={category}
                                            value={category}
                                        />
                                    ))}
                                </datalist>
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                                {t("chooseCatagory")}
                            </p>
                        </div>
               
               
               <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        {t("subCatagory")}
                    </label>

                    <div className="relative">
                        <select
                            value={form.subcategory}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    subcategory: e.target.value
                                })
                            }
                            className="
                                w-full
                                appearance-none
                                rounded-xl
                                border border-orange-200
                                bg-orange-50/50
                                px-4 py-3
                                pr-10
                                text-gray-700
                                shadow-sm
                                transition
                                focus:border-orange-500
                                focus:bg-white
                                focus:ring-4
                                focus:ring-orange-100
                                focus:outline-none
                            "
                        >
                            <option value="">
                                {t("selectorTypeSubCatagory")}
                            </option>

                            {SUBCATEGORY_OPTIONS.map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>

                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-500">
                            ▼
                        </div>
                    </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {t("chooseSubcatagory")}
                    </p>
                </div>
                                        </div>
                                    </div>

                                    {/* Stock */}

                                    <div>
                                        <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
                                            {t("stockAndPrice")}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                            <div className="flex flex-col">

                                            
                                            <Input
                                                type="number"
                                                label={t("quantity")}
                                                className={errors.quantity ? "border-red-500" : ""}
                                                value={form.quantity}
                                                onChange={(e) => {
                                                    setForm({
                                                        ...form,
                                                        quantity: e.target.value
                                                    })

                                                    setErrors({
                                                    ...errors,
                                                    quantity: "",
                                                    });

                                                }
                                                }
                                            />

                                            
                                                {errors.quantity && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.quantity}
                                                </p>
                                                )}
                                                </div>


                                            <div className="flex flex-col">
                                            <Input
                                                type="number"
                                                className={errors.cost_price ? "border-red-500" : ""}
                                                label={t("costPrice")}
                                                value={form.cost_price}
                                                onChange={(e) =>{
                                                    setForm({
                                                        ...form,
                                                        cost_price: e.target.value
                                                    })
                                                    setErrors({
                                                    ...errors,
                                                    cost_price: "",
                                                    });
                                                }
                                                }
                                            />

                                                {errors.cost_price && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {errors.cost_price}
                                                </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col">
                                            <Input
                                                type="number"
                                                className={errors.unit_price ? "border-red-500" : ""}
                                                label={t("unitPrice")}
                                                value={form.unit_price}
                                                onChange={(e) =>{
                                                    setForm({
                                                        ...form,
                                                        unit_price: e.target.value
                                                    })
                                                    setErrors({
                                                    ...errors,
                                                    unit_price: "",
                                                    });
                                                }
                                                }
                                            />
                                                {errors.unit_price && (
                                                     <p className="mt-1 text-sm text-red-500">
                                                {errors.unit_price}
                                                </p>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Dates */}

                                    <div>
                                        <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
                                            {t("dates")}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    {t("itemDate")}
                                                </label>

                                                <div className="flex flex-col">

                                                <input
                                                    type="date"
                                                    className={`w-full rounded-lg border p-3 focus:border-orange-500 focus:outline-none ${
                                                    errors.item_date ? "border-red-500" : "border-gray-300"
                                                    }`}
                                                    value={form.item_date}
                                                    onChange={(e) =>{
                                                        setForm({
                                                            ...form,
                                                            item_date: e.target.value
                                                        })

                                                        setErrors({
                                                        ...errors,
                                                        item_date: "",
                                                        });
                                                    }
                                                    }
                                                />

                                                 {errors.item_date && (
                                                     <p className="mt-1 text-sm text-red-500">
                                                {errors.item_date}
                                                </p>
                                                )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    {t("expireDate")}
                                                </label>

                                                <div className="flex flex-col">
                                                <input
                                                    type="date"
                                                    className={`w-full rounded-lg border p-3 focus:border-orange-500 focus:outline-none ${
                                                    errors.expire_date ? "border-red-500" : "border-gray-300"
                                                    }`}
                                                    value={form.expire_date}
                                                    onChange={(e) =>{
                                                        setForm({
                                                            ...form,
                                                            expire_date: e.target.value
                                                        })
                                                        setErrors({
                                                        ...errors,
                                                        expire_date: "",
                                                        });
                                                    }
                                                    }
                                                />

                                                {errors.expire_date && (
                                                     <p className="mt-1 text-sm text-red-500">
                                                {errors.expire_date}
                                                </p>
                                                )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    {/* Other Information */}

                                    <div>
                                        <h3 className="mb-3 border-b pb-2 text-lg font-semibold text-orange-600">
                                            {t("otherInfo")}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                          <div>
                                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                                    {t("supplier")}
                                                </label>

                                                <select
                                                    value={form.supplier}
                                                    onChange={(e) => {
                                                        const supplierName = e.target.value;

                                                        const selectedSupplier = suppliers.find(
                                                            (s) => s.name === supplierName
                                                        );

                                                        setForm({
                                                            ...form,
                                                            supplier: supplierName,
                                                            location: selectedSupplier?.location || "",
                                                        });
                                                    }}
                                                    className="
                                                        w-full
                                                        rounded-xl
                                                        border border-orange-200
                                                        bg-orange-50/50
                                                        px-4 py-3
                                                        text-gray-700
                                                        shadow-sm
                                                        transition
                                                        focus:border-orange-500
                                                        focus:bg-white
                                                        focus:ring-4
                                                        focus:ring-orange-100
                                                        focus:outline-none
                                                    "
                                                >
                                                    <option value="">{t("selectSupplier")}</option>

                                                    {suppliers.map((s) => (
                                                        <option key={s.id} value={s.name}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                                <Input
                                                    label={t("location")}
                                                    value={form.location}
                                                    disabled
                                                />

                                            <Input
                                                label={t("animalType")}
                                                value={form.animaltype}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        animaltype: e.target.value
                                                    })
                                                }
                                            />

                                        </div>

                                        <div className="mt-4">

                                            <label className="mb-1 block text-sm font-medium">
                                                {t("note")}
                                            </label>

                                            <textarea
                                                rows={4}
                                                className="w-full rounded-lg border border-gray-300 p-3 focus:border-orange-500 focus:outline-none"
                                                value={form.notes}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        notes: e.target.value
                                                    })
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                    <div className="mt-8 flex justify-end gap-3 border-t pt-4">

                        <Button
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                        >
                            {t("cancel")}
                        </Button>

                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={saveItem}
                        >
                            {editingItem ? t("updateItem") : t("saveItem")}
                        </Button>

                    </div>

                </Modal>






            )}

            {deleteItemId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

      <h2 className="text-xl font-bold text-gray-800">
        {t("deleteItem") || "Delete Item"}
      </h2>

      <p className="mt-2 text-gray-600">
        {t("deleteItemMessage") || "Are you sure you want to delete this item? This action cannot be undone."}
      </p>

      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={cancelDelete}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          {t("cancel")}
        </button>

        <button
          onClick={confirmDeleteItem}
          disabled={deleteLoading}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
        >
          {deleteLoading ? "Deleting..." : t("delete")}
        </button>

      </div>
    </div>
  </div>
)}

        </div>
    );
}