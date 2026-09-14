import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import {
    Store,
    Stethoscope,
    Scissors,
    Building2,
    Search,
    Plus,
    Minus,
    Trash2,
    ShoppingCart,
    Printer,
    Receipt,
    X,
    CheckCircle2,
    Users,
    Wallet,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Change this to match the exact printer name registered in QZ Tray
const PRINTER_NAME = "POSPrinter POS80";

// Clinic branding shown on the on-screen receipt and the printed bill
const CLINIC_NAME = "Dr.Bakhtyar Pet Clinic";
const CLINIC_LOCATION = "هەولێر - نازناز، نزیک کوین تاوەر";
const CLINIC_PHONE = "0751 024 2525";

// Name of the Salon shareholder the split is calculated against.
// Change this if the partner's name is different.
const SALON_PARTNER_NAME = "Parvis";

const DEPARTMENTS = [
    { key: "Shop", icon: Store, color: "orange" },
    { key: "Clinic", icon: Stethoscope, color: "blue" },
    { key: "Salon", icon: Scissors, color: "pink" },
];

// Tailwind needs full class names at build time, so map colors explicitly
const DEPT_STYLES = {
    orange: {
        active: "bg-orange-500 text-white shadow-md shadow-orange-200",
        idle: "text-orange-600 hover:bg-orange-50",
        chip: "bg-orange-100 text-orange-700",
        ring: "focus:ring-orange-100 focus:border-orange-500",
        icon: "text-orange-500",
    },
    blue: {
        active: "bg-blue-500 text-white shadow-md shadow-blue-200",
        idle: "text-blue-600 hover:bg-blue-50",
        chip: "bg-blue-100 text-blue-700",
        ring: "focus:ring-blue-100 focus:border-blue-500",
        icon: "text-blue-500",
    },
    pink: {
        active: "bg-pink-500 text-white shadow-md shadow-pink-200",
        idle: "text-pink-600 hover:bg-pink-50",
        chip: "bg-pink-100 text-pink-700",
        ring: "focus:ring-pink-100 focus:border-pink-500",
        icon: "text-pink-500",
    },
    purple: {
        active: "bg-purple-500 text-white shadow-md shadow-purple-200",
        idle: "text-purple-600 hover:bg-purple-50",
        chip: "bg-purple-100 text-purple-700",
        ring: "focus:ring-purple-100 focus:border-purple-500",
        icon: "text-purple-500",
    },
};

export default function Basket() {
    const { t, i18n } = useTranslation();
    const isRtl = ["ar", "ku"].includes(i18n.language);

    const [department, setDepartment] = useState("Shop");
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [search, setSearch] = useState("");

    const emptyBasket = () => ({
        cart: [], // [{ inventoryId, name, unit_price, quantity, stock }]
        customerName: "",
        customerPhone: "",
        discount: "",
        paymentMethod: "cash",
        days: "1",
        splitWithPartner: false, // Salon-only: 50/50 split toggle
        debtInitialPayment: "", // only used when paymentMethod === "debt"
    });

    // Hospital and Clinic bills are charged per day of stay/treatment
    const usesDays = (dept) => dept === "Hotel";
    //const usesDays = (dept) => dept === "Hotel" || dept === "Clinic";

    // Only the Salon department has a shareholder split
    const usesSplit = (dept) => dept === "Salon";

    // Each department keeps its own independent basket, so switching
    // tabs never touches what you've already added elsewhere.
    const [baskets, setBaskets] = useState({
        Shop: emptyBasket(),
        Clinic: emptyBasket(),
        Salon: emptyBasket(),
        Hotel: emptyBasket(),
    });

    const basket = baskets[department];
    const cart = basket.cart;
    const customerName = basket.customerName;
    const customerPhone = basket.customerPhone;
    const discount = basket.discount;
    const paymentMethod = basket.paymentMethod;
    const days = basket.days;
    const splitWithPartner = basket.splitWithPartner;
    const debtInitialPayment = basket.debtInitialPayment;

    const isDebt = paymentMethod === "debt";

    const updateBasket = (patch) => {
        setBaskets((prev) => ({
            ...prev,
            [department]: { ...prev[department], ...patch },
        }));
    };

    const setCart = (updater) => {
        setBaskets((prev) => {
            const current = prev[department];
            const nextCart =
                typeof updater === "function"
                    ? updater(current.cart)
                    : updater;

            return {
                ...prev,
                [department]: { ...current, cart: nextCart },
            };
        });
    };

    const setCustomerName = (value) => updateBasket({ customerName: value });
    const setCustomerPhone = (value) => updateBasket({ customerPhone: value });
    const setDiscount = (value) => updateBasket({ discount: value });
    const setPaymentMethod = (value) => updateBasket({ paymentMethod: value });
    const setDays = (value) => updateBasket({ days: value });
    const setSplitWithPartner = (value) => updateBasket({ splitWithPartner: value });
    const setDebtInitialPayment = (value) => updateBasket({ debtInitialPayment: value });

    const [checkingOut, setCheckingOut] = useState(false);
    const [receiptBill, setReceiptBill] = useState(null);

    const [recentBills, setRecentBills] = useState([]);
    const [billSearch, setBillSearch] = useState("");

    // Full details for a clicked recent bill: { bill, items }
    const [selectedBill, setSelectedBill] = useState(null);
    const [loadingBillDetails, setLoadingBillDetails] = useState(false);

    // ---------- Customer autocomplete (Customer Name / Phone) ----------
    // 'name' | 'phone' | null — which field currently owns the open
    // dropdown, so we don't show suggestions under both at once.
    const [customerDropdownField, setCustomerDropdownField] = useState(null);
    const [customerResults, setCustomerResults] = useState([]);
    // Set right before we programmatically fill in name+phone from a
    // selected customer, so the very next search effect run (which
    // would otherwise fire because the values just changed) is skipped.
    const skipCustomerSearchRef = useRef(false);

    const getToken = () => localStorage.getItem("token");
    const currentDept = DEPARTMENTS.find(d => d.key === department);
    const style = DEPT_STYLES[currentDept.color];

    const chipStyleFor = (deptKey) => {
        const d = DEPARTMENTS.find((x) => x.key === deptKey);
        return d ? DEPT_STYLES[d.color].chip : DEPT_STYLES.orange.chip;
    };

    const formatIQD = (amount) =>
        new Intl.NumberFormat("en-IQ", {
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);

    // ---------- Data loading ----------

    const fetchInventory = async () => {
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

    const fetchRecentBills = async (dept) => {
        try {
            const res = await axios.get(`${API_URL}/bills`, {
                params: { department: dept },
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            setRecentBills(res.data);
        } catch (error) {
            console.error("Bills Error:", error);
        }
    };

    const fetchBillDetails = async (id) => {
        setLoadingBillDetails(true);

        try {
            const res = await axios.get(`${API_URL}/bills/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            setSelectedBill(res.data);
        } catch (error) {
            console.error("Bill Details Error:", error);
            toast.error(t("toastFailLoadBill") || "Failed to load bill details");
        } finally {
            setLoadingBillDetails(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        fetchRecentBills(department);
        setBillSearch("");
        // Switching departments switches to a different basket's
        // name/phone, so close any open customer dropdown to avoid
        // showing stale suggestions under the wrong values.
        setCustomerDropdownField(null);
        setCustomerResults([]);
    }, [department]);

    // Search the customers table whenever the field that owns the
    // dropdown changes value. The backend already matches on name OR
    // phone (ILIKE), so either field can drive the same search.
    useEffect(() => {
        if (skipCustomerSearchRef.current) {
            skipCustomerSearchRef.current = false;
            return;
        }

        if (!customerDropdownField) {
            return;
        }

        const query =
            customerDropdownField === "phone" ? customerPhone : customerName;

        if (!query || !query.trim()) {
            setCustomerResults([]);
            return;
        }

        const handle = setTimeout(async () => {
            try {
                const res = await axios.get(`${API_URL}/customers`, {
                    params: { search: query.trim() },
                    headers: { Authorization: `Bearer ${getToken()}` },
                });

                setCustomerResults(res.data);
            } catch (error) {
                console.error("Customer search error:", error);
            }
        }, 250);

        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerName, customerPhone, customerDropdownField]);

    const selectCustomer = (customer) => {
        skipCustomerSearchRef.current = true;
        setCustomerName(customer.name || "");
        setCustomerPhone(customer.phone || "");
        setCustomerResults([]);
        setCustomerDropdownField(null);
    };

    // Small delay on blur so a click on a dropdown row registers
    // before the dropdown unmounts.
    const closeCustomerDropdownSoon = (field) => {
        setTimeout(() => {
            setCustomerDropdownField((current) =>
                current === field ? null : current
            );
        }, 150);
    };

    // ---------- Product list for the active department ----------

    const departmentItems = useMemo(() => {
        return items.filter(
            (item) =>
                item.subcategory === department &&
                Number(item.quantity) > 0
        );
    }, [items, department]);

    const filteredItems = useMemo(() => {
        if (!search.trim()) return departmentItems;

        const q = search.toLowerCase();

        return departmentItems.filter(
            (item) =>
                (item.name || "").toLowerCase().includes(q) ||
                (item.barcode || "").toLowerCase().includes(q)
        );
    }, [departmentItems, search]);

    // ---------- Recent bills search ----------

    const filteredRecentBills = useMemo(() => {
        if (!billSearch.trim()) return recentBills;

        const q = billSearch.toLowerCase();

        return recentBills.filter((bill) => {
            const idMatch = String(bill.id).includes(q);
            const nameMatch = (bill.customer_name || "")
                .toLowerCase()
                .includes(q);
            const phoneMatch = (bill.customer_phone || "")
                .toLowerCase()
                .includes(q);

            return idMatch || nameMatch || phoneMatch;
        });
    }, [recentBills, billSearch]);

    // ---------- Cart logic ----------

    const cartQtyFor = (inventoryId) =>
        cart.find((c) => c.inventoryId === inventoryId)?.quantity || 0;

    const addToCart = (item) => {
        const inCart = cartQtyFor(item.id);

        if (inCart >= Number(item.quantity)) {
            toast.error(t("basketNoMoreStock") || "No more stock available");
            return;
        }

        setCart((prev) => {
            const existing = prev.find((c) => c.inventoryId === item.id);

            if (existing) {
                return prev.map((c) =>
                    c.inventoryId === item.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                );
            }

            return [
                ...prev,
                {
                    inventoryId: item.id,
                    name: item.name,
                    unit_price: Number(item.unit_price),
                    quantity: 1,
                    stock: Number(item.quantity),
                },
            ];
        });
    };

    const changeQty = (inventoryId, delta) => {
        setCart((prev) =>
            prev
                .map((c) => {
                    if (c.inventoryId !== inventoryId) return c;

                    const nextQty = c.quantity + delta;

                    if (nextQty > c.stock) {
                        toast.error(
                            t("basketNoMoreStock") || "No more stock available"
                        );
                        return c;
                    }

                    return { ...c, quantity: nextQty };
                })
                .filter((c) => c.quantity > 0)
        );
    };

    const removeFromCart = (inventoryId) => {
        setCart((prev) => prev.filter((c) => c.inventoryId !== inventoryId));
    };

    const dayCount = usesDays(department)
        ? Math.max(1, Number(days) || 1)
        : 1;

    const perDaySubtotal = useMemo(
        () => cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0),
        [cart]
    );

    const subtotal = perDaySubtotal * dayCount;

    const discountValue = Number(discount) || 0;
    const total = Math.max(0, subtotal - discountValue);

    // Whether this sale is actually split 50/50 with the partner:
    // only true for Salon AND only when the toggle is switched on.
    // Everywhere else in this component that needs to know whether a
    // split applies should read this flag, not just usesSplit(department).
    const isSplitActive = usesSplit(department) && splitWithPartner;

    // FIX: previously these were always `total / 2` regardless of the
    // toggle, so the business always looked like it kept only half.
    // Now: when the split is off (or department isn't Salon), the
    // business keeps the full total and the partner's share is 0.
    const myShare = isSplitActive ? total / 2 : total;
    const partnerShare = isSplitActive ? total / 2 : 0;

    // Only meaningful when paymentMethod === "debt"
    const debtInitialPaymentValue = Math.min(
        total,
        Math.max(0, Number(debtInitialPayment) || 0)
    );
    const debtRemaining = Math.max(0, total - debtInitialPaymentValue);

    const resetBasket = () => {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setDiscount("");
        setPaymentMethod("cash");
        setDays("1");
        setSplitWithPartner(false);
        setDebtInitialPayment("");
    };

    // ---------- Checkout ----------

    const checkout = async () => {
        if (cart.length === 0) {
            toast.error(t("basketEmpty") || "Your basket is empty");
            return;
        }

        if (isDebt && !customerName.trim()) {
            toast.error(
                t("debtRequiresCustomer") ||
                    "Customer name is required for a debt sale"
            );
            return;
        }

        setCheckingOut(true);
        const loadingToast = toast.loading(
            isDebt
                ? t("toastSavingDebt") || "Saving debt..."
                : t("toastSavingBill") || "Saving bill..."
        );

        // Whether this sale is actually split 50/50 with the partner.
        // Only meaningful (and only ever true) for Salon, and only
        // when the toggle is on — this is the single source of truth
        // sent to the backend, saved on the bill/debt itself, so the
        // report can later tell split sales apart from non-split ones
        // instead of assuming every Salon sale is split.
        const isSplitBill = isSplitActive;

        try {
            const endpoint = isDebt ? "debts" : "bills";

            const payload = {
                department,
                customerName,
                customerPhone,
                discount: discountValue,
                paymentMethod: isDebt ? "debt" : paymentMethod,
                days: dayCount,
                isSplitBill,
                items: cart.map((c) => ({
                    inventoryId: c.inventoryId,
                    name: c.name,
                    unitPrice: c.unit_price,
                    quantity: c.quantity,
                })),
            };

            if (isDebt) {
                payload.initialPayment = debtInitialPaymentValue;
            }

            const res = await axios.post(
                `${API_URL}/${endpoint}`,
                payload,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            toast.success(
                isDebt
                    ? t("toastDebtSaved") || "Debt saved"
                    : t("toastBillSaved") || "Bill saved",
                { id: loadingToast }
            );

            // FIX: myShare/partnerShare on the receipt now also respect
            // whether this particular sale was actually split, instead
            // of always halving the total.
            setReceiptBill({
                ...res.data,
                items: cart,
                department,
                customerName,
                customerPhone,
                days: dayCount,
                perDaySubtotal,
                isSplitBill,
                myShare: isSplitBill
                    ? Number(res.data.total) / 2
                    : Number(res.data.total),
                partnerShare: isSplitBill ? Number(res.data.total) / 2 : 0,
                isDebt,
            });

            await fetchInventory();

            if (!isDebt) {
                await fetchRecentBills(department);
            }

            resetBasket();
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message ||
                    (isDebt
                        ? t("toastDebtFailed")
                        : t("toastBillFailed")) ||
                    "Failed to save",
                { id: loadingToast }
            );
        } finally {
            setCheckingOut(false);
        }
    };

    // ---------- QZ Tray printing ----------

    const getStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    };

    const printCustomBill = async () => {
        if (!receiptBill) return;

        try {
            const qz = window.qz;

            if (!qz) {
                toast.error(
                    t("qzNotRunning") ||
                        "QZ Tray is not installed or running."
                );
                return;
            }

            if (!qz.websocket.isActive()) {
                await qz.websocket.connect();
            }

            const printer = await qz.printers.find(PRINTER_NAME);
            const config = qz.configs.create(printer);

            const storedUser = getStoredUser();
            const seller =
                storedUser?.username ||
                storedUser?.firstName ||
                t("staff") ||
                "Staff";
            const buyer = receiptBill.customerName || t("guest") || "Guest";

            const pad = (text) => "     " + text; // left margin (creates right padding effect)

            const itemLines = receiptBill.items
                .map((c) =>
                    pad(
                        `${c.name.substring(0, 12).padEnd(12)} ${String(
                            c.quantity
                        ).padEnd(3)} ${String(c.unit_price).padEnd(
                            6
                        )} ${(c.unit_price * c.quantity).toFixed(2)}`
                    )
                )
                .join("\n");

            const createdAt = new Date(
                receiptBill.created_at || Date.now()
            );

            const dayLine =
                receiptBill.days > 1
                    ? `${pad(
                          `${t("dayRate") || "Per day"} x ${receiptBill.days}`
                      )}\n`
                    : "";

            // REMOVED: splitLines. The printed customer-facing receipt
            // should never show the internal Salon/Parvis 50-50 split —
            // that's business-side bookkeeping, not something the
            // customer needs to see. The on-screen confirmation modal
            // still shows it for your own records.

            const debtLines = receiptBill.isDebt
                ? `${pad("------------------------------")}\n` +
                  `${pad(`Paid now   : ${formatIQD(receiptBill.amount_paid)}`)}\n` +
                  `${pad(`Remaining  : ${formatIQD(receiptBill.remaining_amount)}`)}\n` +
                  `${pad("(DEBT SALE - unpaid balance)")}\n`
                : "";

            // ESC/POS control codes for a clearer layout. Thermal POS80
            // printers are monochrome (black only) — they can't print
            // actual color — so "emphasis" here means centered/bold/
            // larger text for the clinic name and the total, instead.
            const ESC = {
                center: "\x1B\x61\x01",
                left: "\x1B\x61\x00",
                boldOn: "\x1B\x45\x01",
                boldOff: "\x1B\x45\x00",
                big: "\x1D\x21\x11",
                normal: "\x1D\x21\x00",
                cut: "\x1D\x56\x00",
            };

            const receipt =
                ESC.center +
                ESC.boldOn +
                ESC.big +
                `${CLINIC_NAME}\n` +
                ESC.normal +
                ESC.boldOff +
                `${CLINIC_LOCATION}\n` +
                `${CLINIC_PHONE}\n` +
                `--------------------------------\n\n` +
                ESC.left +
                pad(
                    `Dept  : ${
                        t(`department${receiptBill.department}`) ||
                        receiptBill.department
                    }`
                ) +
                "\n" +
                pad(`Seller: ${seller}`) +
                "\n" +
                pad(`Buyer : ${buyer}`) +
                "\n\n" +
                pad(`Date: ${createdAt.toLocaleDateString()}`) +
                "\n" +
                pad(`Time: ${createdAt.toLocaleTimeString()}`) +
                "\n\n\n" +
                pad("Item        Qty   Price  Total") +
                "\n" +
                pad("------------------------------") +
                "\n" +
                itemLines +
                "\n\n" +
                dayLine +
                pad("==============================") +
                "\n" +
                pad(`Subtotal : ${formatIQD(receiptBill.subtotal)}`) +
                "\n" +
                pad(`Discount : ${formatIQD(receiptBill.discount)}`) +
                "\n" +
                ESC.boldOn +
                pad(`TOTAL    : ${formatIQD(receiptBill.total)}`) +
                "\n" +
                ESC.boldOff +
                pad("==============================") +
                "\n" +
                debtLines +
                "\n" +
                ESC.center +
                "Thank you for visiting us!\n\n\n\n\n" +
                ESC.cut;

            const data = [
                {
                    type: "raw",
                    format: "plain",
                    data: receipt,
                },
            ];

            await qz.print(config, data);
        } catch (err) {
            console.error("Print error:", err);
            toast.error(t("toastPrintFailed") || "Failed to print receipt");
        }
    };

    return (
        <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">

            {/* Department tabs + quick links to Customers / Rooms */}
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {DEPARTMENTS.map(({ key, icon: Icon, color }) => {
                            const s = DEPT_STYLES[color];
                            const active = department === key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setDepartment(key)}
                                    className={`
                                        flex items-center gap-2 px-5 py-3 rounded-xl
                                        font-semibold text-sm transition
                                        ${active ? s.active : `bg-gray-50 ${s.idle}`}
                                    `}
                                >
                                    <Icon size={18} />
                                    {t(`department${key}`) || key}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/customers"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition"
                        >
                            <Users size={16} />
                            {t("customers") || "Customers"}
                        </Link>

                        <Link
                            to="/rooms"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition"
                        >
                            <Building2 size={16} />
                            {t("rooms") || "Rooms"}
                        </Link>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Product picker */}
                <div className="lg:col-span-2 space-y-4">

                    <Card>
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-3 text-gray-400"
                            />
                            <input
                                className={`w-full h-11 pl-10 border rounded-lg px-3 text-sm outline-none focus:ring-4 ${style.ring}`}
                                placeholder={
                                    t("basketSearchPlaceholder") ||
                                    `Search ${department} items...`
                                }
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </Card>

                    <Card>
                        {loadingItems ? (
                            <p className="text-center text-gray-400 py-10">
                                {t("loading") || "Loading..."}
                            </p>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <ShoppingCart className="mx-auto mb-2" size={28} />
                                <p>
                                    {t("basketNoItems") ||
                                        `No ${department} items in stock`}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredItems.map((item) => {
                                    const inCart = cartQtyFor(item.id);
                                    const outOfRoom =
                                        inCart >= Number(item.quantity);

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            disabled={outOfRoom}
                                            className={`
                                                relative flex flex-col items-start
                                                rounded-xl border p-4 text-left
                                                transition
                                                ${outOfRoom
                                                    ? "opacity-40 cursor-not-allowed border-gray-200"
                                                    : "border-gray-200 hover:border-orange-300 hover:shadow-md"
                                                }
                                            `}
                                        >
                                            {inCart > 0 && (
                                                <span className={`absolute -top-2 -right-2 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${style.chip}`}>
                                                    {inCart}
                                                </span>
                                            )}

                                            <span className="font-semibold text-gray-800 line-clamp-2">
                                                {item.name}
                                            </span>

                                            <span className="mt-1 text-orange-600 font-bold">
                                                {formatIQD(item.unit_price)} IQD
                                            </span>

                                            <span className="mt-1 text-xs text-gray-400">
                                                {t("stock") || "Stock"}: {item.quantity}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Recent bills for this department */}
                    <Card>
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Receipt size={18} className="text-orange-500" />
                                {t("basketRecentBills") || "Recent bills"} - {t(`department${department}`) || department}
                            </h3>

                            <div className="relative w-36 sm:w-56 shrink-0">
                                <Search
                                    size={14}
                                    className="absolute left-2.5 top-2.5 text-gray-400"
                                />
                                <input
                                    className={`w-full h-8 pl-7 pr-2 border rounded-md text-xs outline-none focus:ring-2 ${style.ring}`}
                                    placeholder={t("searchBills") || "Search bills..."}
                                    value={billSearch}
                                    onChange={(e) => setBillSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {filteredRecentBills.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                {billSearch.trim()
                                    ? t("basketNoBillsMatch") || "No bills match your search"
                                    : t("basketNoBillsYet") || "No bills yet"}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b">
                                            <th className="py-2 pr-4">
                                                {t("bill") || "Bill"}
                                            </th>
                                            <th className="py-2 pr-4">
                                                {t("customers") || "Customer"}
                                            </th>
                                            <th className="py-2 pr-4">
                                                {t("total") || "Total"}
                                            </th>
                                            <th className="py-2 pr-4">
                                                {t("date") || "Date"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecentBills.slice(0, 8).map((bill) => (
                                            <tr
                                                key={bill.id}
                                                onClick={() => fetchBillDetails(bill.id)}
                                                className="border-b last:border-0 cursor-pointer hover:bg-orange-50/60 transition"
                                            >
                                                <td className="py-2 pr-4 font-medium">
                                                    #{String(bill.id).padStart(5, "0")}
                                                </td>
                                                <td className="py-2 pr-4 text-gray-600">
                                                    {bill.customer_name || "-"}
                                                </td>
                                                <td className="py-2 pr-4 font-semibold text-orange-600">
                                                    {formatIQD(bill.total)} IQD
                                                </td>
                                                <td className="py-2 pr-4 text-gray-500">
                                                    {new Date(bill.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Basket / cart */}
                <div className="lg:sticky lg:top-4 h-fit space-y-4">
                    <Card>
                        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                            <ShoppingCart size={18} className={style.icon} />
                            {t("basketTitle") || "Basket"}
                        </h3>

                        {cart.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-400">
                                {t("basketEmptyHint") ||
                                    "Tap an item to add it to the basket"}
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {cart.map((c) => (
                                    <div
                                        key={c.inventoryId}
                                        className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-sm text-gray-800">
                                                {c.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatIQD(c.unit_price)} IQD
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() =>
                                                    changeQty(c.inventoryId, -1)
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
                                                    changeQty(c.inventoryId, 1)
                                                }
                                                className="rounded-md bg-white border p-1 hover:bg-gray-100"
                                            >
                                                <Plus size={14} />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    removeFromCart(c.inventoryId)
                                                }
                                                className="ml-1 rounded-md p-1 text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 space-y-3 border-t pt-4">
                            {/* Customer name with autocomplete from the customers table */}
                            <div className="relative">
                                <Input
                                    label={
                                        isDebt
                                            ? t("customerNameRequired") || "Customer name (required for debt)"
                                            : t("customerNameOptional") || "Customer name (optional)"
                                    }
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        setCustomerDropdownField("name");
                                    }}
                                    onFocus={() => setCustomerDropdownField("name")}
                                    onBlur={() => closeCustomerDropdownSoon("name")}
                                    autoComplete="off"
                                />

                                {customerDropdownField === "name" &&
                                    customerResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-52 overflow-y-auto">
                                            {customerResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => selectCustomer(c)}
                                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-orange-50"
                                                >
                                                    <span className="font-medium text-gray-800 truncate">
                                                        {c.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 shrink-0">
                                                        {c.phone || "-"}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>

                            {/* Customer phone with the same autocomplete */}
                            <div className="relative">
                                <Input
                                    label={t("customerPhoneOptional") || "Phone (optional)"}
                                    value={customerPhone}
                                    onChange={(e) => {
                                        setCustomerPhone(e.target.value);
                                        setCustomerDropdownField("phone");
                                    }}
                                    onFocus={() => setCustomerDropdownField("phone")}
                                    onBlur={() => closeCustomerDropdownSoon("phone")}
                                    autoComplete="off"
                                />

                                {customerDropdownField === "phone" &&
                                    customerResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-52 overflow-y-auto">
                                            {customerResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => selectCustomer(c)}
                                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-orange-50"
                                                >
                                                    <span className="font-medium text-gray-800 truncate">
                                                        {c.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 shrink-0">
                                                        {c.phone || "-"}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>

                            {usesDays(department) && (
                                <Input
                                    type="number"
                                    min="1"
                                    label={
                                        t("numberOfDays") ||
                                        `Number of days (${t(`department${department}`) || department})`
                                    }
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                />
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="number"
                                    label={t("discountIQD") || "Discount (IQD)"}
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        {t("payment") || "Payment"}
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:border-orange-500 focus:outline-none"
                                    >
                                        <option value="cash">
                                            {t("cash") || "Cash"}
                                        </option>
                                        <option value="card">
                                            {t("card") || "Card"}
                                        </option>
                                        <option value="debt">
                                            {t("debt") || "Debt"}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Debt-only: optional partial payment made right now */}
                            {isDebt && (
                                <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 space-y-3">
                                    <p className="flex items-center gap-2 text-sm font-medium text-red-700">
                                        <Wallet size={16} />
                                        {t("debtSaleNotice") ||
                                            "This sale will be recorded as a customer debt, not a paid bill."}
                                    </p>

                                    <Input
                                        type="number"
                                        min="0"
                                        label={
                                            t("debtInitialPayment") ||
                                            "Amount paid now (optional)"
                                        }
                                        value={debtInitialPayment}
                                        onChange={(e) =>
                                            setDebtInitialPayment(e.target.value)
                                        }
                                    />

                                    <div className="flex justify-between text-sm font-semibold text-red-700">
                                        <span>
                                            {t("remainingDebt") || "Remaining debt"}
                                        </span>
                                        <span>{formatIQD(debtRemaining)} IQD</span>
                                    </div>
                                </div>
                            )}

                            {/* Salon-only 50/50 shareholder split toggle */}
                            {usesSplit(department) && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSplitWithPartner(!splitWithPartner)
                                    }
                                    className={`
                                        w-full flex items-center justify-between gap-2
                                        rounded-lg border px-3 py-2.5 text-sm font-medium
                                        transition
                                        ${splitWithPartner
                                            ? "border-pink-400 bg-pink-50 text-pink-700"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        <Users size={16} />
                                        {t("splitWithPartner") ||
                                            `Split 50/50 with ${SALON_PARTNER_NAME}`}
                                    </span>

                                    <span
                                        className={`
                                            relative inline-flex h-5 w-9 shrink-0 items-center
                                            rounded-full transition
                                            ${splitWithPartner ? "bg-pink-500" : "bg-gray-300"}
                                        `}
                                    >
                                        <span
                                            className={`
                                                inline-block h-4 w-4 transform rounded-full
                                                bg-white transition
                                                ${splitWithPartner ? "translate-x-4" : "translate-x-0.5"}
                                            `}
                                        />
                                    </span>
                                </button>
                            )}

                            <div className="space-y-1 pt-2 text-sm">
                                {usesDays(department) && dayCount > 1 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>
                                            {formatIQD(perDaySubtotal)} IQD × {dayCount}{" "}
                                            {t("days") || "days"}
                                        </span>
                                        <span>{formatIQD(subtotal)} IQD</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-500">
                                    <span>{t("subtotal") || "Subtotal"}</span>
                                    <span>{formatIQD(subtotal)} IQD</span>
                                </div>

                                {discountValue > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>{t("discount") || "Discount"}</span>
                                        <span>-{formatIQD(discountValue)} IQD</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                                    <span>{t("total") || "Total"}</span>
                                    <span className="text-orange-600">
                                        {formatIQD(total)} IQD
                                    </span>
                                </div>

                                {isSplitActive && (
                                    <div className="mt-2 rounded-lg border border-pink-200 bg-pink-50/60 p-3 space-y-1">
                                        <div className="flex justify-between text-pink-700 font-medium">
                                            <span>
                                                {t("myShare") || "My share"} (50%)
                                            </span>
                                            <span>{formatIQD(myShare)} IQD</span>
                                        </div>
                                        <div className="flex justify-between text-pink-700 font-medium">
                                            <span>
                                                {SALON_PARTNER_NAME} {t("share") || "share"} (50%)
                                            </span>
                                            <span>{formatIQD(partnerShare)} IQD</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                className={`w-full h-12 text-white text-base ${
                                    isDebt
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-orange-500 hover:bg-orange-600"
                                }`}
                                onClick={checkout}
                                disabled={checkingOut || cart.length === 0}
                            >
                                {checkingOut
                                    ? t("processing") || "Processing..."
                                    : isDebt
                                    ? t("saveAsDebt") || "Save as Debt"
                                    : t("completeSale") || "Complete Sale"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Receipt modal (shown right after a successful sale) */}
            {receiptBill && (
                <Modal
                    open={!!receiptBill}
                    onClose={() => setReceiptBill(null)}
                    title={
                        receiptBill.isDebt
                            ? t("debtSaved") || "Debt saved"
                            : t("saleComplete") || "Sale complete"
                    }
                    className="max-w-md"
                >
                    <div className="space-y-4">

                        <div
                            className={`flex items-center gap-2 ${
                                receiptBill.isDebt ? "text-red-600" : "text-green-600"
                            }`}
                        >
                            {receiptBill.isDebt ? (
                                <Wallet size={20} />
                            ) : (
                                <CheckCircle2 size={20} />
                            )}
                            <span className="font-semibold">
                                {receiptBill.isDebt
                                    ? t("debtSavedSuccess") ||
                                      "Debt recorded successfully"
                                    : t("billSavedSuccess") ||
                                      "Bill saved successfully"}
                            </span>
                        </div>

                        <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-5 font-mono text-sm">
                            <div className="text-center mb-3 space-y-0.5">
                                <p className="text-base font-extrabold tracking-wide text-orange-600">
                                    {CLINIC_NAME}
                                </p>
                                <p className="text-[11px] text-gray-500" dir="rtl">
                                    {CLINIC_LOCATION}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    {CLINIC_PHONE}
                                </p>

                                <div className="my-2 border-t border-dashed border-orange-200" />

                                <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${chipStyleFor(
                                        receiptBill.department
                                    )}`}
                                >
                                    {t(`department${receiptBill.department}`) || receiptBill.department}
                                </span>

                                <p className="text-xs text-gray-500 mt-1">
                                    #{String(receiptBill.id).padStart(5, "0")} -{" "}
                                    {new Date(
                                        receiptBill.created_at || Date.now()
                                    ).toLocaleString()}
                                </p>
                                {receiptBill.customerName && (
                                    <p className="text-xs text-gray-500">
                                        {receiptBill.customerName}
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-dashed border-orange-200 pt-2 space-y-1">
                                {receiptBill.items.map((c) => (
                                    <div
                                        key={c.inventoryId}
                                        className="flex justify-between text-gray-700"
                                    >
                                        <span className="truncate pr-2">
                                            {c.quantity}x {c.name}
                                        </span>
                                        <span>
                                            {formatIQD(
                                                c.unit_price * c.quantity
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed border-orange-200 mt-2 pt-2 space-y-1">
                                {receiptBill.days > 1 && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>
                                            {t("dayRate") || "Per day"} × {receiptBill.days}
                                        </span>
                                        <span>{formatIQD(receiptBill.perDaySubtotal)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-gray-600">
                                    <span>{t("subtotal") || "Subtotal"}</span>
                                    <span>{formatIQD(receiptBill.subtotal)}</span>
                                </div>

                                {Number(receiptBill.discount) > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>{t("discount") || "Discount"}</span>
                                        <span>-{formatIQD(receiptBill.discount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-base font-extrabold text-orange-600">
                                    <span>{t("total") || "Total"}</span>
                                    <span>{formatIQD(receiptBill.total)} IQD</span>
                                </div>

                                {/* On-screen confirmation still shows the split for your
                                    own records — only the printed receipt (printCustomBill)
                                    has this removed. */}
                                {receiptBill.isSplitBill && (
                                    <div className="mt-2 border-t border-dashed border-pink-200 pt-2 space-y-1">
                                        <div className="flex justify-between text-pink-600 font-semibold">
                                            <span>{t("myShare") || "My share"} (50%)</span>
                                            <span>{formatIQD(receiptBill.myShare)} IQD</span>
                                        </div>
                                        <div className="flex justify-between text-pink-600 font-semibold">
                                            <span>
                                                {SALON_PARTNER_NAME} {t("share") || "share"} (50%)
                                            </span>
                                            <span>{formatIQD(receiptBill.partnerShare)} IQD</span>
                                        </div>
                                    </div>
                                )}

                                {receiptBill.isDebt && (
                                    <div className="mt-2 border-t border-dashed border-red-200 pt-2 space-y-1">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{t("paidNow") || "Paid now"}</span>
                                            <span>
                                                {formatIQD(receiptBill.amount_paid)} IQD
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-red-600 font-extrabold">
                                            <span>
                                                {t("remainingDebt") || "Remaining debt"}
                                            </span>
                                            <span>
                                                {formatIQD(receiptBill.remaining_amount)} IQD
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="mt-3 text-center text-xs text-orange-400 italic">
                                {t("thankYouMessage") || "Thank you for your visit!"}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setReceiptBill(null)}
                            >
                                {t("close") || "Close"}
                            </Button>

                            <Button
                                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                                onClick={printCustomBill}
                            >
                                <Printer size={16} />
                                {t("printBill") || "Print bill"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Bill details modal (opened by clicking a row in Recent bills) */}
            {selectedBill && (
                <Modal
                    open={!!selectedBill}
                    onClose={() => setSelectedBill(null)}
                    title={`${t("bill") || "Bill"} #${String(
                        selectedBill.bill.id
                    ).padStart(5, "0")}`}
                    className="max-w-md"
                >
                    <div className="space-y-4 text-sm">
                        <div className="text-center space-y-0.5 pb-1">
                            <p className="text-sm font-extrabold tracking-wide text-orange-600">
                                {CLINIC_NAME}
                            </p>
                            <p className="text-[11px] text-gray-500" dir="rtl">
                                {CLINIC_LOCATION}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {CLINIC_PHONE}
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${chipStyleFor(
                                    selectedBill.bill.department
                                )}`}
                            >
                                {t(`department${selectedBill.bill.department}`) ||
                                    selectedBill.bill.department}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-2 text-gray-600 border-t border-orange-100 pt-3">
                            <div>
                                <span className="font-semibold text-gray-700">
                                    {t("department") || "Department"}:{" "}
                                </span>
                                {t(`department${selectedBill.bill.department}`) ||
                                    selectedBill.bill.department}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">
                                    {t("date") || "Date"}:{" "}
                                </span>
                                {new Date(
                                    selectedBill.bill.created_at
                                ).toLocaleString()}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">
                                    {t("customer") || "Customer"}:{" "}
                                </span>
                                {selectedBill.bill.customer_name || "-"}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">
                                    {t("phone") || "Phone"}:{" "}
                                </span>
                                {selectedBill.bill.customer_phone || "-"}
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700">
                                    {t("payment") || "Payment"}:{" "}
                                </span>
                                {selectedBill.bill.payment_method}
                            </div>
                            {Number(selectedBill.bill.days) > 1 && (
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        {t("days") || "Days"}:{" "}
                                    </span>
                                    {selectedBill.bill.days}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-orange-100 pt-3 space-y-1">
                            {selectedBill.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-gray-700"
                                >
                                    <span className="truncate pr-2">
                                        {item.quantity}x {item.item_name}
                                    </span>
                                    <span>
                                        {formatIQD(item.line_total)} IQD
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-orange-100 pt-3 space-y-1">
                            <div className="flex justify-between text-gray-500">
                                <span>{t("subtotal") || "Subtotal"}</span>
                                <span>
                                    {formatIQD(selectedBill.bill.subtotal)} IQD
                                </span>
                            </div>

                            {Number(selectedBill.bill.discount) > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>{t("discount") || "Discount"}</span>
                                    <span>
                                        -{formatIQD(selectedBill.bill.discount)} IQD
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between text-base font-extrabold text-orange-600">
                                <span>{t("total") || "Total"}</span>
                                <span>
                                    {formatIQD(selectedBill.bill.total)} IQD
                                </span>
                            </div>

                            {selectedBill.bill.department === "Salon" && selectedBill.bill.is_split && (
                                <div className="mt-2 border-t border-dashed border-pink-200 pt-2 space-y-1">
                                    <div className="flex justify-between text-pink-600 font-semibold">
                                        <span>{t("myShare") || "My share"} (50%)</span>
                                        <span>
                                            {formatIQD(Number(selectedBill.bill.total) / 2)} IQD
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-pink-600 font-semibold">
                                        <span>
                                            {SALON_PARTNER_NAME} {t("share") || "share"} (50%)
                                        </span>
                                        <span>
                                            {formatIQD(Number(selectedBill.bill.total) / 2)} IQD
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-1">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedBill(null)}
                            >
                                {t("close") || "Close"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}