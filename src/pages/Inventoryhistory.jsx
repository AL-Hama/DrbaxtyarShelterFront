import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";

import {
    Search,
    Package,
    TrendingUp,
    TrendingDown,
    Wallet,
    DollarSign,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function InventoryHistory() {
    const { t } = useTranslation();

    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [search, setSearch] = useState("");

    // inventory_id -> { added, sold } aggregated across ALL transaction
    // history, fetched once so the page-level summary box doesn't need
    // to open every item's modal to add things up.
    const [txSummary, setTxSummary] = useState({});

    const [selectedItem, setSelectedItem] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchItems = async () => {
        setLoadingItems(true);
        try {
            const res = await axios.get(`${API_URL}/inventory`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setItems(res.data);
        } catch (error) {
            console.error("Inventory Error:", error);
            toast.error(t("toastFailLoadInv") || "Failed to load inventory");
        } finally {
            setLoadingItems(false);
        }
    };

    const fetchTxSummary = async () => {
        try {
            const res = await axios.get(
                `${API_URL}/inventory/transactions/summary`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            const map = {};
            res.data.forEach((row) => {
                map[row.inventory_id] = {
                    added: Number(row.added),
                    sold: Number(row.sold),
                };
            });

            setTxSummary(map);
        } catch (error) {
            console.error("Tx Summary Error:", error);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchTxSummary();
    }, []);

    const filteredItems = useMemo(() => {
        if (!search.trim()) return items;
        const q = search.toLowerCase();
        return items.filter(
            (i) =>
                (i.name || "").toLowerCase().includes(q) ||
                (i.category || "").toLowerCase().includes(q)
        );
    }, [items, search]);

    // Page-level totals across whatever is currently visible in the
    // grid below — recalculates automatically whenever filteredItems
    // changes (i.e. whenever the search bar is used).
    const pageSummary = useMemo(() => {
        return filteredItems.reduce(
            (acc, item) => {
                const stats = txSummary[item.id] || { added: 0, sold: 0 };
                const costPrice = Number(item.cost_price) || 0;
                const unitPrice = Number(item.unit_price) || 0;
                const quantity = Number(item.quantity) || 0;

                acc.totalAdded += stats.added;
                acc.totalSold += stats.sold;
                acc.totalCost += quantity * costPrice;
                acc.totalProfit += stats.sold * (unitPrice - costPrice);

                return acc;
            },
            { totalAdded: 0, totalSold: 0, totalCost: 0, totalProfit: 0 }
        );
    }, [filteredItems, txSummary]);

    const openHistory = async (item) => {
        setSelectedItem(item);
        setLoadingHistory(true);
        setHistory([]);

        try {
            const res = await axios.get(
                `${API_URL}/inventory/${item.id}/transactions`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            setHistory(res.data);
        } catch (error) {
            console.error("History Error:", error);
            toast.error(
                t("toastFailLoadHistory") || "Failed to load item history"
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    const closeHistory = () => {
        setSelectedItem(null);
        setHistory([]);
    };

    // Roll every transaction up into per-day "added" vs "sold/used"
    // totals — purchases and stock restores count as added, everything
    // else (sales, procedures, treatments) counts as sold/used.
    const dailySummary = useMemo(() => {
        const map = {};

        history.forEach((tx) => {
            const d = new Date(tx.created_at);
            const key = d.toISOString().slice(0, 10);

            if (!map[key]) {
                map[key] = {
                    key,
                    label: d.toLocaleDateString(),
                    added: 0,
                    sold: 0,
                };
            }

            const qty = Number(tx.quantity);
            if (qty > 0) map[key].added += qty;
            else if (qty < 0) map[key].sold += Math.abs(qty);
        });

        return Object.values(map).sort((a, b) => (a.key < b.key ? 1 : -1));
    }, [history]);

    const totals = useMemo(
        () =>
            dailySummary.reduce(
                (acc, d) => ({
                    added: acc.added + d.added,
                    sold: acc.sold + d.sold,
                }),
                { added: 0, sold: 0 }
            ),
        [dailySummary]
    );

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Package size={20} className="text-orange-500" />
                        {t("inventoryhistory") || "Inventory History"}
                    </h2>

                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                            className="h-10 w-64 pl-9 pr-3 border rounded-lg text-sm outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                            placeholder={t("searchInventory") || "Search items..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Page-level summary: updates with the search bar above */}
            <Card>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
                        <TrendingUp size={22} className="text-green-600 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">
                                {t("totalAdded") || "Total added"}
                            </p>
                            <p className="text-lg font-bold text-green-600">
                                {pageSummary.totalAdded}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
                        <TrendingDown size={22} className="text-red-500 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">
                                {t("totalSold") || "Total sold/used"}
                            </p>
                            <p className="text-lg font-bold text-red-500">
                                {pageSummary.totalSold}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                        <Wallet size={22} className="text-blue-600 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">
                                {t("totalCost") || "Total cost (stock)"}
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                                {formatIQD(pageSummary.totalCost)} IQD
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4">
                        <DollarSign size={22} className="text-orange-600 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">
                                {t("totalProfit") || "Total profit"}
                            </p>
                            <p className="text-lg font-bold text-orange-600">
                                {formatIQD(pageSummary.totalProfit)} IQD
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                {loadingItems ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : filteredItems.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("basketNoItems") || "No items found"}
                    </p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => openHistory(item)}
                                className="flex flex-col items-start rounded-xl border border-gray-200 p-4 text-left transition hover:border-orange-300 hover:shadow-md"
                            >
                                <span className="font-semibold text-gray-800 line-clamp-2">
                                    {item.name}
                                </span>
                                <span className="mt-1 text-xs text-gray-400">
                                    {item.category}
                                </span>
                                <span className="mt-2 text-sm font-semibold text-orange-600">
                                    {t("stock") || "Stock"}: {item.quantity}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {selectedItem && (
                <Modal
                    open={!!selectedItem}
                    onClose={closeHistory}
                    title={selectedItem.name}
                    className="max-w-lg"
                >
                    {loadingHistory ? (
                        <p className="text-center text-gray-400 py-10">
                            {t("loading") || "Loading..."}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3 text-sm">
                                <span className="text-gray-600">
                                    {t("currentStock") || "Current stock"}
                                </span>
                                <span className="font-bold text-orange-600">
                                    {selectedItem.quantity}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                                    <TrendingUp size={18} className="text-green-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {t("totalAdded") || "Total added"}
                                        </p>
                                        <p className="font-bold text-green-600">
                                            {totals.added}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
                                    <TrendingDown size={18} className="text-red-500" />
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {t("totalSold") || "Total sold/used"}
                                        </p>
                                        <p className="font-bold text-red-500">
                                            {totals.sold}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {dailySummary.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-6">
                                    {t("noHistoryYet") ||
                                        "No stock movements recorded yet"}
                                </p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-gray-500 border-b sticky top-0 bg-white">
                                                <th className="py-2 pr-4">
                                                    {t("date") || "Date"}
                                                </th>
                                                <th className="py-2 pr-4 text-green-600">
                                                    {t("added") || "Added"}
                                                </th>
                                                <th className="py-2 pr-4 text-red-500">
                                                    {t("sold") || "Sold/Used"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dailySummary.map((d) => (
                                                <tr
                                                    key={d.key}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="py-2 pr-4 text-gray-700">
                                                        {d.label}
                                                    </td>
                                                    <td className="py-2 pr-4 font-semibold text-green-600">
                                                        {d.added > 0
                                                            ? `+${d.added}`
                                                            : "-"}
                                                    </td>
                                                    <td className="py-2 pr-4 font-semibold text-red-500">
                                                        {d.sold > 0
                                                            ? `-${d.sold}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}