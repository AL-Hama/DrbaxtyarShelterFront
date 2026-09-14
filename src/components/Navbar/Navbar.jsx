import LanguageSwitcher from "./LanguageSwitcher";
import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import {
  PawPrint,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const { t, i18n } = useTranslation();
    const [profileOpen, setProfileOpen] = useState(false);

    const [operationsOpen, setOperationsOpen] = useState(false);
    const [mobileOperationsOpen, setMobileOperationsOpen] = useState(false);
    const operationsRef = useRef(null);

    // Admin dropdown: Staff / Supplier
    const [adminOpen, setAdminOpen] = useState(false);
    const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
    const adminRef = useRef(null);

    // Management dropdown: Reports / Sales / Inventory History
    const [managementOpen, setManagementOpen] = useState(false);
    const [mobileManagementOpen, setMobileManagementOpen] = useState(false);
    const managementRef = useRef(null);

    const navigate = useNavigate();

const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
    window.location.reload();
};
    const isActive = (path) =>
        location.pathname === path
            ? "text-orange-600 font-semibold"
            : "text-gray-600 hover:text-orange-600";

    const operationsPaths = ["/dogs", "/procedures", "/tretments"];
    const isOperationsActive = operationsPaths.includes(location.pathname);

    const adminPaths = ["/staff", "/supplier"];
    const isAdminActive = adminPaths.includes(location.pathname);

    const managementPaths = ["/reports", "/sales", "/inventoryhistory"];
    const isManagementActive = managementPaths.includes(location.pathname);

    const isAdmin = user?.role?.toLowerCase() === "admin";

    const initials =
        user?.firstName?.charAt(0)?.toUpperCase() ||
        user?.username?.charAt(0)?.toUpperCase() ||
        "?";

    // Close the desktop dropdowns when clicking outside of them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                operationsRef.current &&
                !operationsRef.current.contains(event.target)
            ) {
                setOperationsOpen(false);
            }
            if (
                adminRef.current &&
                !adminRef.current.contains(event.target)
            ) {
                setAdminOpen(false);
            }
            if (
                managementRef.current &&
                !managementRef.current.contains(event.target)
            ) {
                setManagementOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close dropdowns whenever the route changes
    useEffect(() => {
        setOperationsOpen(false);
        setMobileOperationsOpen(false);
        setAdminOpen(false);
        setMobileAdminOpen(false);
        setManagementOpen(false);
        setMobileManagementOpen(false);
    }, [location.pathname]);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            

            <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <PawPrint size={22} className="text-orange-600" />
                    </div>

                    <h1 className="font-bold text-gray-900 text-lg">
                        {t("navbarHeader")}
                    </h1>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">


                    <Link
                        to="/dashboard"
                        className={`relative pb-1 ${isActive("/dashboard")}`}
                    >
                        {t("navbarDashboard")}
                        {location.pathname === "/dashboard" && (
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                        )}
                    </Link>
                    
                    <Link
                        to="/basket"
                        className={`relative pb-1 ${isActive("/basket")}`}
                    >
                        {t("navbarBasket")}
                        {location.pathname === "/basket" && (
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                        )}
                    </Link>


                    <Link
                        to="/rooms"
                        className={`relative pb-1 ${isActive("/rooms")}`}
                    >
                        {t("navbarrooms")}
                        {location.pathname === "/rooms" && (
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                        )}
                    </Link>




                    {/* Operations dropdown: Dogs / Procedures / Treatments */}
                    <div className="relative" ref={operationsRef}>
                        <button
                            onClick={() => setOperationsOpen(!operationsOpen)}
                            className={`relative pb-1 flex items-center gap-1 ${
                                isOperationsActive
                                    ? "text-orange-600 font-semibold"
                                    : "text-gray-600 hover:text-orange-600"
                            }`}
                        >
                            {t("navbarOperations")}
                            <ChevronDown
                                size={16}
                                className={`transition ${
                                    operationsOpen ? "rotate-180" : ""
                                }`}
                            />
                            {isOperationsActive && (
                                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                            )}
                        </button>

                        {operationsOpen && (
                            <div
                                className="
                                absolute
                                left-0
                                mt-3
                                w-48
                                bg-white
                                rounded-2xl
                                shadow-xl
                                border
                                border-gray-100
                                overflow-hidden
                                z-50
                                "
                            >
                                <Link
                                    to="/dogs"
                                    onClick={() => setOperationsOpen(false)}
                                    className={`block px-5 py-3 hover:bg-gray-50 ${
                                        location.pathname === "/dogs"
                                            ? "text-orange-600 font-semibold bg-orange-50"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {t("navbarDogs")}
                                </Link>

                                <Link
                                    to="/procedures"
                                    onClick={() => setOperationsOpen(false)}
                                    className={`block px-5 py-3 hover:bg-gray-50 ${
                                        location.pathname === "/procedures"
                                            ? "text-orange-600 font-semibold bg-orange-50"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {t("procedures")}
                                </Link>

                                <Link
                                    to="/tretments"
                                    onClick={() => setOperationsOpen(false)}
                                    className={`block px-5 py-3 hover:bg-gray-50 ${
                                        location.pathname === "/tretments"
                                            ? "text-orange-600 font-semibold bg-orange-50"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {t("treatments")}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Admin dropdown: Staff / Supplier */}
                    {isAdmin && (
                        <div className="relative" ref={adminRef}>
                            <button
                                onClick={() => setAdminOpen(!adminOpen)}
                                className={`relative pb-1 flex items-center gap-1 ${
                                    isAdminActive
                                        ? "text-orange-600 font-semibold"
                                        : "text-gray-600 hover:text-orange-600"
                                }`}
                            >
                                {t("staff")}
                                <ChevronDown
                                    size={16}
                                    className={`transition ${
                                        adminOpen ? "rotate-180" : ""
                                    }`}
                                />
                                {isAdminActive && (
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                                )}
                            </button>

                            {adminOpen && (
                                <div
                                    className="
                                    absolute
                                    left-0
                                    mt-3
                                    w-48
                                    bg-white
                                    rounded-2xl
                                    shadow-xl
                                    border
                                    border-gray-100
                                    overflow-hidden
                                    z-50
                                    "
                                >
                                    <Link
                                        to="/staff"
                                        onClick={() => setAdminOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/staff"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("staff")}
                                    </Link>


                                    <Link
                                        to="/customers"
                                        onClick={() => setAdminOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/customers"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("customers")}
                                    </Link>

                                    <Link
                                        to="/supplier"
                                        onClick={() => setAdminOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/supplier"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("supplier")}
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Management dropdown: Reports / Sales / Inventory History */}
                    {isAdmin && (
                        <div className="relative" ref={managementRef}>
                            <button
                                onClick={() => setManagementOpen(!managementOpen)}
                                className={`relative pb-1 flex items-center gap-1 ${
                                    isManagementActive
                                        ? "text-orange-600 font-semibold"
                                        : "text-gray-600 hover:text-orange-600"
                                }`}
                            >
                                {t("reports")}
                                <ChevronDown
                                    size={16}
                                    className={`transition ${
                                        managementOpen ? "rotate-180" : ""
                                    }`}
                                />
                                {isManagementActive && (
                                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                                )}
                            </button>

                            {managementOpen && (
                                <div
                                    className="
                                    absolute
                                    left-0
                                    mt-3
                                    w-52
                                    bg-white
                                    rounded-2xl
                                    shadow-xl
                                    border
                                    border-gray-100
                                    overflow-hidden
                                    z-50
                                    "
                                >
                                    <Link
                                        to="/reports"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/reports"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("reports")}
                                    </Link>

                                    <Link
                                        to="/sales"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/sales"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("sales")}
                                    </Link>

                                    <Link
                                        to="/inventoryhistory"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/inventoryhistory"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("inventoryhistory")}
                                    </Link>


                                    <Link
                                        to="/roomHistory"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/roomHistory"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("roomHistory")}
                                    </Link>

                                    <Link
                                        to="/expenses"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/expenses"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("expenses")}
                                    </Link>

                                    <Link
                                        to="/debts"
                                        onClick={() => setManagementOpen(false)}
                                        className={`block px-5 py-3 hover:bg-gray-50 ${
                                            location.pathname === "/debts"
                                                ? "text-orange-600 font-semibold bg-orange-50"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("debts")}
                                    </Link>

                                </div>
                            )}
                        </div>
                    )}

                    <Link
                        to="/Inventory"
                        className={`relative pb-1 ${isActive("/Inventory")}`}
                    >
                        {t("navbarInventory")}
                        {location.pathname === "/Inventory" && (
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-orange-500 rounded-full" />
                        )}
                    </Link>

                    {/* User */}
                        <div className="flex items-center gap-4">

                        <LanguageSwitcher />

                        <div className="relative">

                            <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="
                                flex
                                items-center
                                gap-3
                                px-3
                                py-2
                                rounded-xl
                                hover:bg-gray-100
                                transition
                            "
                            >
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700">
                                {initials}
                            </div>

                            <div className="text-left">
                                <p className="font-semibold text-sm">
                                {user?.firstName}
                                </p>

                                <p className="text-xs text-gray-500">
                                {user?.role}
                                </p>
                            </div>

                            <ChevronDown
                                size={18}
                                className={`transition ${
                                profileOpen ? "rotate-180" : ""
                                }`}
                            />
                            </button>

                            {profileOpen && (
                            <div
                                className="
                                absolute
                                right-0
                                mt-3
                                w-64
                                bg-white
                                rounded-2xl
                                shadow-xl
                                border
                                border-gray-100
                                overflow-hidden
                                z-50
                                "
                            >
                                <div className="px-5 py-4 border-b">

                                <p className="font-semibold">
                                    {user?.firstName} {user?.lastName}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {user?.email}
                                </p>

                                </div>

                                <Link
                                to="/profile"
                                className="
                                    flex
                                    items-center
                                    gap-3
                                    px-5
                                    py-3
                                    hover:bg-gray-50
                                "
                                >
                                <User size={18} />
                                {t("profile")}
                                </Link>

                                <button
                                onClick={handleLogout}
                                className="
                                    w-full
                                    flex
                                    items-center
                                    gap-3
                                    px-5
                                    py-3
                                    text-red-600
                                    hover:bg-red-50
                                "
                                >
                                <LogOut size={18} />
                                {t("logout")}
                                </button>

                            </div>
                            )}

                        </div>

                        </div>
                </div>

                {/* Mobile Button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                    {menuOpen ? (
                        <X size={24} />
                    ) : (
                        <Menu size={24} />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="md:hidden border-t border-gray-200 bg-white">

                    {/* User */}
                    <div className="flex items-center gap-3 p-4 border-b">

                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700">
                            {initials}
                        </div>

                        <div>
                            <p className="font-medium">
                                {user?.firstName
                                    ? `${user.firstName} ${user.lastName || ""}`
                                    : user?.username}
                            </p>

                            <p className="text-sm text-gray-500">
                                {user?.role || "User"}
                            </p>
                        </div>
                    </div>

                    <nav  className="flex flex-col p-4 gap-3">

                        <Link
                            to="/dashboard"
                            onClick={() => setMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl ${
                                location.pathname === "/dashboard"
                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            {t("navbarDashboard")}
                        </Link>

                        <Link
                            to="/basket"
                            onClick={() => setMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl ${
                                location.pathname === "/basket"
                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            {t("navbarBasket")}
                        </Link>




                        <Link
                            to="/rooms"
                            onClick={() => setMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl ${
                                location.pathname === "/rooms"
                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            {t("navbarrooms")}
                        </Link>


                        {/* Operations dropdown (mobile): Dogs / Procedures / Treatments */}
                        <div>
                            <button
                                onClick={() =>
                                    setMobileOperationsOpen(!mobileOperationsOpen)
                                }
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${
                                    isOperationsActive
                                        ? "bg-orange-50 text-orange-600 font-semibold"
                                        : "text-gray-700"
                                }`}
                            >
                                {t("navbarOperations")}
                                <ChevronDown
                                    size={18}
                                    className={`transition ${
                                        mobileOperationsOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {mobileOperationsOpen && (
                                <div className="flex flex-col pl-4 mt-1 gap-1">
                                    <Link
                                        to="/dogs"
                                        onClick={() => setMenuOpen(false)}
                                        className={`px-4 py-3 rounded-xl ${
                                            location.pathname === "/dogs"
                                                ? "bg-orange-50 text-orange-600 font-semibold"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("animals")}
                                    </Link>

                                    <Link
                                        to="/procedures"
                                        onClick={() => setMenuOpen(false)}
                                        className={`px-4 py-3 rounded-xl ${
                                            location.pathname === "/procedures"
                                                ? "bg-orange-50 text-orange-600 font-semibold"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("procedures")}
                                    </Link>

                                    <Link
                                        to="/tretments"
                                        onClick={() => setMenuOpen(false)}
                                        className={`px-4 py-3 rounded-xl ${
                                            location.pathname === "/tretments"
                                                ? "bg-orange-50 text-orange-600 font-semibold"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {t("treatments")}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Admin dropdown (mobile): Staff / Supplier */}
                        {isAdmin && (
                            <div>
                                <button
                                    onClick={() =>
                                        setMobileAdminOpen(!mobileAdminOpen)
                                    }
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${
                                        isAdminActive
                                            ? "bg-orange-50 text-orange-600 font-semibold"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {t("staff")}
                                    <ChevronDown
                                        size={18}
                                        className={`transition ${
                                            mobileAdminOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>


                                

                                {mobileAdminOpen && (
                                    <div className="flex flex-col pl-4 mt-1 gap-1">
                                        <Link
                                            to="/staff"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/staff"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("staff")}
                                        </Link>

                                        <Link
                                            to="/customers"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/customers"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("customers")}
                                        </Link>

                                        <Link
                                            to="/supplier"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/supplier"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("supplier")}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Management dropdown (mobile): Reports / Sales / Inventory History */}
                        {isAdmin && (
                            <div>
                                <button
                                    onClick={() =>
                                        setMobileManagementOpen(!mobileManagementOpen)
                                    }
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${
                                        isManagementActive
                                            ? "bg-orange-50 text-orange-600 font-semibold"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {t("reports")}
                                    <ChevronDown
                                        size={18}
                                        className={`transition ${
                                            mobileManagementOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {mobileManagementOpen && (
                                    <div className="flex flex-col pl-4 mt-1 gap-1">
                                        <Link
                                            to="/reports"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/reports"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("reports")}
                                        </Link>

                                        <Link
                                            to="/sales"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/sales"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("sales")}
                                        </Link>

                                        <Link
                                            to="/inventoryhistory"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/inventoryhistory"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("inventoryhistory")}
                                        </Link>

                                        <Link
                                            to="/roomHistory"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/roomHistory"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("roomHistory")}
                                        </Link>

                                        <Link
                                            to="/expenses"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/expenses"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("expenses")}
                                        </Link>

                                        <Link
                                            to="/debts"
                                            onClick={() => setMenuOpen(false)}
                                            className={`px-4 py-3 rounded-xl ${
                                                location.pathname === "/debts"
                                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            {t("debts")}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        <Link
                            to="/Inventory"
                            onClick={() => setMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl ${
                                location.pathname === "/Inventory"
                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            {t("navbarInventory")}
                        </Link>

                        <Link
                            to="/profile"
                            onClick={() => setMenuOpen(false)}
                            className={`px-4 py-3 rounded-xl ${
                                location.pathname === "/profile"
                                    ? "bg-orange-50 text-orange-600 font-semibold"
                                    : "text-gray-700"
                            }`}
                        >
                            {t("profile")}
                        </Link>

                        <div className="pt-2 border-t">
                            <LanguageSwitcher />
                            <button
                        onClick={handleLogout}
                        className="
                            mt-3
                            flex items-center justify-center gap-2
                            w-full
                            px-4 py-3
                            rounded-xl
                            bg-red-50
                            text-red-600
                            hover:bg-red-100
                            transition
                        "
                    >
                        <LogOut size={18} />
                        {t("logout")}
                    </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}