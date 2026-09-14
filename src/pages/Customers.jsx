import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import { Search, Pencil, Trash2, Plus, Users } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Customers() {
    const { t } = useTranslation();
    const getToken = () => localStorage.getItem("token");

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", notes: "" });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/customers`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setCustomers(res.data);
        } catch (error) {
            console.error("Customers Error:", error);
            toast.error(t("toastFailLoadCustomers") || "Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return customers;
        const q = search.toLowerCase();
        return customers.filter(
            (c) =>
                (c.name || "").toLowerCase().includes(q) ||
                (c.phone || "").toLowerCase().includes(q)
        );
    }, [customers, search]);

    const openAdd = () => {
        setEditingCustomer(null);
        setForm({ name: "", phone: "", notes: "" });
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (customer) => {
        setEditingCustomer(customer);
        setForm({
            name: customer.name || "",
            phone: customer.phone || "",
            notes: customer.notes || "",
        });
        setErrors({});
        setModalOpen(true);
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) {
            newErrors.name = t("customerNameRequired") || "Customer name is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const saveCustomer = async () => {
        if (!validate()) return;

        setSaving(true);
        const loadingToast = toast.loading(
            editingCustomer
                ? t("toastUpdatingCustomer") || "Updating customer..."
                : t("toastSavingCustomer") || "Saving customer..."
        );

        try {
            if (editingCustomer) {
                await axios.put(
                    `${API_URL}/customers/${editingCustomer.id}`,
                    form,
                    { headers: { Authorization: `Bearer ${getToken()}` } }
                );
                toast.success(t("toastCustomerUpdated") || "Customer updated", {
                    id: loadingToast,
                });
            } else {
                await axios.post(`${API_URL}/customers`, form, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                toast.success(t("toastCustomerAdded") || "Customer added", {
                    id: loadingToast,
                });
            }

            setModalOpen(false);
            await fetchCustomers();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastCustomerFailed") ||
                    "Failed to save customer",
                { id: loadingToast }
            );
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);

        try {
            await axios.delete(`${API_URL}/customers/${deleteId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            toast.success(t("toastCustomerDeleted") || "Customer deleted");
            setDeleteId(null);
            await fetchCustomers();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastCustomerDeleteFailed") ||
                    "Failed to delete customer"
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-orange-500" />
                        {t("customers") || "Customers"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-3 text-gray-400"
                            />
                            <input
                                className="h-10 w-56 pl-9 pr-3 border rounded-lg text-sm outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500"
                                placeholder={t("searchCustomers") || "Search customers..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Button
                            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm flex items-center gap-1"
                            onClick={openAdd}
                        >
                            <Plus size={16} />
                            {t("addCustomer") || "Add customer"}
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                {loading ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-gray-400 py-10">
                        {t("noCustomersFound") || "No customers found"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="py-2 pr-4">{t("name") || "Name"}</th>
                                    <th className="py-2 pr-4">{t("phone") || "Phone"}</th>
                                    <th className="py-2 pr-4">{t("note") || "Notes"}</th>
                                    <th className="py-2 pr-4">{t("dates") || "Added"}</th>
                                    <th className="py-2 pr-4 text-right">
                                        {t("action") || "Actions"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4 font-medium text-gray-800">
                                            {c.name}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                            {c.phone || "-"}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-500 max-w-xs truncate">
                                            {c.notes || "-"}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-500">
                                            {c.created_at
                                                ? new Date(c.created_at).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                                                    title={t("edit") || "Edit"}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(c.id)}
                                                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
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

            {modalOpen && (
                <Modal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={
                        editingCustomer
                            ? t("editCustomer") || "Edit customer"
                            : t("addCustomer") || "Add customer"
                    }
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div>
                            <Input
                                label={t("customerName") || "Name"}
                                className={errors.name ? "border-red-500" : ""}
                                value={form.name}
                                onChange={(e) => {
                                    setForm({ ...form, name: e.target.value });
                                    setErrors({ ...errors, name: "" });
                                }}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <Input
                            label={t("phone") || "Phone"}
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("note") || "Notes"}
                            </label>
                            <textarea
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-500 focus:outline-none"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setModalOpen(false)}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={saveCustomer}
                                disabled={saving}
                            >
                                {saving
                                    ? t("saving") || "Saving..."
                                    : t("saveChanges") || "Save"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">
                            {t("deleteCustomer") || "Delete customer"}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {t("deleteCustomerMessage") ||
                                "Are you sure you want to delete this customer? This action cannot be undone."}
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                {deleting ? "Deleting..." : t("delete") || "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}