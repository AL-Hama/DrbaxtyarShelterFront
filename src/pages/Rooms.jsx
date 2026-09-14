import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import {
    BedDouble,
    Plus,
    Trash2,
    LogIn,
    LogOut,
    Sparkles,
    Search,
    Dog,
    Cat,
    ShoppingCart,
    PackagePlus,
    XCircle,
    Pencil,
    Printer,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const ROOM_DEPARTMENTS = ["Hospital", "Hotel"];
const ANIMAL_TYPES = ["Dog", "Cat"];

const STATUS_BADGE = {
    empty: "bg-green-100 text-green-700 border border-green-200",
    cleaning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    occupied: "bg-red-100 text-red-700 border border-red-200",
};

const CLINIC_NAME = "Dr Baxtyar Pet Clinic";
const PRINTER_NAME = "POSPrinter POS80";

// left margin (creates right padding effect), matches existing basket print style
const pad = (text) => "     " + text;

const ensureQz = async (t) => {
    if (!window.qz) {
        toast.error(t("qzNotFound") || "QZ Tray is not installed or running.");
        return null;
    }
    const qz = window.qz;
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
        }
        return qz;
    } catch (err) {
        console.error("QZ connect error:", err);
        toast.error(t("qzConnectFailed") || "Could not connect to QZ Tray");
        return null;
    }
};

const sendToPrinter = async (receiptText, t) => {
    const qz = await ensureQz(t);
    if (!qz) return false;

    try {
        const printer = await qz.printers.find(PRINTER_NAME);
        const config = qz.configs.create(printer);

        const data = [
            {
                type: "raw",
                format: "plain",
                data: receiptText,
            },
        ];

        await qz.print(config, data);
        return true;
    } catch (err) {
        console.error("Print error:", err);
        toast.error(t("printFailed") || "Failed to print");
        return false;
    }
};

export default function Rooms() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("token");

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- Rooms list ----------

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [animalFilter, setAnimalFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/rooms`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setRooms(res.data);
        } catch (error) {
            console.error("Rooms Error:", error);
            toast.error(t("toastFailLoadRooms") || "Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    // ---------- Inventory (needed to add items used during a stay) ----------

    const [inventory, setInventory] = useState([]);

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
        fetchRooms();
        fetchInventory();
    }, []);

    const filteredRooms = useMemo(() => {
        return rooms.filter((r) => {
            if (departmentFilter !== "All" && r.department !== departmentFilter)
                return false;
            if (animalFilter !== "All" && r.animal_type !== animalFilter)
                return false;
            if (statusFilter !== "All" && r.status !== statusFilter) return false;
            return true;
        });
    }, [rooms, departmentFilter, animalFilter, statusFilter]);

    // ---------- Print helpers (room card + checkout) ----------

    const printRoomReceipt = async (room) => {
        const itemsTotal = Number(room.items_total || 0);
        const roomChargeSoFar =
            Number(room.price_per_day || 0) * Number(room.days || 1);
        const paidSoFar = Number(room.initial_payment || 0);
        const roomTotalSoFar = roomChargeSoFar + itemsTotal;
        const remainingSoFar = Math.max(0, roomTotalSoFar - paidSoFar);

        const itemLines =
            Array.isArray(room.items) && room.items.length > 0
                ? room.items
                      .map((it) =>
                          pad(
                              `${(it.item_name || "").substring(0, 14).padEnd(
                                  14
                              )} x${String(it.quantity).padEnd(3)} ${formatIQD(
                                  it.line_total
                              )}`
                          )
                      )
                      .join("\n")
                : pad(t("noItemsUsedYet") || "No items used yet");

        const receipt = `
${pad(CLINIC_NAME)}
${pad("--------------------------------")}

${pad(`Room   : ${room.room_number} (${room.department})`)}
${pad(`Animal : ${room.animal_name} (${room.animal_type})`)}
${pad(`Owner  : ${room.customer_name}`)}
${room.customer_phone ? pad(`Phone  : ${room.customer_phone}`) : ""}

${pad(`Date: ${new Date().toLocaleDateString()}`)}
${pad(`Time: ${new Date().toLocaleTimeString()}`)}

${pad("--------------------------------")}
${pad(
    `Room charge : ${formatIQD(room.price_per_day)} x ${room.days} = ${formatIQD(
        roomChargeSoFar
    )} IQD`
)}
${pad("Items used:")}
${itemLines}

${pad("================================")}
${pad(`Total so far : ${formatIQD(roomTotalSoFar)} IQD`)}
${pad(`Deposit paid : ${formatIQD(paidSoFar)} IQD`)}
${pad(`Remaining    : ${formatIQD(remainingSoFar)} IQD`)}
${pad("================================")}

\x1D\x56\x00
`;

        await sendToPrinter(receipt, t);
    };

    // ---------- Add room ----------

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        roomNumber: "",
        department: "Hospital",
        animalType: "Dog",
    });
    const [savingRoom, setSavingRoom] = useState(false);

    const openAddRoom = () => {
        setAddForm({ roomNumber: "", department: "Hospital", animalType: "Dog" });
        setAddModalOpen(true);
    };

    const saveRoom = async () => {
        if (!addForm.roomNumber.trim()) {
            toast.error(t("roomNumberRequired") || "Room number is required");
            return;
        }

        setSavingRoom(true);
        const loadingToast = toast.loading(t("toastSavingRoom") || "Adding room...");

        try {
            await axios.post(`${API_URL}/rooms`, addForm, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            toast.success(t("toastRoomAdded") || "Room added", { id: loadingToast });
            setAddModalOpen(false);
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastRoomFailed") ||
                    "Failed to add room",
                { id: loadingToast }
            );
        } finally {
            setSavingRoom(false);
        }
    };

    // ---------- Edit room (+ active stay) ----------

    const [editRoom, setEditRoom] = useState(null);
    const [editForm, setEditForm] = useState(null);
    const [savingEditRoom, setSavingEditRoom] = useState(false);

    const openEditRoom = (room) => {
        setEditRoom(room);
        setEditForm({
            roomNumber: room.room_number,
            department: room.department,
            animalType: room.animal_type,
            customerName: room.customer_name || "",
            customerPhone: room.customer_phone || "",
            animalName: room.animal_name || "",
            pricePerDay: room.price_per_day || "",
            days: room.days || 1,
            initialPayment: room.initial_payment || "",
        });
    };

    const closeEditRoom = () => {
        setEditRoom(null);
        setEditForm(null);
    };

    const saveEditRoom = async () => {
        if (!editForm.roomNumber.trim()) {
            toast.error(t("roomNumberRequired") || "Room number is required");
            return;
        }

        if (editRoom.status === "occupied") {
            if (!editForm.customerName.trim()) {
                toast.error(t("customerNameRequired") || "Customer name is required");
                return;
            }
            if (!editForm.animalName.trim()) {
                toast.error(t("animalNameRequired") || "Animal name is required");
                return;
            }
            if (!editForm.pricePerDay || Number(editForm.pricePerDay) <= 0) {
                toast.error(t("pricePerDayRequired") || "Price per day is required");
                return;
            }
            if (!editForm.days || Number(editForm.days) < 1) {
                toast.error(t("daysRequired") || "Number of days is required");
                return;
            }
        }

        setSavingEditRoom(true);
        const loadingToast = toast.loading(t("toastSavingRoom") || "Saving room...");

        try {
            await axios.put(
                `${API_URL}/rooms/${editRoom.id}`,
                {
                    roomNumber: editForm.roomNumber,
                    department: editForm.department,
                    animalType: editForm.animalType,
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (editRoom.status === "occupied") {
                await axios.put(
                    `${API_URL}/rooms/${editRoom.id}/stay`,
                    {
                        customerName: editForm.customerName,
                        customerPhone: editForm.customerPhone,
                        animalName: editForm.animalName,
                        pricePerDay: Number(editForm.pricePerDay),
                        days: Number(editForm.days),
                        initialPayment: Number(editForm.initialPayment) || 0,
                    },
                    { headers: { Authorization: `Bearer ${getToken()}` } }
                );
            }

            toast.success(t("toastRoomUpdated") || "Room updated", { id: loadingToast });
            closeEditRoom();
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastRoomFailed") ||
                    "Failed to update room",
                { id: loadingToast }
            );
        } finally {
            setSavingEditRoom(false);
        }
    };

    // ---------- Delete room ----------

    const [deleteRoomId, setDeleteRoomId] = useState(null);
    const [deletingRoom, setDeletingRoom] = useState(false);

    const confirmDeleteRoom = async () => {
        if (!deleteRoomId) return;
        setDeletingRoom(true);

        try {
            await axios.delete(`${API_URL}/rooms/${deleteRoomId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            toast.success(t("toastRoomDeleted") || "Room deleted");
            setDeleteRoomId(null);
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastRoomDeleteFailed") ||
                    "Failed to delete room"
            );
        } finally {
            setDeletingRoom(false);
        }
    };

    // ---------- Mark clean / ready ----------

    const markEmpty = async (roomId) => {
        try {
            await axios.put(
                `${API_URL}/rooms/${roomId}/status`,
                { status: "empty" },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            toast.success(t("toastRoomReady") || "Room marked as ready");
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastRoomStatusFailed") ||
                    "Failed to update room"
            );
        }
    };

    // ---------- Check-in ----------

    const [checkinRoom, setCheckinRoom] = useState(null);
    const [checkinForm, setCheckinForm] = useState(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [customerResults, setCustomerResults] = useState([]);
    const [savingCheckin, setSavingCheckin] = useState(false);

    const openCheckin = (room) => {
        setCheckinRoom(room);
        setCheckinForm({
            customerId: null,
            customerName: "",
            customerPhone: "",
            animalName: "",
            pricePerDay: "",
            days: 1,
            initialPayment: "",
        });
        setCustomerQuery("");
        setCustomerResults([]);
    };

    const closeCheckin = () => {
        setCheckinRoom(null);
        setCheckinForm(null);
    };

    const searchCustomers = async (query) => {
        setCustomerQuery(query);
        setCheckinForm((prev) => ({
            ...prev,
            customerId: null,
            customerName: query,
        }));

        if (!query.trim()) {
            setCustomerResults([]);
            return;
        }

        try {
            const res = await axios.get(`${API_URL}/customers`, {
                params: { search: query },
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setCustomerResults(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const pickCustomer = (customer) => {
        setCheckinForm((prev) => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone || "",
        }));
        setCustomerQuery(customer.name);
        setCustomerResults([]);
    };

    const checkinTotal =
        (Number(checkinForm?.pricePerDay) || 0) *
        Math.max(1, Number(checkinForm?.days) || 1);

    const checkinRemainingAfterDeposit = Math.max(
        0,
        checkinTotal - (Number(checkinForm?.initialPayment) || 0)
    );

    const submitCheckin = async () => {
        if (!checkinForm.customerName.trim()) {
            toast.error(t("customerNameRequired") || "Customer name is required");
            return;
        }
        if (!checkinForm.animalName.trim()) {
            toast.error(t("animalNameRequired") || "Animal name is required");
            return;
        }
        if (!checkinForm.pricePerDay || Number(checkinForm.pricePerDay) <= 0) {
            toast.error(t("pricePerDayRequired") || "Price per day is required");
            return;
        }
        if (!checkinForm.days || Number(checkinForm.days) < 1) {
            toast.error(t("daysRequired") || "Number of days is required");
            return;
        }

        setSavingCheckin(true);
        const loadingToast = toast.loading(t("toastCheckingIn") || "Checking in...");

        try {
            await axios.post(
                `${API_URL}/rooms/${checkinRoom.id}/checkin`,
                {
                    customerId: checkinForm.customerId,
                    customerName: checkinForm.customerName,
                    customerPhone: checkinForm.customerPhone,
                    animalName: checkinForm.animalName,
                    animalType: checkinRoom.animal_type,
                    pricePerDay: Number(checkinForm.pricePerDay),
                    days: Number(checkinForm.days),
                    initialPayment: Number(checkinForm.initialPayment) || 0,
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(t("toastCheckedIn") || "Checked in", { id: loadingToast });
            closeCheckin();
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastCheckinFailed") ||
                    "Failed to check in",
                { id: loadingToast }
            );
        } finally {
            setSavingCheckin(false);
        }
    };

    // ---------- Items used during an active stay ----------

    const [itemsRoom, setItemsRoom] = useState(null);
    const [stayItems, setStayItems] = useState([]);
    const [loadingStayItems, setLoadingStayItems] = useState(false);
    const [itemSearch, setItemSearch] = useState("");
    const [addingItem, setAddingItem] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);

    const openItemsModal = async (room) => {
        setItemsRoom(room);
        setItemSearch("");
        setLoadingStayItems(true);

        try {
            const res = await axios.get(`${API_URL}/rooms/${room.id}/items`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setStayItems(res.data);
        } catch (error) {
            console.error(error);
            toast.error(t("toastFailLoadStayItems") || "Failed to load items");
        } finally {
            setLoadingStayItems(false);
        }
    };

    const closeItemsModal = () => {
        setItemsRoom(null);
        setStayItems([]);
        setItemSearch("");
    };

    const itemSearchResults = useMemo(() => {
        if (!itemSearch.trim()) return [];
        const q = itemSearch.toLowerCase();
        return inventory
            .filter((i) => (i.name || "").toLowerCase().includes(q))
            .slice(0, 6);
    }, [inventory, itemSearch]);

    const addStayItem = async (item) => {
        if (!itemsRoom) return;

        if (Number(item.quantity) <= 0) {
            toast.error(t("basketNoMoreStock") || "No more stock available");
            return;
        }

        setAddingItem(true);

        try {
            const res = await axios.post(
                `${API_URL}/rooms/${itemsRoom.id}/items`,
                { inventoryId: item.id, quantity: 1 },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            setStayItems((prev) => [res.data, ...prev]);
            toast.success(t("toastItemAddedToStay") || "Item added to the stay");

            await fetchInventory();
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastItemAddToStayFailed") ||
                    "Failed to add item"
            );
        } finally {
            setAddingItem(false);
        }
    };

    const deleteStayItem = async (item) => {
        if (!itemsRoom) return;
        setDeletingItemId(item.id);

        try {
            await axios.delete(
                `${API_URL}/rooms/${itemsRoom.id}/items/${item.id}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            setStayItems((prev) => prev.filter((i) => i.id !== item.id));
            toast.success(t("toastItemRemovedFromStay") || "Item removed");

            await fetchInventory();
            await fetchRooms();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastItemRemoveFailed") ||
                    "Failed to remove item"
            );
        } finally {
            setDeletingItemId(null);
        }
    };

    const stayItemsTotal = useMemo(
        () => stayItems.reduce((sum, i) => sum + Number(i.line_total || 0), 0),
        [stayItems]
    );

    // ---------- Cancel occupation ----------

    const [cancellingRoomId, setCancellingRoomId] = useState(null);

    const cancelOccupation = async (roomId) => {
        setCancellingRoomId(roomId);

        try {
            await axios.put(
                `${API_URL}/rooms/${roomId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(
                t("toastOccupationCancelled") ||
                    "Occupation cancelled and stock restored"
            );

            await fetchRooms();
            await fetchInventory();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    t("toastCancelOccupationFailed") ||
                    "Failed to cancel occupation"
            );
        } finally {
            setCancellingRoomId(null);
        }
    };

    // ---------- Check-out ----------

    const [checkoutRoom, setCheckoutRoom] = useState(null);
    const [checkoutForm, setCheckoutForm] = useState(null);
    const [savingCheckout, setSavingCheckout] = useState(false);
    // Tracks whether the person has manually typed into "amount
    // collected now" — if not, we keep that field synced to the full
    // outstanding due amount whenever days/discount change.
    const [amountReceivedTouched, setAmountReceivedTouched] = useState(false);

    const openCheckout = (room) => {
        setCheckoutRoom(room);
        const initialDays = room.days || 1;
        const roomChargeNow = Number(room.price_per_day || 0) * initialDays;
        const itemsTotalNow = Number(room.items_total || 0);
        const dueNow = Math.max(
            0,
            roomChargeNow + itemsTotalNow - Number(room.initial_payment || 0)
        );

        setCheckoutForm({
            days: initialDays,
            discount: 0,
            paymentMethod: "cash",
            amountReceived: dueNow,
        });
        setAmountReceivedTouched(false);
    };

    const closeCheckout = () => {
        setCheckoutRoom(null);
        setCheckoutForm(null);
        setAmountReceivedTouched(false);
    };

    const checkoutRoomSubtotal =
        (Number(checkoutRoom?.price_per_day) || 0) *
        Math.max(1, Number(checkoutForm?.days) || 1);
    const checkoutItemsTotal = Number(checkoutRoom?.items_total || 0);
    const checkoutSubtotal = checkoutRoomSubtotal + checkoutItemsTotal;
    const checkoutTotal = Math.max(
        0,
        checkoutSubtotal - (Number(checkoutForm?.discount) || 0)
    );
    const checkoutInitialPayment = Number(checkoutRoom?.initial_payment || 0);
    // Amount still owed before whatever gets collected right now.
    const checkoutDueNow = Math.max(0, checkoutTotal - checkoutInitialPayment);

    // Keep "amount collected now" synced to the full due amount as
    // days/discount change, unless the person has typed a custom
    // (e.g. partial) value themselves.
    useEffect(() => {
        if (!checkoutForm || amountReceivedTouched) return;
        setCheckoutForm((prev) =>
            prev ? { ...prev, amountReceived: checkoutDueNow } : prev
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkoutDueNow, amountReceivedTouched]);

    const checkoutAmountReceived = Math.min(
        checkoutDueNow,
        Math.max(0, Number(checkoutForm?.amountReceived) || 0)
    );
    const checkoutRemaining = Math.max(
        0,
        checkoutDueNow - checkoutAmountReceived
    );

    const printCheckoutReceipt = async () => {
        if (!checkoutRoom || !checkoutForm) return;

        const itemLines =
            Array.isArray(checkoutRoom.items) && checkoutRoom.items.length > 0
                ? checkoutRoom.items
                      .map((it) =>
                          pad(
                              `${(it.item_name || "").substring(0, 14).padEnd(
                                  14
                              )} x${String(it.quantity).padEnd(3)} ${formatIQD(
                                  it.line_total
                              )}`
                          )
                      )
                      .join("\n")
                : pad(t("noItemsUsedYet") || "No items used yet");

        const receipt = `
${pad(CLINIC_NAME)}
${pad("--------------------------------")}

${pad(`Room   : ${checkoutRoom.room_number} (${checkoutRoom.department})`)}
${pad(`Animal : ${checkoutRoom.animal_name}`)}
${pad(`Owner  : ${checkoutRoom.customer_name}`)}
${checkoutRoom.customer_phone ? pad(`Phone  : ${checkoutRoom.customer_phone}`) : ""}

${pad(`Date: ${new Date().toLocaleDateString()}`)}
${pad(`Time: ${new Date().toLocaleTimeString()}`)}

${pad("--------------------------------")}
${pad(
    `Room charge  : ${formatIQD(checkoutRoom.price_per_day)} x ${
        checkoutForm.days
    } = ${formatIQD(checkoutRoomSubtotal)} IQD`
)}
${pad("Items used:")}
${itemLines}

${pad("================================")}
${pad(`Subtotal        : ${formatIQD(checkoutSubtotal)} IQD`)}
${pad(`Discount        : ${formatIQD(checkoutForm.discount || 0)} IQD`)}
${pad(`TOTAL           : ${formatIQD(checkoutTotal)} IQD`)}
${pad(`Deposit (prior) : ${formatIQD(checkoutInitialPayment)} IQD`)}
${pad(`Collected now   : ${formatIQD(checkoutAmountReceived)} IQD`)}
${pad(`Remaining       : ${formatIQD(checkoutRemaining)} IQD`)}
${pad(`Payment         : ${checkoutForm.paymentMethod}`)}
${pad("================================")}

\x1D\x56\x00
`;

        await sendToPrinter(receipt, t);
    };


    const submitCheckout = async () => {
    setSavingCheckout(true);
    const loadingToast = toast.loading(t("toastCheckingOut") || "Checking out...");

    try {
        const res = await axios.put(
            `${API_URL}/rooms/${checkoutRoom.id}/checkout`,
            {
                days: Number(checkoutForm.days),
                discount: Number(checkoutForm.discount) || 0,
                paymentMethod: checkoutForm.paymentMethod,
                amountReceived: checkoutAmountReceived,
            },
            { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        if (res.data.partial) {
            toast.success(
                t("toastPartialPaymentRecorded") ||
                    "Payment recorded — room stays occupied until fully paid",
                { id: loadingToast }
            );
        } else {
            toast.success(t("toastCheckedOut") || "Checked out and bill created", {
                id: loadingToast,
            });
            await printCheckoutReceipt();
        }

        closeCheckout();
        await fetchRooms();
    } catch (error) {
        console.error(error);
        toast.error(
            error?.response?.data?.message ||
                t("toastCheckoutFailed") ||
                "Failed to check out",
            { id: loadingToast }
        );
    } finally {
        setSavingCheckout(false);
    }
};

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BedDouble size={20} className="text-orange-500" />
                        {t("rooms") || "Rooms"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2">
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
                            <option value="empty">{t("roomEmpty") || "Empty"}</option>
                            <option value="cleaning">
                                {t("roomCleaning") || "Under cleaning"}
                            </option>
                            <option value="occupied">{t("roomOccupied") || "Occupied"}</option>
                        </select>

                        <Button
                            className="h-10 px-4 bg-gray-800 hover:bg-gray-900 text-white text-sm flex items-center gap-1"
                            onClick={() => navigate("/basket")}
                        >
                            <ShoppingCart size={16} />
                            {t("goToBasket") || "Go to basket"}
                        </Button>

                        <Button
                            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm flex items-center gap-1"
                            onClick={openAddRoom}
                        >
                            <Plus size={16} />
                            {t("addRoom") || "Add room"}
                        </Button>
                    </div>
                </div>
            </Card>

            {loading ? (
                <Card>
                    <p className="text-center text-gray-400 py-10">
                        {t("loading") || "Loading..."}
                    </p>
                </Card>
            ) : filteredRooms.length === 0 ? (
                <Card>
                    <p className="text-center text-gray-400 py-10">
                        {t("noRoomsFound") || "No rooms found"}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map((room) => {
                        const itemsTotal = Number(room.items_total || 0);
                        const roomChargeSoFar =
                            Number(room.price_per_day || 0) * Number(room.days || 1);
                        const roomTotalSoFar = roomChargeSoFar + itemsTotal;
                        const paidSoFar = Number(room.initial_payment || 0);
                        const remainingSoFar = Math.max(0, roomTotalSoFar - paidSoFar);
                        const hasItemizedList =
                            Array.isArray(room.items) && room.items.length > 0;

                        return (
                            <Card key={room.id}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {room.room_number}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {t(`department${room.department}`) ||
                                                room.department}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {room.animal_type === "Dog" ? (
                                            <Dog size={18} className="text-gray-500" />
                                        ) : (
                                            <Cat size={18} className="text-gray-500" />
                                        )}

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[room.status]}`}
                                        >
                                            {t(
                                                `room${room.status.charAt(0).toUpperCase()}${room.status.slice(1)}`
                                            ) || room.status}
                                        </span>

                                        <button
                                            onClick={() => openEditRoom(room)}
                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            title={t("editRoom") || "Edit room"}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                </div>

                                {room.status === "occupied" && (
                                    <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                                        <p className="font-medium text-gray-800">
                                            {room.animal_name}
                                        </p>
                                        <p className="text-gray-600">
                                            {room.customer_name}
                                            {room.customer_phone
                                                ? ` \u00b7 ${room.customer_phone}`
                                                : ""}
                                        </p>
                                        <p className="text-gray-500">
                                            {formatIQD(room.price_per_day)} IQD &times;{" "}
                                            {room.days} {t("days") || "days"} ={" "}
                                            <span className="font-semibold text-orange-600">
                                                {formatIQD(roomChargeSoFar)} IQD
                                            </span>
                                        </p>

                                        {hasItemizedList ? (
                                            <div className="mt-1 space-y-0.5 border-t pt-1">
                                                <p className="text-xs font-medium text-gray-500">
                                                    {t("itemsUsed") || "Items used"}
                                                </p>
                                                {room.items.map((it) => (
                                                    <div
                                                        key={it.id}
                                                        className="flex items-center justify-between text-xs text-gray-500"
                                                    >
                                                        <span>
                                                            {it.item_name}
                                                            {Number(it.quantity) > 1
                                                                ? ` \u00d7${it.quantity}`
                                                                : ""}
                                                        </span>
                                                        <span className="font-semibold text-orange-600">
                                                            {formatIQD(
                                                                it.line_total ?? it.unit_price
                                                            )}{" "}
                                                            IQD
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            itemsTotal > 0 && (
                                                <p className="text-gray-500">
                                                    {t("itemsUsed") || "Items used"}:{" "}
                                                    <span className="font-semibold text-orange-600">
                                                        {formatIQD(itemsTotal)} IQD
                                                    </span>
                                                </p>
                                            )
                                        )}

                                        <div className="mt-1 flex items-center justify-between border-t pt-1">
                                            <span className="text-xs text-gray-500">
                                                {t("depositPaid") || "Deposit paid"}
                                            </span>
                                            <span className="text-xs font-semibold text-green-600">
                                                {formatIQD(paidSoFar)} IQD
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {t("remainingSoFar") || "Remaining (so far)"}
                                            </span>
                                            <span className="text-xs font-semibold text-red-600">
                                                {formatIQD(remainingSoFar)} IQD
                                            </span>
                                        </div>

                                        {room.check_in_date && (
                                            <p className="text-xs text-gray-400">
                                                {t("checkedInOn") || "Checked in"}:{" "}
                                                {new Date(
                                                    room.check_in_date
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4">
                                    {room.status === "empty" && (
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm flex items-center justify-center gap-1"
                                                onClick={() => openCheckin(room)}
                                            >
                                                <LogIn size={14} />
                                                {t("checkIn") || "Check in"}
                                            </Button>
                                            <button
                                                onClick={() => setDeleteRoomId(room.id)}
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                                title={t("delete") || "Delete"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {room.status === "occupied" && (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center justify-center gap-1"
                                                    onClick={() => openItemsModal(room)}
                                                >
                                                    <PackagePlus size={14} />
                                                    {t("addItemsToStay") || "Add items"}
                                                </Button>
                                                <button
                                                    onClick={() => printRoomReceipt(room)}
                                                    className="rounded-lg border border-gray-200 px-3 text-gray-600 hover:bg-gray-50"
                                                    title={t("print") || "Print"}
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <Button
                                                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-sm flex items-center justify-center gap-1"
                                                    onClick={() => openCheckout(room)}
                                                >
                                                    <LogOut size={14} />
                                                    {t("checkOut") || "Check out"}
                                                </Button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            t("confirmCancelOccupation") ||
                                                                "Cancel this occupation? Any items used will be restored to stock and no bill will be created."
                                                        )
                                                    ) {
                                                        cancelOccupation(room.id);
                                                    }
                                                }}
                                                disabled={cancellingRoomId === room.id}
                                                className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 flex items-center justify-center gap-1"
                                            >
                                                <XCircle size={14} />
                                                {cancellingRoomId === room.id
                                                    ? t("cancelling") || "Cancelling..."
                                                    : t("cancelOccupation") ||
                                                      "Cancel occupation"}
                                            </button>
                                        </div>
                                    )}

                                    {room.status === "cleaning" && (
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm flex items-center justify-center gap-1"
                                                onClick={() => markEmpty(room.id)}
                                            >
                                                <Sparkles size={14} />
                                                {t("markReady") || "Mark as ready"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add room modal */}
            {addModalOpen && (
                <Modal
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    title={t("addRoom") || "Add room"}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <Input
                            label={t("roomNumber") || "Room number / name"}
                            value={addForm.roomNumber}
                            onChange={(e) =>
                                setAddForm({ ...addForm, roomNumber: e.target.value })
                            }
                        />

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("department") || "Department"}
                            </label>
                            <select
                                value={addForm.department}
                                onChange={(e) =>
                                    setAddForm({ ...addForm, department: e.target.value })
                                }
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            >
                                {ROOM_DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>
                                        {t(`department${d}`) || d}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("animalType") || "Animal type"}
                            </label>
                            <select
                                value={addForm.animalType}
                                onChange={(e) =>
                                    setAddForm({ ...addForm, animalType: e.target.value })
                                }
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            >
                                {ANIMAL_TYPES.map((a) => (
                                    <option key={a} value={a}>
                                        {t(a.toLowerCase()) || a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={saveRoom}
                                disabled={savingRoom}
                            >
                                {savingRoom
                                    ? t("saving") || "Saving..."
                                    : t("saveChanges") || "Save"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Edit room modal */}
            {editRoom && editForm && (
                <Modal
                    open={!!editRoom}
                    onClose={closeEditRoom}
                    title={`${t("editRoom") || "Edit room"} \u2014 ${editRoom.room_number}`}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <Input
                            label={t("roomNumber") || "Room number / name"}
                            value={editForm.roomNumber}
                            onChange={(e) =>
                                setEditForm({ ...editForm, roomNumber: e.target.value })
                            }
                        />

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("department") || "Department"}
                            </label>
                            <select
                                value={editForm.department}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, department: e.target.value })
                                }
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            >
                                {ROOM_DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>
                                        {t(`department${d}`) || d}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("animalType") || "Animal type"}
                            </label>
                            <select
                                value={editForm.animalType}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, animalType: e.target.value })
                                }
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            >
                                {ANIMAL_TYPES.map((a) => (
                                    <option key={a} value={a}>
                                        {t(a.toLowerCase()) || a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {editRoom.status === "occupied" && (
                            <div className="border-t pt-4 space-y-4">
                                <p className="text-xs font-semibold uppercase text-gray-400">
                                    {t("stayDetails") || "Current stay"}
                                </p>

                                <Input
                                    label={t("customerName") || "Customer name"}
                                    value={editForm.customerName}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            customerName: e.target.value,
                                        })
                                    }
                                />

                                <Input
                                    label={t("phone") || "Phone"}
                                    value={editForm.customerPhone}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            customerPhone: e.target.value,
                                        })
                                    }
                                />

                                <Input
                                    label={t("animalName") || "Animal name"}
                                    value={editForm.animalName}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            animalName: e.target.value,
                                        })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
                                        label={t("pricePerDayIQD") || "Price per day (IQD)"}
                                        value={editForm.pricePerDay}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                pricePerDay: e.target.value,
                                            })
                                        }
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        label={t("numberOfDays") || "Number of days"}
                                        value={editForm.days}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, days: e.target.value })
                                        }
                                    />
                                </div>

                                <Input
                                    type="number"
                                    label={
                                        t("initialPaymentIQD") ||
                                        "Initial payment / deposit (IQD)"
                                    }
                                    value={editForm.initialPayment}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            initialPayment: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeEditRoom}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={saveEditRoom}
                                disabled={savingEditRoom}
                            >
                                {savingEditRoom
                                    ? t("saving") || "Saving..."
                                    : t("saveChanges") || "Save"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Check-in modal */}
            {checkinRoom && checkinForm && (
                <Modal
                    open={!!checkinRoom}
                    onClose={closeCheckin}
                    title={`${t("checkIn") || "Check in"} \u2014 ${checkinRoom.room_number}`}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t("customerName") || "Customer name"}
                            </label>
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute left-3 top-3 text-gray-400"
                                />
                                <input
                                    className="w-full h-10 pl-8 pr-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                                    placeholder={
                                        t("searchOrTypeCustomer") ||
                                        "Search existing or type a new name"
                                    }
                                    value={customerQuery}
                                    onChange={(e) => searchCustomers(e.target.value)}
                                />
                            </div>

                            {customerResults.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                                    {customerResults.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => pickCustomer(c)}
                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-orange-50"
                                        >
                                            <span>{c.name}</span>
                                            <span className="text-xs text-gray-400">{c.phone}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Input
                            label={t("phone") || "Phone"}
                            value={checkinForm.customerPhone}
                            onChange={(e) =>
                                setCheckinForm({ ...checkinForm, customerPhone: e.target.value })
                            }
                        />

                        <Input
                            label={t("animalName") || "Animal name"}
                            value={checkinForm.animalName}
                            onChange={(e) =>
                                setCheckinForm({ ...checkinForm, animalName: e.target.value })
                            }
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="number"
                                label={t("pricePerDayIQD") || "Price per day (IQD)"}
                                value={checkinForm.pricePerDay}
                                onChange={(e) =>
                                    setCheckinForm({
                                        ...checkinForm,
                                        pricePerDay: e.target.value,
                                    })
                                }
                            />
                            <Input
                                type="number"
                                min="1"
                                label={t("numberOfDays") || "Number of days"}
                                value={checkinForm.days}
                                onChange={(e) =>
                                    setCheckinForm({ ...checkinForm, days: e.target.value })
                                }
                            />
                        </div>

                        <Input
                            type="number"
                            label={
                                t("initialPaymentIQD") || "Initial payment / deposit (IQD)"
                            }
                            value={checkinForm.initialPayment}
                            onChange={(e) =>
                                setCheckinForm({
                                    ...checkinForm,
                                    initialPayment: e.target.value,
                                })
                            }
                        />

                        <div className="border-t pt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>{t("total") || "Total"}</span>
                                <span>{formatIQD(checkinTotal)} IQD</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>
                                    {t("remainingAfterDeposit") || "Remaining after deposit"}
                                </span>
                                <span className="text-orange-600">
                                    {formatIQD(checkinRemainingAfterDeposit)} IQD
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeCheckin}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={submitCheckin}
                                disabled={savingCheckin}
                            >
                                {savingCheckin
                                    ? t("saving") || "Saving..."
                                    : t("checkIn") || "Check in"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add items to stay modal */}
            {itemsRoom && (
                <Modal
                    open={!!itemsRoom}
                    onClose={closeItemsModal}
                    title={`${t("addItemsToStay") || "Items used"} \u2014 ${itemsRoom.room_number}`}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-2.5 top-3 text-gray-400"
                            />
                            <input
                                className="w-full h-9 pl-7 pr-2 border rounded-md text-xs outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                                placeholder={t("addItemPlaceholder") || "Search inventory..."}
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                            />

                            {itemSearchResults.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
                                    {itemSearchResults.map((item) => (
                                        <button
                                            key={item.id}
                                            disabled={addingItem}
                                            onClick={() => addStayItem(item)}
                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-orange-50 disabled:opacity-50"
                                        >
                                            <span>{item.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {formatIQD(item.unit_price)} IQD &middot;{" "}
                                                {t("stock") || "Stock"}: {item.quantity}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-3 space-y-2">
                            {loadingStayItems ? (
                                <p className="text-center text-gray-400 py-6 text-sm">
                                    {t("loading") || "Loading..."}
                                </p>
                            ) : stayItems.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 text-sm">
                                    {t("noItemsUsedYet") || "No items used yet"}
                                </p>
                            ) : (
                                stayItems.map((it) => (
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
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-orange-600">
                                                {formatIQD(it.line_total)} IQD
                                            </span>
                                            <button
                                                onClick={() => deleteStayItem(it)}
                                                disabled={deletingItemId === it.id}
                                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                                title={t("delete") || "Delete"}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900">
                            <span>{t("itemsTotal") || "Items total"}</span>
                            <span className="text-orange-600">
                                {formatIQD(stayItemsTotal)} IQD
                            </span>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button variant="secondary" onClick={closeItemsModal}>
                                {t("close") || "Close"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Check-out modal */}
            {checkoutRoom && checkoutForm && (
                <Modal
                    open={!!checkoutRoom}
                    onClose={closeCheckout}
                    title={`${t("checkOut") || "Check out"} \u2014 ${checkoutRoom.room_number}`}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                            <p className="font-medium text-gray-800">
                                {checkoutRoom.animal_name}
                            </p>
                            <p className="text-gray-600">
                                {checkoutRoom.customer_name}
                                {checkoutRoom.customer_phone
                                    ? ` \u00b7 ${checkoutRoom.customer_phone}`
                                    : ""}
                            </p>
                            <p className="text-gray-500">
                                {formatIQD(checkoutRoom.price_per_day)} IQD / {t("day") || "day"}
                            </p>
                        </div>

                        <Input
                            type="number"
                            min="1"
                            label={t("actualNumberOfDays") || "Actual number of days"}
                            value={checkoutForm.days}
                            onChange={(e) =>
                                setCheckoutForm({ ...checkoutForm, days: e.target.value })
                            }
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                type="number"
                                label={t("discountIQD") || "Discount (IQD)"}
                                value={checkoutForm.discount}
                                onChange={(e) =>
                                    setCheckoutForm({ ...checkoutForm, discount: e.target.value })
                                }
                            />

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t("payment") || "Payment"}
                                </label>
                                <select
                                    value={checkoutForm.paymentMethod}
                                    onChange={(e) =>
                                        setCheckoutForm({
                                            ...checkoutForm,
                                            paymentMethod: e.target.value,
                                        })
                                    }
                                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                                >
                                    <option value="cash">{t("cash") || "Cash"}</option>
                                    <option value="card">{t("card") || "Card"}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t("amountCollectedNow") || "Amount collected now (IQD)"}
                                </label>
                                {amountReceivedTouched && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAmountReceivedTouched(false);
                                            setCheckoutForm((prev) => ({
                                                ...prev,
                                                amountReceived: checkoutDueNow,
                                            }));
                                        }}
                                        className="text-xs font-medium text-orange-600 hover:underline"
                                    >
                                        {t("collectFullAmount") || "Collect full amount"}
                                    </button>
                                )}
                            </div>
                            <input
                                type="number"
                                value={checkoutForm.amountReceived}
                                onChange={(e) => {
                                    setAmountReceivedTouched(true);
                                    setCheckoutForm({
                                        ...checkoutForm,
                                        amountReceived: e.target.value,
                                    });
                                }}
                                className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                {t("amountCollectedNowHint") ||
                                    "Defaults to the full amount still owed. Lower it only if the customer is paying partially and will owe the rest."}
                            </p>
                        </div>

                        <div className="border-t pt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>{t("roomCharge") || "Room charge"}</span>
                                <span>{formatIQD(checkoutRoomSubtotal)} IQD</span>
                            </div>

                            {checkoutItemsTotal > 0 && (
                                <div className="flex justify-between text-gray-500">
                                    <span>{t("itemsUsed") || "Items used"}</span>
                                    <span>{formatIQD(checkoutItemsTotal)} IQD</span>
                                </div>
                            )}

                            <div className="flex justify-between text-gray-500">
                                <span>{t("subtotal") || "Subtotal"}</span>
                                <span>{formatIQD(checkoutSubtotal)} IQD</span>
                            </div>

                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>{t("total") || "Total"}</span>
                                <span className="text-orange-600">
                                    {formatIQD(checkoutTotal)} IQD
                                </span>
                            </div>

                            {checkoutInitialPayment > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>{t("depositPaid") || "Deposit paid (prior)"}</span>
                                    <span>-{formatIQD(checkoutInitialPayment)} IQD</span>
                                </div>
                            )}

                            <div className="flex justify-between text-green-600">
                                <span>{t("collectedNow") || "Collected now"}</span>
                                <span>-{formatIQD(checkoutAmountReceived)} IQD</span>
                            </div>

                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>{t("remainingToCollect") || "Remaining after this"}</span>
                                <span className={checkoutRemaining > 0 ? "text-red-600" : "text-green-600"}>
                                    {formatIQD(checkoutRemaining)} IQD
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeCheckout}>
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={printCheckoutReceipt}
                                className="flex items-center gap-1"
                            >
                                <Printer size={14} />
                                {t("print") || "Print"}
                            </Button>
                            <Button
                                className="bg-gray-800 hover:bg-gray-900 text-white"
                                onClick={submitCheckout}
                                disabled={savingCheckout}
                            >
                                {savingCheckout
                                    ? t("saving") || "Saving..."
                                    : t("checkOut") || "Check out & create bill"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete room confirm */}
            {deleteRoomId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">
                            {t("deleteRoom") || "Delete room"}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {t("deleteRoomMessage") ||
                                "Are you sure you want to delete this room? This action cannot be undone."}
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteRoomId(null)}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                            <button
                                onClick={confirmDeleteRoom}
                                disabled={deletingRoom}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                {deletingRoom ? "Deleting..." : t("delete") || "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}