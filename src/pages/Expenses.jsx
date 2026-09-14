import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

import {
    Wallet,
    Users,
    DollarSign,
    Plus,
    Trash2,
    Receipt,
    Package,
    Search,
    X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Flat category list: general spend types plus one category per
// department. Kept flat (no sub-categories) so every option has a
// real translation via the existing expenseCategory* keys.
const CATEGORIES = [
    "Rent",
    "Utilities",
    "Maintenance",
    "Transport",
    "Salaries",
    "Other",
    "Shop",
    "Clinic",
    "Hospital",
    "Hotel",
    "Salon",
];

function StatTile({ icon: Icon, label, value, sub, bg, border, iconBg, text }) {
    return (
        <div className={`flex items-center gap-3 rounded-2xl border ${border} ${bg} p-4`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon size={20} className={text} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className={`text-xl font-bold ${text} truncate`}>{value}</p>
                {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
            </div>
        </div>
    );
}

export default function Expenses() {
    const { t } = useTranslation();

    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- Expenses list ----------

    const [expenses, setExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);

    const fetchExpenses = async () => {
        setLoadingExpenses(true);
        try {
            const res = await axios.get(`${API_URL}/expenses`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setExpenses(res.data);
        } catch (error) {
            console.error("Expenses Error:", error);
            toast.error(t("toastFailLoadExpenses") || "Failed to load expenses");
        } finally {
            setLoadingExpenses(false);
        }
    };

    // ---------- Staff salaries (auto-fetched, not stored as an expense row) ----------

    const [staff, setStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(true);

    const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStaff(res.data);
        } catch (error) {
            console.error("Staff Error:", error);
        } finally {
            setLoadingStaff(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchStaff();
    }, []);

    const manualTotal = useMemo(
        () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
        [expenses]
    );

    const salaryTotal = useMemo(
        () => staff.reduce((sum, s) => sum + Number(s.salary || 0), 0),
        [staff]
    );

    const grandTotal = manualTotal + salaryTotal;

    // ---------- Add expense form ----------

    const today = new Date().toISOString().split("T")[0];

    const [description, setDescription] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [amount, setAmount] = useState("");
    const [expenseDate, setExpenseDate] = useState(today);
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setDescription("");
        setCategory(CATEGORIES[0]);
        setAmount("");
        setExpenseDate(today);
    };

    const addExpense = async () => {
        if (!description.trim() || !amount || Number(amount) <= 0) {
            toast.error(
                t("toastExpenseInvalid") ||
                    "Enter a description and a valid amount"
            );
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(
                `${API_URL}/expenses`,
                {
                    description: description.trim(),
                    category,
                    amount: Number(amount),
                    expenseDate,
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(t("toastExpenseAdded") || "Expense added");
            resetForm();
            fetchExpenses();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastExpenseFailed") ||
                    "Failed to add expense"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ---------- Delete ----------

    const [deletingId, setDeletingId] = useState(null);

    const deleteExpense = async (id) => {
        setDeletingId(id);
        try {
            await axios.delete(`${API_URL}/expenses/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            toast.success(t("toastExpenseDeleted") || "Expense deleted");
            fetchExpenses();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastExpenseDeleteFailed") ||
                    "Failed to delete expense"
            );
        } finally {
            setDeletingId(null);
        }
    };

    // ---------- Fetch item from inventory (auto-fill description/amount) ----------

    const [showInventoryPanel, setShowInventoryPanel] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [inventorySearch, setInventorySearch] = useState("");
    const [pickedItem, setPickedItem] = useState(null); // item currently being configured
    const [pickedQty, setPickedQty] = useState(1);

    const fetchInventoryItems = async () => {
        setLoadingInventory(true);
        try {
            const res = await axios.get(`${API_URL}/inventory`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setInventoryItems(res.data);
        } catch (error) {
            console.error("Inventory Error:", error);
            toast.error(t("toastFailLoadInventory") || "Failed to load inventory");
        } finally {
            setLoadingInventory(false);
        }
    };

    const openInventoryPanel = () => {
        setShowInventoryPanel(true);
        setPickedItem(null);
        setPickedQty(1);
        if (inventoryItems.length === 0) {
            fetchInventoryItems();
        }
    };

    const closeInventoryPanel = () => {
        setShowInventoryPanel(false);
        setPickedItem(null);
        setPickedQty(1);
        setInventorySearch("");
    };

    const filteredInventoryItems = useMemo(() => {
        const q = inventorySearch.trim().toLowerCase();
        if (!q) return inventoryItems;
        return inventoryItems.filter((item) =>
            (item.name || "").toLowerCase().includes(q)
        );
    }, [inventoryItems, inventorySearch]);

    const itemCost = (item, qty) => Number(item?.cost_price || 0) * Number(qty || 0);

    // Match an inventory category to one of the expense CATEGORIES,
    // falling back to "Other" when there's no equivalent (e.g. a
    // generic supply category that isn't also a department).
    const matchExpenseCategory = (inventoryCategory) => {
        if (CATEGORIES.includes(inventoryCategory)) return inventoryCategory;
        return "Other";
    };

    const applyPickedItem = () => {
        if (!pickedItem) return;

        const qty = Number(pickedQty) || 1;

        if (qty > Number(pickedItem.quantity)) {
            toast.error(
                t("toastInventoryQtyExceeds") ||
                    `Only ${pickedItem.quantity} in stock`
            );
            return;
        }

        setDescription(
            `${pickedItem.name} x${qty}`
        );
        setCategory(matchExpenseCategory(pickedItem.category));
        setAmount(String(itemCost(pickedItem, qty)));

        toast.success(
            t("toastInventoryItemApplied") || "Item applied to expense"
        );
        closeInventoryPanel();
    };

    return (
        <div className="space-y-6">
            {/* Totals */}
            <Card>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-orange-500" />
                    {t("expenses") || "Expenses"}
                </h2>

                <div className="grid sm:grid-cols-3 gap-3">
                    <StatTile
                        icon={DollarSign}
                        label={t("totalSpends") || "Total spends"}
                        value={`${formatIQD(grandTotal)} IQD`}
                        sub={t("expensesPlusSalaries") || "Expenses + salaries"}
                        bg="bg-orange-50"
                        border="border-orange-100"
                        iconBg="bg-orange-100"
                        text="text-orange-600"
                    />
                    <StatTile
                        icon={Receipt}
                        label={t("manualExpenses") || "Manual expenses"}
                        value={`${formatIQD(manualTotal)} IQD`}
                        sub={`${expenses.length} ${t("entries") || "entries"}`}
                        bg="bg-red-50"
                        border="border-red-100"
                        iconBg="bg-red-100"
                        text="text-red-600"
                    />
                    <StatTile
                        icon={Users}
                        label={t("staffSalaries") || "Staff salaries"}
                        value={`${formatIQD(salaryTotal)} IQD`}
                        sub={`${staff.length} ${t("staffMembers") || "staff"}`}
                        bg="bg-indigo-50"
                        border="border-indigo-100"
                        iconBg="bg-indigo-100"
                        text="text-indigo-600"
                    />
                </div>
            </Card>

            {/* Add expense */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Plus size={18} className="text-orange-500" />
                        {t("addExpense") || "Add a spend"}
                    </h3>

                    <Button
                        onClick={openInventoryPanel}
                        className="!bg-white !text-orange-600 border border-orange-200 hover:!bg-orange-50 flex items-center gap-2 !px-3 !py-1.5 text-sm"
                    >
                        <Package size={16} />
                        {t("fetchFromInventory") || "Fetch from inventory"}
                    </Button>
                </div>

                {/* Inventory picker panel */}
                {showInventoryPanel && (
                    <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Package size={16} className="text-orange-500" />
                                {t("selectInventoryItem") || "Select an inventory item"}
                            </p>
                            <button
                                onClick={closeInventoryPanel}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {!pickedItem ? (
                            <>
                                <div className="relative mb-3">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        value={inventorySearch}
                                        onChange={(e) => setInventorySearch(e.target.value)}
                                        placeholder={
                                            t("searchInventoryPlaceholder") ||
                                            "Search item by name..."
                                        }
                                        className="w-full h-10 rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none bg-white"
                                    />
                                </div>

                                <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y">
                                    {loadingInventory ? (
                                        <p className="text-center text-gray-400 py-6 text-sm">
                                            {t("loading") || "Loading..."}
                                        </p>
                                    ) : filteredInventoryItems.length === 0 ? (
                                        <p className="text-center text-gray-400 py-6 text-sm">
                                            {t("noInventoryItemsFound") || "No items found"}
                                        </p>
                                    ) : (
                                        filteredInventoryItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setPickedItem(item);
                                                    setPickedQty(1);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-orange-50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {t("inStock") || "In stock"}: {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-orange-600 shrink-0 ml-3">
                                                    {formatIQD(item.cost_price)} IQD
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {pickedItem.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {t("costPrice") || "Cost price"}:{" "}
                                            {formatIQD(pickedItem.cost_price)} IQD ·{" "}
                                            {t("inStock") || "In stock"}: {pickedItem.quantity}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setPickedItem(null)}
                                        className="text-xs text-orange-600 hover:underline"
                                    >
                                        {t("changeItem") || "Change item"}
                                    </button>
                                </div>

                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="mb-1 block text-xs font-semibold text-gray-600">
                                            {t("quantity") || "Quantity"}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={pickedItem.quantity}
                                            value={pickedQty}
                                            onChange={(e) => setPickedQty(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <p className="mb-1 text-xs font-semibold text-gray-600">
                                            {t("calculatedAmount") || "Calculated amount"}
                                        </p>
                                        <p className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-800">
                                            {formatIQD(itemCost(pickedItem, pickedQty))} IQD
                                        </p>
                                    </div>

                                    <Button
                                        onClick={applyPickedItem}
                                        className="!px-4 !py-2.5 text-sm"
                                    >
                                        {t("useThisItem") || "Use this item"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                        <Input
                            label={t("description") || "Description"}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={
                                t("expenseDescPlaceholder") || "e.g. Electricity bill"
                            }
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            {t("category") || "Category"}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {t(`expenseCategory${c}`) || c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        type="number"
                        label={t("amountIQD") || "Amount (IQD)"}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                    />

                    <Input
                        type="date"
                        label={t("date") || "Date"}
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                    />
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        onClick={addExpense}
                        disabled={submitting}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} />
                        {submitting
                            ? t("saving") || "Saving..."
                            : t("addExpense") || "Add a spend"}
                    </Button>
                </div>
            </Card>

            {/* List of spends */}
            <Card>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-gray-500" />
                    {t("spendsList") || "Spends"}
                </h3>

                {loadingExpenses ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : expenses.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("noExpensesYet") || "No spends recorded yet"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">{t("date") || "Date"}</th>
                                    <th className="py-2 pr-4">
                                        {t("description") || "Description"}
                                    </th>
                                    <th className="py-2 pr-4">
                                        {t("category") || "Category"}
                                    </th>
                                    <th className="py-2 pr-4 text-right">
                                        {t("amount") || "Amount"}
                                    </th>
                                    <th className="py-2 pr-4 text-right">
                                        {t("action") || "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((e, idx) => (
                                    <tr
                                        key={e.id}
                                        className={`border-b last:border-0 ${
                                            idx % 2 === 1 ? "bg-gray-50/50" : ""
                                        }`}
                                    >
                                        <td className="py-2 pr-4 text-gray-600">
                                            {new Date(e.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-2 pr-4 font-medium text-gray-800">
                                            {e.description}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {t(`expenseCategory${e.category}`) ||
                                                e.category ||
                                                "-"}
                                        </td>
                                        <td className="py-2 pr-4 text-right font-semibold text-red-600">
                                            {formatIQD(e.amount)} IQD
                                        </td>
                                        <td className="py-2 pr-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            t("confirmDeleteExpense") ||
                                                                "Delete this expense?"
                                                        )
                                                    ) {
                                                        deleteExpense(e.id);
                                                    }
                                                }}
                                                disabled={deletingId === e.id}
                                                className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                                title={t("delete") || "Delete"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}