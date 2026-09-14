import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import {
    History,
    Search,
    Dog,
    Cat,
    Eye,
    CheckCircle2,
    XCircle,
    Trash2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const ROOM_DEPARTMENTS = ["Hospital", "Hotel"];
const ANIMAL_TYPES = ["Dog", "Cat"];

const STATUS_BADGE = {
    completed: "bg-green-100 text-green-700 border border-green-200",
    cancelled: "bg-gray-100 text-gray-600 border border-gray-200",
};

export default function RoomHistory() {
    const { t } = useTranslation();
    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- Filters ----------

    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [animalFilter, setAnimalFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // ---------- List ----------

    const [stays, setStays] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = {};
            if (departmentFilter !== "All") params.department = departmentFilter;
            if (animalFilter !== "All") params.animalType = animalFilter;
            if (statusFilter !== "All") params.status = statusFilter;
            if (search.trim()) params.search = search.trim();
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await axios.get(`${API_URL}/room-stays`, {
                params,
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStays(res.data);
        } catch (error) {
            console.error("Room history error:", error);
            toast.error(t("toastFailLoadHistory") || "Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [departmentFilter, animalFilter, statusFilter]);

    const applyDateAndSearch = (e) => {
        e.preventDefault();
        fetchHistory();
    };

    // ---------- Summary ----------

    const summary = useMemo(() => {
        const completed = stays.filter((s) => s.status === "completed");
        const totalRevenue = completed.reduce(
            (sum, s) => sum + Number(s.bill_total || 0),
            0
        );
        return {
            count: stays.length,
            completedCount: completed.length,
            cancelledCount: stays.filter((s) => s.status === "cancelled").length,
            totalRevenue,
        };
    }, [stays]);

    // ---------- Item details modal ----------

    const [detailsStay, setDetailsStay] = useState(null);
    const [detailsItems, setDetailsItems] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const openDetails = async (stay) => {
        setDetailsStay(stay);
        setLoadingDetails(true);

        try {
            const res = await axios.get(
                `${API_URL}/room-stays/${stay.id}/items`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            setDetailsItems(res.data);
        } catch (error) {
            console.error(error);
            toast.error(t("toastFailLoadStayItems") || "Failed to load items");
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetails = () => {
        setDetailsStay(null);
        setDetailsItems([]);
    };

    // ---------- Delete history entry ----------

    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (stay) => {
        const confirmed = window.confirm(
            t("confirmDeleteHistory") ||
                `Delete this history entry for ${stay.animal_name}? This also removes its bill from revenue reports and cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(stay.id);
        try {
            await axios.delete(`${API_URL}/room-stays/${stay.id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            toast.success(t("toastHistoryDeleted") || "History entry deleted");
            setStays((prev) => prev.filter((s) => s.id !== stay.id));
            if (detailsStay?.id === stay.id) closeDetails();
        } catch (error) {
            console.error("Delete history error:", error);
            toast.error(
                error.response?.data?.message ||
                    t("toastFailDeleteHistory") ||
                    "Failed to delete history entry"
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
                        <History size={20} className="text-orange-500" />
                        {t("roomHistory") || "Room occupation history"}
                    </h2>
                </div>

                <form
                    onSubmit={applyDateAndSearch}
                    className="mt-4 flex flex-wrap items-center gap-2"
                >
                    <div className="relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                t("searchCustomerAnimalRoom") ||
                                "Search customer, animal or room..."
                            }
                            className="h-10 w-64 rounded-lg border border-gray-300 pl-8 pr-3 text-sm focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                    >
                        <option value="All">
                            {t("allDepartments") || "All departments"}
                        </option>
                        {ROOM_DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                                {t(`department${d}`) || d}
                            </option>
                        ))}
                    </select>

                    <select
                        value={animalFilter}
                        onChange={(e) => setAnimalFilter(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                    >
                        <option value="All">{t("allAnimals") || "Dogs & cats"}</option>
                        {ANIMAL_TYPES.map((a) => (
                            <option key={a} value={a}>
                                {t(a.toLowerCase()) || a}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                    >
                        <option value="All">{t("allStatuses") || "All statuses"}</option>
                        <option value="completed">
                            {t("statusCompleted") || "Completed"}
                        </option>
                        <option value="cancelled">
                            {t("statusCancelled") || "Cancelled"}
                        </option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm">
                        {t("to") || "to"}
                    </span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                    />

                    <Button
                        type="submit"
                        className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                    >
                        {t("apply") || "Apply"}
                    </Button>
                </form>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <p className="text-xs text-gray-500">
                        {t("totalStays") || "Total stays"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {summary.count}
                    </p>
                </Card>
                <Card>
                    <p className="text-xs text-gray-500">
                        {t("completedCancelled") || "Completed / Cancelled"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-800">
                        {summary.completedCount}{" "}
                        <span className="text-base font-normal text-gray-400">
                            / {summary.cancelledCount}
                        </span>
                    </p>
                </Card>
                <Card>
                    <p className="text-xs text-gray-500">
                        {t("totalRevenue") || "Total revenue (completed)"}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-orange-600">
                        {formatIQD(summary.totalRevenue)} IQD
                    </p>
                </Card>
            </div>

            <Card>
                {loading ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : stays.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("noHistoryFound") || "No occupation history found"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase text-gray-400">
                                    <th className="py-2 pr-3">{t("room") || "Room"}</th>
                                    <th className="py-2 pr-3">{t("animal") || "Animal"}</th>
                                    <th className="py-2 pr-3">{t("customer") || "Customer"}</th>
                                    <th className="py-2 pr-3">{t("checkIn") || "Check-in"}</th>
                                    <th className="py-2 pr-3">{t("checkOut") || "Check-out"}</th>
                                    <th className="py-2 pr-3">{t("days") || "Days"}</th>
                                    <th className="py-2 pr-3">{t("itemsUsed") || "Items"}</th>
                                    <th className="py-2 pr-3">{t("total") || "Total"}</th>
                                    <th className="py-2 pr-3">{t("payment") || "Payment"}</th>
                                    <th className="py-2 pr-3">{t("status") || "Status"}</th>
                                    <th className="py-2 pr-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {stays.map((stay) => (
                                    <tr
                                        key={stay.id}
                                        className="border-b last:border-0 hover:bg-gray-50"
                                    >
                                        <td className="py-2 pr-3">
                                            <div className="font-medium text-gray-800">
                                                {stay.room_number}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {t(`department${stay.department}`) ||
                                                    stay.department}
                                            </div>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <div className="flex items-center gap-1.5">
                                                {stay.animal_type === "Dog" ? (
                                                    <Dog size={14} className="text-gray-400" />
                                                ) : (
                                                    <Cat size={14} className="text-gray-400" />
                                                )}
                                                {stay.animal_name}
                                            </div>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <div className="text-gray-700">
                                                {stay.customer_name}
                                            </div>
                                            {stay.customer_phone && (
                                                <div className="text-xs text-gray-400">
                                                    {stay.customer_phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 pr-3 text-gray-600">
                                            {stay.check_in_date
                                                ? new Date(
                                                      stay.check_in_date
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td className="py-2 pr-3 text-gray-600">
                                            {stay.check_out_date
                                                ? new Date(
                                                      stay.check_out_date
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td className="py-2 pr-3 text-gray-600">
                                            {stay.days}
                                        </td>
                                        <td className="py-2 pr-3">
                                            {Number(stay.items_total) > 0 ? (
                                                <button
                                                    onClick={() => openDetails(stay)}
                                                    className="flex items-center gap-1 text-orange-600 hover:underline"
                                                >
                                                    <Eye size={13} />
                                                    {formatIQD(stay.items_total)} IQD
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">
                                                    {t("none") || "None"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 pr-3 font-semibold text-gray-800">
                                            {stay.status === "completed"
                                                ? `${formatIQD(stay.bill_total)} IQD`
                                                : "-"}
                                        </td>
                                        <td className="py-2 pr-3 text-gray-600 capitalize">
                                            {stay.status === "completed"
                                                ? stay.payment_method || "-"
                                                : "-"}
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    STATUS_BADGE[stay.status] ||
                                                    "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {stay.status === "completed" ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <XCircle size={12} />
                                                )}
                                                {stay.status === "completed"
                                                    ? t("statusCompleted") || "Completed"
                                                    : t("statusCancelled") || "Cancelled"}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openDetails(stay)}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                                    title={t("viewDetails") || "View details"}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(stay)}
                                                    disabled={deletingId === stay.id}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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

            {/* Stay details modal */}
            {detailsStay && (
                <Modal
                    open={!!detailsStay}
                    onClose={closeDetails}
                    title={`${detailsStay.room_number} \u2014 ${detailsStay.animal_name}`}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                            <p className="font-medium text-gray-800">
                                {detailsStay.customer_name}
                                {detailsStay.customer_phone
                                    ? ` \u00b7 ${detailsStay.customer_phone}`
                                    : ""}
                            </p>
                            <p className="text-gray-500">
                                {formatIQD(detailsStay.price_per_day)} IQD &times;{" "}
                                {detailsStay.days} {t("days") || "days"}
                            </p>
                            <p className="text-gray-400 text-xs">
                                {t("checkIn") || "Check-in"}:{" "}
                                {detailsStay.check_in_date
                                    ? new Date(
                                          detailsStay.check_in_date
                                      ).toLocaleString()
                                    : "-"}
                            </p>
                            {detailsStay.check_out_date && (
                                <p className="text-gray-400 text-xs">
                                    {t("checkOut") || "Check-out"}:{" "}
                                    {new Date(
                                        detailsStay.check_out_date
                                    ).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-gray-400">
                                {t("itemsUsed") || "Items used"}
                            </p>

                            {loadingDetails ? (
                                <p className="text-center text-gray-400 py-6 text-sm">
                                    {t("loading") || "Loading..."}
                                </p>
                            ) : detailsItems.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 text-sm">
                                    {t("noItemsUsedYet") || "No items used"}
                                </p>
                            ) : (
                                detailsItems.map((it) => (
                                    <div
                                        key={it.id}
                                        className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {it.item_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {it.quantity} &times;{" "}
                                                {formatIQD(it.unit_price)} IQD
                                            </p>
                                        </div>
                                        <span className="font-semibold text-orange-600">
                                            {formatIQD(it.line_total)} IQD
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {detailsStay.status === "completed" && (
                            <div className="border-t pt-3 space-y-1 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>{t("subtotal") || "Subtotal"}</span>
                                    <span>
                                        {formatIQD(detailsStay.bill_subtotal)} IQD
                                    </span>
                                </div>
                                {Number(detailsStay.discount) > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>{t("discount") || "Discount"}</span>
                                        <span>
                                            -{formatIQD(detailsStay.discount)} IQD
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold text-gray-900">
                                    <span>{t("total") || "Total"}</span>
                                    <span className="text-orange-600">
                                        {formatIQD(detailsStay.bill_total)} IQD
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>{t("payment") || "Payment"}</span>
                                    <span className="capitalize">
                                        {detailsStay.payment_method}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => handleDelete(detailsStay)}
                                disabled={deletingId === detailsStay.id}
                                className="text-red-600 border border-red-200 hover:bg-red-50"
                            >
                                <Trash2 size={14} className="mr-1 inline" />
                                {t("delete") || "Delete"}
                            </Button>
                            <Button variant="secondary" onClick={closeDetails}>
                                {t("close") || "Close"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}