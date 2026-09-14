import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    PawPrint,
    Users,
    DollarSign,
    UserCog,
    TrendingUp,
    Plus,
    HeartHandshake,
    Package,
    ClipboardList,
    CheckCircle2,
    XCircle,
    Bell,
    AlertTriangle,
    CalendarDays,
    Dog,
    ArrowRight,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Loading from "../components/ui/Loading";
import { AuthContext } from "../contexts/AuthContext";
import { getDashboard } from "../services/dashboard";
import { Link } from "react-router-dom";
import ProcedureChart from "../components/dashboard/ProcedureChart";
import DogOutcomeChart from "../components/dashboard/DogOutcomeChart";
import InventoryCategoryChart from "../components/dashboard/InventoryCategoryChart";
import ProcedureSuccessChart from "../components/dashboard/ProcedureSuccessChart";
export default function Dashboard() {

    const { t, i18n } = useTranslation();
    const { user } = useContext(AuthContext);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const data = await getDashboard();
                setDashboard(data);
            } catch (err) {
                console.error(err);
                setError(t("failedLoadDashboard"));
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);
    
    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-medium">
                    {error}
                </p>
            </div>
        );
    }

const stats = [
    {
        title: t("animals"),
        value: dashboard.animals,
        icon: PawPrint,
        bg: "bg-orange-100",
        color: "text-orange-600",
    },
    {
        title: t("supplier"),
        value: dashboard.suppliers,
        icon: Users,
        bg: "bg-blue-100",
        color: "text-blue-600",
    },
    {
        title: t("staff"),
        value: dashboard.users,
        icon: UserCog,
        bg: "bg-purple-100",
        color: "text-purple-600",
    },
    {
        title: t("navbarInventory"),
        value: dashboard.inventory,
        icon: Package,
        bg: "bg-cyan-100",
        color: "text-cyan-600",
    },
    {
        title: t("procedures"),
        value: dashboard.procedures,
        icon: ClipboardList,
        bg: "bg-indigo-100",
        color: "text-indigo-600",
    },
    {
        title: t("successful"),
        value: dashboard.successfulSurgeries,
        icon: CheckCircle2,
        bg: "bg-green-100",
        color: "text-green-600",
    },
    {
        title: t("failed"),
        value: dashboard.failedSurgeries,
        icon: XCircle,
        bg: "bg-red-100",
        color: "text-red-600",
    },
    {
        title: t("released"),
        value: dashboard.availableDogs,
        icon: Dog,
        bg: "bg-yellow-100",
        color: "text-yellow-700",
    },
];

const isAdmin = user?.role === "Admin";

    return (
        <div dir={ ["ar", "ku"].includes(i18n.language)
                         ? "rtl"
                        : "ltr"
                        } className="space-y-8">
            {/* Welcome */}
            <div className="flex justify-between items-center">
                <div>
                    <h1  className="text-3xl font-bold text-gray-800">
                        {t("welcomeBack")}

                        {user && `, ${user.firstName}`}

                        👋
                    </h1>

                    <p className="text-gray-500 mt-2">

                        {t("dashboardSubtitle")}

                    </p>

                </div>

                <Badge variant="success">
                    <TrendingUp size={15} />
                    {t("online")}
                </Badge>
            </div>

            {/* Statistics */}

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

    {stats.map((item) => {

        const Icon = item.icon;

        return (

            <Card
                key={item.title}
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >

                <div className="flex justify-between items-start">

                    <div>

                        <p className="text-gray-500 text-sm">

                            {item.title}

                        </p>

                        <h2 className="text-3xl font-bold mt-2">

                            {item.value}

                        </h2>

                    </div>

                    <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg}`}
                    >
                        <Icon
                            className={item.color}
                            size={28}
                        />
                    </div>

                </div>

            </Card>

        );

    })}

</div>


<Card>

    <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

            <Bell className="text-orange-500" />

            <h2 className="text-xl font-bold">

                {t("notifications")}

            </h2>

        </div>

        <span className="text-sm text-gray-500">

            {dashboard.notifications.length} {t("alerts")}

        </span>

    </div>

    {dashboard.notifications.length === 0 && (

        <div className="text-center py-8 text-gray-400">

            {t("everythingLooksGood")}

        </div>

    )}

    <div className="space-y-3">

        {dashboard.notifications.map((item, index) => (

            <div
                key={index}
                className={`rounded-2xl border p-4 flex justify-between items-center ${
                    item.type === "expired"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                }`}
            >

                <div className="flex items-center gap-3">

                    <AlertTriangle
                        className={
                            item.type === "expired"
                                ? "text-red-500"
                                : "text-yellow-500"
                        }
                    />

                    <div>

                        <p className="font-semibold">

                            {item.message}

                        </p>

                    </div>

                </div>

                <ArrowRight size={18} />

            </div>

        ))}

    </div>

</Card>

            {isAdmin && (
                <>


            {/* Bottom Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Activity */}


            <div className="grid xl:grid-cols-3 gap-6">

             {/* Recent Procedures */}

            <Card className="xl:col-span-2">

                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-xl font-bold">
                        {t("recentProcedures")}
                    </h2>

                    <Link
                        to="/procedures"
                        className="text-orange-600 hover:underline text-sm"
                    >
                        {t("viewAll")}
                    </Link>

                </div>

            {dashboard.recentProcedures.length === 0 ? (

                <div className="py-12 text-center text-gray-400">

                    {t("noProceduresFound")}

                </div>

            ) : (

            <div className="space-y-4">

                {dashboard.recentProcedures.map((procedure) => (

                    <div
                        key={procedure.id}
                        className="flex justify-between items-center border rounded-2xl p-4 hover:bg-gray-50 transition"
                    >

                        <div>

                            <h3 className="font-semibold">

                                Dog #{procedure.dog_id}

                            </h3>

                            <p className="text-sm text-gray-500">

                                {procedure.procedure_type}

                            </p>

                            <p className="text-xs text-gray-400 mt-1">

                                {procedure.veterinarian_name}

                            </p>

                        </div>

                        <div className="text-right">

                            <p className="text-sm">

                                {new Date(
                                    procedure.procedure_date
                                ).toLocaleDateString()}
                            </p>

                            {procedure.surgery_successful ? (

                                <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">

                                    {t("successful")}

                                </span>

                            ) : (

                                <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">

                                    {t("failed")}

                                </span>

                            )}

                        </div>

                    </div>

                ))}

            </div>

        )}

    </Card>

    {/* System Overview */}

    <Card>

        <h2 className="text-xl font-bold mb-6">

            {t("systemOverview")}

        </h2>

        <div className="space-y-5">

            <div>

                <div className="flex justify-between mb-1">

                    <span>{t("animals")}</span>

                    <span>{dashboard.animals}</span>

                </div>

                <div className="h-2 rounded-full bg-gray-200">

                    <div
                        className="h-2 rounded-full bg-orange-500"
                        style={{
                            width: `${Math.min(
                                dashboard.animals,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

            <div>

                <div className="flex justify-between mb-1">

                    <span>{t("navbarInventory")}</span>

                    <span>{dashboard.inventory}</span>

                </div>

                <div className="h-2 rounded-full bg-gray-200">

                    <div
                        className="h-2 rounded-full bg-cyan-500"
                        style={{
                            width: `${Math.min(
                                dashboard.inventory,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

            <div>

                <div className="flex justify-between mb-1">

                    <span>{t("procedures")}</span>

                    <span>{dashboard.procedures}</span>

                </div>

                <div className="h-2 rounded-full bg-gray-200">

                    <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{
                            width: `${Math.min(
                                dashboard.procedures,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

            <div>

                <div className="flex justify-between mb-1">

                    <span>{t("suppliers")}</span>

                    <span>{dashboard.suppliers}</span>

                </div>

                <div className="h-2 rounded-full bg-gray-200">

                    <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                            width: `${Math.min(
                                dashboard.customers,
                                100
                            )}%`,
                        }}
                    />

                </div>

            </div>

        </div>

    </Card>

</div>


<div className="grid xl:grid-cols-2 gap-6 mt-6">

    {/* Low Stock */}

    <Card>

        <div className="flex justify-between items-center mb-6">

            <h2 className="text-xl font-bold text-yellow-700">

                {t("lowStockItems")}

            </h2>

            <Link
                to="/inventory"
                className="text-sm text-orange-600 hover:underline"
            >
                {t("navbarInventory")}
            </Link>

        </div>

        {dashboard.lowStockItems.length === 0 ? (

            <div className="text-center py-8 text-gray-400">

                {t("noLowStockItems")}

            </div>

        ) : (

            <table className="w-full">

                <thead>

                    <tr className="border-b">

                        <th className="text-left py-2">

                            {t("item")}

                        </th>

                        <th>

                            {t("qty")}

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {dashboard.lowStockItems.map((item) => (

                        <tr
                            key={item.id}
                            className="border-b"
                        >

                            <td className="py-3">

                                {item.name}

                            </td>

                            <td className="text-center">

                                <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">

                                    {item.quantity}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        )}

    </Card>

    {/* Expired */}

    <Card>

        <div className="flex justify-between items-center mb-6">

            <h2 className="text-xl font-bold text-red-700">

                {t("expiredInventory")}

            </h2>

            <Link
                to="/inventory"
                className="text-sm text-orange-600 hover:underline"
            >
                {t("navbarInventory")}
            </Link>

        </div>

        {dashboard.expiredItems.length === 0 ? (

            <div className="text-center py-8 text-gray-400">

                {t("noExpiredItems")}

            </div>

        ) : (

            <table className="w-full">

                <thead>

                    <tr className="border-b">

                        <th className="text-left py-2">

                            {t("item")}

                        </th>

                        <th>

                            {t("expiry")}

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {dashboard.expiredItems.map((item) => (

                        <tr
                            key={item.id}
                            className="border-b"
                        >

                            <td className="py-3">

                                {item.name}

                            </td>

                            <td className="text-center text-red-600 font-medium">

                                {new Date(
                                    item.expire_date
                                ).toLocaleDateString()}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        )}

    </Card>

</div>
                {/* Quick Actions */}

                <Card>

                <h2 className="text-xl font-bold mb-5">

                Quick Actions

                </h2>

                <div className="space-y-3">

                <Link to="/dogs">

                <Button className="w-full justify-center">

                <Plus size={18}/>

                {t("addDog")}

                </Button>

                </Link>

                <Link to="/supplier">

                <Button
                variant="secondary"
                className="w-full justify-center"
                >

                <Users size={18}/>

                {t("addsupplier")}

                </Button>

                </Link>

                <Link to="/procedures">

                <Button
                variant="secondary"
                className="w-full justify-center"
                >

                <HeartHandshake size={18}/>

                {t("newProcedure")}

                </Button>

                </Link>

                <Link to="/inventory">

                <Button
                variant="secondary"
                className="w-full justify-center"
                >

                <Package size={18}/>

                {t("navbarInventory")}

                </Button>

                </Link>

                </div>

                </Card>
            </div>


            <div className="grid xl:grid-cols-2 gap-6 mt-8">

    <Card>
        <h2 className="text-xl font-bold mb-4">
            {t("monthlyProcedures")}
        </h2>

        <ProcedureChart
            data={dashboard.monthlyProcedures}
        />
    </Card>

    <Card>
        <h2 className="text-xl font-bold mb-4">
            {t("dogOutcomes")}
        </h2>

        <DogOutcomeChart
            data={dashboard.dogOutcomes}
        />
    </Card>

    <Card>
        <h2 className="text-xl font-bold mb-4">
            {t("inventoryCategories")}
        </h2>

        <InventoryCategoryChart
            data={dashboard.inventoryCategories}
        />
    </Card>

    <Card>
        <h2 className="text-xl font-bold mb-4">
            {t("surgerySuccessRate")}
        </h2>

        <ProcedureSuccessChart
            data={dashboard.procedureSuccess}
        />
    </Card>


</div>
        </>
    )}

        </div>
         
       
    );
}