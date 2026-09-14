import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import { Search, Pencil, Trash2, Plus, Minus, Receipt } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DEPARTMENTS = ["Shop", "Clinic", "Salon"];

// Departments that are actually managed from the Rooms page (check-in /
// check-out / stay-based billing) rather than as ad-hoc sales here.
const ROOM_BASED_DEPARTMENTS = ["Hospital", "Hotel"];

// Hospital and Clinic bills are charged per day of stay/treatment
const usesDays = (dept) => dept === "Hospital" || dept === "Clinic" || dept === "Hotel";

export default function Sales() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- Sales list ----------

    const [bills, setBills] = useState([]);
    const [loadingBills, setLoadingBills] = useState(true);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");

    const [inventory, setInventory] = useState([]);

    const fetchAllBills = async () => {
        setLoadingBills(true);
        try {
            const res = await axios.get(`${API_URL}/bills`, {
                params: { limit: 300 },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setBills(res.data);
        } catch (error) {
            console.error("Bills Error:", error);
            toast.error(t("toastFailLoadBills") || "Failed to load sales");
        } finally {
            setLoadingBills(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setInventory(res.data);
        } catch (error) {
            console.error("Inventory Error:", error);
        }
    };

    useEffect(() => {
        fetchAllBills();
        fetchInventory();
    }, []);

    const inventoryMap = useMemo(() => {
        const map = {};
        inventory.forEach((i) => (map[i.id] = i));
        return map;
    }, [inventory]);

    const filteredBills = useMemo(() => {
        // Hotel and Hospital bills are generated from room check-ins/
        // check-outs and managed on the Rooms page — they're intentionally
        // excluded from this table regardless of the department filter.
        let list = bills.filter(
            (b) => !ROOM_BASED_DEPARTMENTS.includes(b.department)
        );

        if (deptFilter !== "All") {
            list = list.filter((b) => b.department === deptFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (b) =>
                    String(b.id).includes(q) ||
                    (b.customer_name || "").toLowerCase().includes(q) ||
                    (b.customer_phone || "").toLowerCase().includes(q)
            );
        }

        return list;
    }, [bills, deptFilter, search]);

    // Hospital and Hotel sales are generated from room check-ins/outs, so
    // picking either department here sends the user straight to the
    // Rooms page instead of just filtering this table.
    const handleDeptFilterChange = (value) => {
        if (ROOM_BASED_DEPARTMENTS.includes(value)) {
            navigate("/rooms");
            return;
        }

        setDeptFilter(value);
    };

    // ---------- Edit flow ----------

    const [editingBill, setEditingBill] = useState(null);
    // { id, department, customerName, customerPhone, discount, paymentMethod, days, cart: [...] }
    const [originalItemsMap, setOriginalItemsMap] = useState({}); // inventoryId -> qty this bill originally used
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [addItemSearch, setAddItemSearch] = useState("");

    const openEdit = async (billId) => {
        setLoadingEdit(true);
        setEditingBill({}); // open the modal immediately with a loading state

        try {
            const res = await axios.get(`${API_URL}/bills/${billId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            const { bill, items } = res.data;

            const cart = items.map((it) => ({
                inventoryId: it.inventory_id,
                name: it.item_name,
                unit_price: Number(it.unit_price),
                quantity: Number(it.quantity),
            }));

            const origMap = {};
            cart.forEach((c) => {
                origMap[c.inventoryId] = c.quantity;
            });

            setOriginalItemsMap(origMap);
            setAddItemSearch("");

            setEditingBill({
                id: bill.id,
                department: bill.department,
                customerName: bill.customer_name || "",
                customerPhone: bill.customer_phone || "",
                discount: bill.discount || 0,
                paymentMethod: bill.payment_method || "cash",
                days: bill.days || 1,
                cart,
            });
        } catch (error) {
            console.error(error);
            toast.error(t("toastFailLoadBill") || "Failed to load sale");
            setEditingBill(null);
        } finally {
            setLoadingEdit(false);
        }
    };

    const closeEdit = () => {
        setEditingBill(null);
        setOriginalItemsMap({});
    };

    // While editing, an item can go up to its current stock PLUS
    // whatever this bill already had allocated to it (since the
    // backend restores that amount before re-applying the edit).
    const maxQtyFor = (inventoryId) => {
        const currentStock = Number(inventoryMap[inventoryId]?.quantity || 0);
        const original = originalItemsMap[inventoryId] || 0;
        return currentStock + original;
    };

    const updateEditField = (patch) => {
        setEditingBill((prev) => ({ ...prev, ...patch }));
    };

    const changeEditQty = (inventoryId, delta) => {
        setEditingBill((prev) => ({
            ...prev,
            cart: prev.cart
                .map((c) => {
                    if (c.inventoryId !== inventoryId) return c;

                    const next = c.quantity + delta;
                    const max = maxQtyFor(inventoryId);

                    if (next > max) {
                        toast.error(
                            t("basketNoMoreStock") || "No more stock available"
                        );
                        return c;
                    }

                    return { ...c, quantity: next };
                })
                .filter((c) => c.quantity > 0),
        }));
    };

    const removeEditItem = (inventoryId) => {
        setEditingBill((prev) => ({
            ...prev,
            cart: prev.cart.filter((c) => c.inventoryId !== inventoryId),
        }));
    };

    const addEditItem = (item) => {
        setEditingBill((prev) => {
            const existing = prev.cart.find((c) => c.inventoryId === item.id);

            if (existing) {
                const max = maxQtyFor(item.id);
                if (existing.quantity >= max) {
                    toast.error(
                        t("basketNoMoreStock") || "No more stock available"
                    );
                    return prev;
                }

                return {
                    ...prev,
                    cart: prev.cart.map((c) =>
                        c.inventoryId === item.id
                            ? { ...c, quantity: c.quantity + 1 }
                            : c
                    ),
                };
            }

            return {
                ...prev,
                cart: [
                    ...prev.cart,
                    {
                        inventoryId: item.id,
                        name: item.name,
                        unit_price: Number(item.unit_price),
                        quantity: 1,
                    },
                ],
            };
        });
    };

    const addItemResults = useMemo(() => {
        if (!editingBill?.cart || !addItemSearch.trim()) return [];

        const q = addItemSearch.toLowerCase();

        return inventory
            .filter(
                (i) =>
                    (i.name || "").toLowerCase().includes(q) &&
                    !editingBill.cart.some((c) => c.inventoryId === i.id)
            )
            .slice(0, 6);
    }, [inventory, addItemSearch, editingBill]);

    const editDayCount =
        editingBill?.department && usesDays(editingBill.department)
            ? Math.max(1, Number(editingBill.days) || 1)
            : 1;

    const editPerDaySubtotal = useMemo(() => {
        if (!editingBill?.cart) return 0;
        return editingBill.cart.reduce(
            (sum, c) => sum + c.unit_price * c.quantity,
            0
        );
    }, [editingBill]);

    const editSubtotal = editPerDaySubtotal * editDayCount;
    const editDiscountValue = editingBill ? Number(editingBill.discount) || 0 : 0;
    const editTotal = Math.max(0, editSubtotal - editDiscountValue);

    const saveEdit = async () => {
        if (!editingBill?.cart) return;

        if (editingBill.cart.length === 0) {
            toast.error(t("basketEmpty") || "A sale must have at least one item");
            return;
        }

        setSavingEdit(true);
        const loadingToast = toast.loading(
            t("toastSavingBill") || "Saving changes..."
        );

        try {
            await axios.put(
                `${API_URL}/bills/${editingBill.id}`,
                {
                    department: editingBill.department,
                    customerName: editingBill.customerName,
                    customerPhone: editingBill.customerPhone,
                    discount: editDiscountValue,
                    paymentMethod: editingBill.paymentMethod,
                    days: editDayCount,
                    items: editingBill.cart.map((c) => ({
                        inventoryId: c.inventoryId,
                        name: c.name,
                        unitPrice: c.unit_price,
                        quantity: c.quantity,
                    })),
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(t("toastBillUpdated") || "Sale updated", {
                id: loadingToast,
            });

            closeEdit();
            await fetchAllBills();
            await fetchInventory();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastBillFailed") ||
                    "Failed to update sale",
                { id: loadingToast }
            );
        } finally {
            setSavingEdit(false);
        }
    };

    // ---------- Delete flow ----------

    const [deletingId, setDeletingId] = useState(null);

    const deleteBill = async (id) => {
        setDeletingId(id);

        try {
            await axios.delete(`${API_URL}/bills/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            toast.success(
                t("toastBillDeleted") || "Sale deleted and stock restored"
            );

            await fetchAllBills();
            await fetchInventory();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastDeleteFailed") ||
                    "Failed to delete sale"
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Receipt size={20} className="text-orange-500" />
                        {t("allSales") || "All Sales"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={deptFilter}
                            onChange={(e) => handleDeptFilterChange(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                        >
                            <option value="All">
                                {t("allDepartments") || "All departments"}
                            </option>
                            {DEPARTMENTS.map((d) => (
                                <option key={d} value={d}>
                                    {t(`department${d}`) || d}
                                </option>
                            ))}
                        </select>

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-3 text-gray-400"
                            />
                            <input
                                className="h-10 w-56 pl-9 pr-3 border rounded-lg text-sm outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                                placeholder={t("searchBills") || "Search bills..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                {loadingBills ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : filteredBills.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("basketNoBillsYet") || "No sales found"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">{t("bill") || "Bill"}</th>
                                    <th className="py-2 pr-4">
                                        {t("department") || "Department"}
                                    </th>
                                    <th className="py-2 pr-4">
                                        {t("customers") || "Customer"}
                                    </th>
                                    <th className="py-2 pr-4">{t("total") || "Total"}</th>
                                    <th className="py-2 pr-4">
                                        {t("payment") || "Payment"}
                                    </th>
                                    <th className="py-2 pr-4">{t("dates") || "Date"}</th>
                                    <th className="py-2 pr-4 text-right">
                                        {t("action") || "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBills.map((bill) => (
                                    <tr key={bill.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium">
                                            #{String(bill.id).padStart(5, "0")}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {t(`department${bill.department}`) ||
                                                bill.department}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {bill.customer_name || "-"}
                                        </td>
                                        <td className="py-2 pr-4 font-semibold text-orange-600">
                                            {formatIQD(bill.total)} IQD
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600 capitalize">
                                            {bill.payment_method}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-500">
                                            {new Date(bill.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(bill.id)}
                                                    className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                                                    title={t("edit") || "Edit"}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                t("confirmDeleteBill") ||
                                                                    "Delete this sale and restore its stock?"
                                                            )
                                                        ) {
                                                            deleteBill(bill.id);
                                                        }
                                                    }}
                                                    disabled={deletingId === bill.id}
                                                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                                    title={t("delete") || "Delete"}
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
                )}
            </Card>

            {/* Edit modal */}
            {editingBill && (
                <Modal
                    open={!!editingBill}
                    onClose={closeEdit}
                    title={
                        editingBill.id
                            ? `${t("editSale") || "Edit sale"} #${String(
                                  editingBill.id
                              ).padStart(5, "0")}`
                            : t("editSale") || "Edit sale"
                    }
                    className="max-w-lg"
                >
                    {loadingEdit || !editingBill.cart ? (
                        <p className="text-center text-gray-400 py-10">
                            {t("loading") || "Loading..."}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label={t("customerNameOptional") || "Customer name"}
                                    value={editingBill.customerName}
                                    onChange={(e) =>
                                        updateEditField({ customerName: e.target.value })
                                    }
                                />
                                <Input
                                    label={t("customerPhoneOptional") || "Phone"}
                                    value={editingBill.customerPhone}
                                    onChange={(e) =>
                                        updateEditField({ customerPhone: e.target.value })
                                    }
                                />
                            </div>

                            {usesDays(editingBill.department) && (
                                <Input
                                    type="number"
                                    min="1"
                                    label={t("numberOfDays") || "Number of days"}
                                    value={editingBill.days}
                                    onChange={(e) =>
                                        updateEditField({ days: e.target.value })
                                    }
                                />
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="number"
                                    label={t("discountIQD") || "Discount (IQD)"}
                                    value={editingBill.discount}
                                    onChange={(e) =>
                                        updateEditField({ discount: e.target.value })
                                    }
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        {t("payment") || "Payment"}
                                    </label>
                                    <select
                                        value={editingBill.paymentMethod}
                                        onChange={(e) =>
                                            updateEditField({
                                                paymentMethod: e.target.value,
                                            })
                                        }
                                        className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                                    >
                                        <option value="cash">
                                            {t("cash") || "Cash"}
                                        </option>
                                        <option value="card">
                                            {t("card") || "Card"}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Line items */}
                            <div className="border-t pt-3 space-y-2">
                                {editingBill.cart.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        {t("basketEmpty") || "No items in this sale"}
                                    </p>
                                ) : (
                                    editingBill.cart.map((c) => (
                                        <div
                                            key={c.inventoryId}
                                            className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-800">
                                                    {c.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatIQD(c.unit_price)} IQD
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() =>
                                                        changeEditQty(c.inventoryId, -1)
                                                    }
                                                    className="rounded-md bg-white border p-1 hover:bg-gray-100"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-6 text-center text-sm font-semibold">
                                                    {c.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        changeEditQty(c.inventoryId, 1)
                                                    }
                                                    className="rounded-md bg-white border p-1 hover:bg-gray-100"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        removeEditItem(c.inventoryId)
                                                    }
                                                    className="ml-1 rounded-md p-1 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add item */}
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute left-2.5 top-3 text-gray-400"
                                />
                                <input
                                    className="w-full h-9 pl-7 pr-2 border rounded-md text-xs outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                                    placeholder={t("addItemPlaceholder") || "Add an item..."}
                                    value={addItemSearch}
                                    onChange={(e) => setAddItemSearch(e.target.value)}
                                />

                                {addItemResults.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                                        {addItemResults.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    addEditItem(item);
                                                    setAddItemSearch("");
                                                }}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-orange-50"
                                            >
                                                <span>{item.name}</span>
                                                <span className="text-xs text-gray-400">
                                                    {t("stock") || "Stock"}: {item.quantity}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-3 space-y-1 text-sm">
                                {usesDays(editingBill.department) && editDayCount > 1 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>
                                            {formatIQD(editPerDaySubtotal)} IQD ×{" "}
                                            {editDayCount} {t("days") || "days"}
                                        </span>
                                        <span>{formatIQD(editSubtotal)} IQD</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-500">
                                    <span>{t("subtotal") || "Subtotal"}</span>
                                    <span>{formatIQD(editSubtotal)} IQD</span>
                                </div>

                                {editDiscountValue > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>{t("discount") || "Discount"}</span>
                                        <span>-{formatIQD(editDiscountValue)} IQD</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>{t("total") || "Total"}</span>
                                    <span className="text-orange-600">
                                        {formatIQD(editTotal)} IQD
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="secondary" onClick={closeEdit}>
                                    {t("cancel") || "Cancel"}
                                </Button>
                                <Button
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={saveEdit}
                                    disabled={savingEdit}
                                >
                                    {savingEdit
                                        ? t("saving") || "Saving..."
                                        : t("saveChanges") || "Save changes"}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}