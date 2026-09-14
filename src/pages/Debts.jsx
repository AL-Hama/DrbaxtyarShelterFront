import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import {
    Search,
    Pencil,
    Trash2,
    Plus,
    Minus,
    Wallet,
    CheckCircle2,
    HandCoins,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const DEPARTMENTS = ["Shop", "Clinic", "Salon", "Hotel", "Hospital"];
const STATUSES = ["unpaid", "partial", "paid"];

const usesDays = (dept) => dept === "Hospital" || dept === "Clinic" || dept === "Hotel";

const STATUS_STYLES = {
    unpaid: "bg-red-100 text-red-700",
    partial: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
};

export default function Debts() {
    const { t } = useTranslation();

    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- List ----------

    const [debts, setDebts] = useState([]);
    const [loadingDebts, setLoadingDebts] = useState(true);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [summary, setSummary] = useState(null);

    const [inventory, setInventory] = useState([]);

    const fetchDebts = async () => {
        setLoadingDebts(true);
        try {
            const res = await axios.get(`${API_URL}/debts`, {
                params: {
                    limit: 500,
                    status: statusFilter,
                    department: deptFilter,
                    search: search.trim() || undefined,
                },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setDebts(res.data);
        } catch (error) {
            console.error("Debts Error:", error);
            toast.error(t("toastFailLoadDebts") || "Failed to load debts");
        } finally {
            setLoadingDebts(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${API_URL}/debts/summary`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setSummary(res.data);
        } catch (error) {
            console.error("Debt Summary Error:", error);
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
        fetchInventory();
    }, []);

    // Refetch whenever a filter changes (debounced on search)
    useEffect(() => {
        const handle = setTimeout(() => {
            fetchDebts();
            fetchSummary();
        }, 250);

        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, deptFilter, statusFilter]);

    // ---------- Pay flow ----------

    const [payingDebt, setPayingDebt] = useState(null); // debt row
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState("cash");
    const [payingSubmitting, setPayingSubmitting] = useState(false);

    const openPay = (debt) => {
        setPayingDebt(debt);
        setPayAmount(String(Number(debt.remaining_amount) || ""));
        setPayMethod("cash");
    };

    const closePay = () => {
        setPayingDebt(null);
        setPayAmount("");
    };

    const submitPay = async () => {
        if (!payingDebt) return;

        const amount = Number(payAmount);

        if (!amount || amount <= 0) {
            toast.error(t("enterValidAmount") || "Enter a valid payment amount");
            return;
        }

        if (amount > Number(payingDebt.remaining_amount) + 0.01) {
            toast.error(
                t("paymentExceedsDebt") || "Payment cannot exceed the remaining debt"
            );
            return;
        }

        setPayingSubmitting(true);
        const loadingToast = toast.loading(t("savingPayment") || "Saving payment...");

        try {
            await axios.post(
                `${API_URL}/debts/${payingDebt.id}/pay`,
                { amount, paymentMethod: payMethod },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(t("toastPaymentSaved") || "Payment recorded", {
                id: loadingToast,
            });

            closePay();
            await fetchDebts();
            await fetchSummary();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastPaymentFailed") ||
                    "Failed to record payment",
                { id: loadingToast }
            );
        } finally {
            setPayingSubmitting(false);
        }
    };

    // ---------- Edit flow ----------

    const inventoryMap = useMemo(() => {
        const map = {};
        inventory.forEach((i) => (map[i.id] = i));
        return map;
    }, [inventory]);

    const [editingDebt, setEditingDebt] = useState(null);
    const [originalItemsMap, setOriginalItemsMap] = useState({});
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [addItemSearch, setAddItemSearch] = useState("");

    const openEdit = async (debtId) => {
        setLoadingEdit(true);
        setEditingDebt({});

        try {
            const res = await axios.get(`${API_URL}/debts/${debtId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            const { debt, items } = res.data;

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

            setEditingDebt({
                id: debt.id,
                department: debt.department,
                customerName: debt.customer_name || "",
                customerPhone: debt.customer_phone || "",
                discount: debt.discount || 0,
                days: debt.days || 1,
                notes: debt.notes || "",
                amountPaid: Number(debt.amount_paid) || 0,
                cart,
            });
        } catch (error) {
            console.error(error);
            toast.error(t("toastFailLoadDebt") || "Failed to load debt");
            setEditingDebt(null);
        } finally {
            setLoadingEdit(false);
        }
    };

    const closeEdit = () => {
        setEditingDebt(null);
        setOriginalItemsMap({});
    };

    // Same headroom logic as Sales.jsx edit: current stock plus
    // whatever this debt already had allocated to it.
    const maxQtyFor = (inventoryId) => {
        const currentStock = Number(inventoryMap[inventoryId]?.quantity || 0);
        const original = originalItemsMap[inventoryId] || 0;
        return currentStock + original;
    };

    const updateEditField = (patch) => {
        setEditingDebt((prev) => ({ ...prev, ...patch }));
    };

    const changeEditQty = (inventoryId, delta) => {
        setEditingDebt((prev) => ({
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
        setEditingDebt((prev) => ({
            ...prev,
            cart: prev.cart.filter((c) => c.inventoryId !== inventoryId),
        }));
    };

    const addEditItem = (item) => {
        setEditingDebt((prev) => {
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
        if (!editingDebt?.cart || !addItemSearch.trim()) return [];

        const q = addItemSearch.toLowerCase();

        return inventory
            .filter(
                (i) =>
                    (i.name || "").toLowerCase().includes(q) &&
                    !editingDebt.cart.some((c) => c.inventoryId === i.id)
            )
            .slice(0, 6);
    }, [inventory, addItemSearch, editingDebt]);

    const editDayCount =
        editingDebt?.department && usesDays(editingDebt.department)
            ? Math.max(1, Number(editingDebt.days) || 1)
            : 1;

    const editPerDaySubtotal = useMemo(() => {
        if (!editingDebt?.cart) return 0;
        return editingDebt.cart.reduce(
            (sum, c) => sum + c.unit_price * c.quantity,
            0
        );
    }, [editingDebt]);

    const editSubtotal = editPerDaySubtotal * editDayCount;
    const editDiscountValue = editingDebt ? Number(editingDebt.discount) || 0 : 0;
    const editTotal = Math.max(0, editSubtotal - editDiscountValue);
    const editRemaining = editingDebt
        ? Math.max(0, editTotal - Number(editingDebt.amountPaid || 0))
        : 0;

    const saveEdit = async () => {
        if (!editingDebt?.cart) return;

        if (!editingDebt.customerName?.trim()) {
            toast.error(t("customerNameRequiredShort") || "Customer name is required");
            return;
        }

        if (editingDebt.cart.length === 0) {
            toast.error(t("basketEmpty") || "A debt must have at least one item");
            return;
        }

        setSavingEdit(true);
        const loadingToast = toast.loading(t("toastSavingBill") || "Saving changes...");

        try {
            await axios.put(
                `${API_URL}/debts/${editingDebt.id}`,
                {
                    department: editingDebt.department,
                    customerName: editingDebt.customerName,
                    customerPhone: editingDebt.customerPhone,
                    discount: editDiscountValue,
                    days: editDayCount,
                    notes: editingDebt.notes,
                    items: editingDebt.cart.map((c) => ({
                        inventoryId: c.inventoryId,
                        name: c.name,
                        unitPrice: c.unit_price,
                        quantity: c.quantity,
                    })),
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(t("toastBillUpdated") || "Debt updated", {
                id: loadingToast,
            });

            closeEdit();
            await fetchDebts();
            await fetchSummary();
            await fetchInventory();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastBillFailed") ||
                    "Failed to update debt",
                { id: loadingToast }
            );
        } finally {
            setSavingEdit(false);
        }
    };

    // ---------- Delete flow ----------

    const [deletingId, setDeletingId] = useState(null);

    const deleteDebt = async (id) => {
        setDeletingId(id);

        try {
            await axios.delete(`${API_URL}/debts/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            toast.success(
                t("toastBillDeleted") || "Debt deleted and stock restored"
            );

            await fetchDebts();
            await fetchSummary();
            await fetchInventory();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastDeleteFailed") ||
                    "Failed to delete debt"
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                        {t("openDebts") || "Open debts"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {summary ? Number(summary.open_count) : "-"}
                    </p>
                </Card>
                <Card>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                        {t("totalOutstanding") || "Total outstanding"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-red-600">
                        {summary ? formatIQD(summary.total_outstanding) : "-"} IQD
                    </p>
                </Card>
                <Card>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                        {t("fullyPaidDebts") || "Fully paid debts"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-600">
                        {summary ? Number(summary.paid_count) : "-"}
                    </p>
                </Card>
            </div>

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <HandCoins size={20} className="text-red-500" />
                        {t("customerDebts") || "Customer Debts"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                        >
                            <option value="All">{t("allStatuses") || "All statuses"}</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {t(`debtStatus${s}`) || s}
                                </option>
                            ))}
                        </select>

                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
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
                                placeholder={t("searchDebts") || "Search by name or phone..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                {loadingDebts ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : debts.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("noDebtsFound") || "No debts found"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">{t("bill") || "#"}</th>
                                    <th className="py-2 pr-4">
                                        {t("customers") || "Customer"}
                                    </th>
                                    <th className="py-2 pr-4">
                                        {t("department") || "Department"}
                                    </th>
                                    <th className="py-2 pr-4">{t("total") || "Total"}</th>
                                    <th className="py-2 pr-4">{t("paid") || "Paid"}</th>
                                    <th className="py-2 pr-4">
                                        {t("remaining") || "Remaining"}
                                    </th>
                                    <th className="py-2 pr-4">{t("status") || "Status"}</th>
                                    <th className="py-2 pr-4">{t("dates") || "Date"}</th>
                                    <th className="py-2 pr-4 text-right">
                                        {t("action") || "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {debts.map((debt) => (
                                    <tr key={debt.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium">
                                            #{String(debt.id).padStart(5, "0")}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-700">
                                            <p className="font-medium">
                                                {debt.customer_name}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {debt.customer_phone || "-"}
                                            </p>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {t(`department${debt.department}`) ||
                                                debt.department}
                                        </td>
                                        <td className="py-2 pr-4 font-semibold text-gray-800">
                                            {formatIQD(debt.total)} IQD
                                        </td>
                                        <td className="py-2 pr-4 text-green-600">
                                            {formatIQD(debt.amount_paid)} IQD
                                        </td>
                                        <td className="py-2 pr-4 font-semibold text-red-600">
                                            {formatIQD(debt.remaining_amount)} IQD
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[debt.status]}`}
                                            >
                                                {t(`debtStatus${debt.status}`) || debt.status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-500">
                                            {new Date(debt.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <div className="flex justify-end gap-2">
                                                {debt.status !== "paid" && (
                                                    <button
                                                        onClick={() => openPay(debt)}
                                                        className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                                                        title={t("payDebt") || "Pay"}
                                                    >
                                                        <Wallet size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => openEdit(debt.id)}
                                                    className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                                                    title={t("edit") || "Edit"}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                t("confirmDeleteDebt") ||
                                                                    "Delete this debt and restore its stock?"
                                                            )
                                                        ) {
                                                            deleteDebt(debt.id);
                                                        }
                                                    }}
                                                    disabled={deletingId === debt.id}
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

            {/* Pay modal */}
            {payingDebt && (
                <Modal
                    open={!!payingDebt}
                    onClose={closePay}
                    title={`${t("payDebt") || "Pay debt"} #${String(
                        payingDebt.id
                    ).padStart(5, "0")}`}
                    className="max-w-sm"
                >
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    {t("customer") || "Customer"}
                                </span>
                                <span className="font-medium">
                                    {payingDebt.customer_name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    {t("total") || "Total"}
                                </span>
                                <span>{formatIQD(payingDebt.total)} IQD</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    {t("paid") || "Paid so far"}
                                </span>
                                <span>{formatIQD(payingDebt.amount_paid)} IQD</span>
                            </div>
                            <div className="flex justify-between font-semibold text-red-600">
                                <span>{t("remaining") || "Remaining"}</span>
                                <span>
                                    {formatIQD(payingDebt.remaining_amount)} IQD
                                </span>
                            </div>
                        </div>

                        <Input
                            type="number"
                            min="0"
                            max={payingDebt.remaining_amount}
                            label={t("paymentAmount") || "Payment amount (IQD)"}
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                        />

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                {t("payment") || "Payment method"}
                            </label>
                            <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value)}
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            >
                                <option value="cash">{t("cash") || "Cash"}</option>
                                <option value="card">{t("card") || "Card"}</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={closePay}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                onClick={submitPay}
                                disabled={payingSubmitting}
                            >
                                <CheckCircle2 size={16} />
                                {payingSubmitting
                                    ? t("processing") || "Processing..."
                                    : t("confirmPayment") || "Confirm payment"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit modal */}
            {editingDebt && (
                <Modal
                    open={!!editingDebt}
                    onClose={closeEdit}
                    title={
                        editingDebt.id
                            ? `${t("editDebt") || "Edit debt"} #${String(
                                  editingDebt.id
                              ).padStart(5, "0")}`
                            : t("editDebt") || "Edit debt"
                    }
                    className="max-w-lg"
                >
                    {loadingEdit || !editingDebt.cart ? (
                        <p className="text-center text-gray-400 py-10">
                            {t("loading") || "Loading..."}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label={t("customerNameRequired") || "Customer name"}
                                    value={editingDebt.customerName}
                                    onChange={(e) =>
                                        updateEditField({ customerName: e.target.value })
                                    }
                                />
                                <Input
                                    label={t("customerPhoneOptional") || "Phone"}
                                    value={editingDebt.customerPhone}
                                    onChange={(e) =>
                                        updateEditField({ customerPhone: e.target.value })
                                    }
                                />
                            </div>

                            {usesDays(editingDebt.department) && (
                                <Input
                                    type="number"
                                    min="1"
                                    label={t("numberOfDays") || "Number of days"}
                                    value={editingDebt.days}
                                    onChange={(e) =>
                                        updateEditField({ days: e.target.value })
                                    }
                                />
                            )}

                            <Input
                                type="number"
                                label={t("discountIQD") || "Discount (IQD)"}
                                value={editingDebt.discount}
                                onChange={(e) =>
                                    updateEditField({ discount: e.target.value })
                                }
                            />

                            {/* Line items */}
                            <div className="border-t pt-3 space-y-2">
                                {editingDebt.cart.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        {t("basketEmpty") || "No items in this debt"}
                                    </p>
                                ) : (
                                    editingDebt.cart.map((c) => (
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
                                {usesDays(editingDebt.department) && editDayCount > 1 && (
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

                                <div className="flex justify-between text-gray-500">
                                    <span>{t("paid") || "Already paid"}</span>
                                    <span>
                                        {formatIQD(editingDebt.amountPaid)} IQD
                                    </span>
                                </div>

                                <div className="flex justify-between font-semibold text-red-600">
                                    <span>{t("remaining") || "Remaining"}</span>
                                    <span>{formatIQD(editRemaining)} IQD</span>
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