import { Fragment, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getReport } from "../services/reportService";
import {
  Printer,
  DollarSign,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Building2,
  BedDouble,
  Banknote,
  CreditCard,
  PawPrint,
  Syringe,
  Package,
  Users,
  Trophy,
  Receipt,
  Wallet,
  TrendingUp,
  TrendingDown,
  Handshake,
  HandCoins,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Visual config for each department's sales tile — literal Tailwind
// classes so the build doesn't purge dynamically-constructed ones.
const DEPARTMENT_CONFIG = [
  {
    key: "Shop",
    icon: ShoppingBag,
    bg: "bg-orange-50",
    border: "border-orange-100",
    iconBg: "bg-orange-100",
    text: "text-orange-600",
  },
  {
    key: "Salon",
    icon: Scissors,
    bg: "bg-pink-50",
    border: "border-pink-100",
    iconBg: "bg-pink-100",
    text: "text-pink-600",
  },
  {
    key: "Clinic",
    icon: Stethoscope,
    bg: "bg-blue-50",
    border: "border-blue-100",
    iconBg: "bg-blue-100",
    text: "text-blue-600",
  },
];

const PAYMENT_CONFIG = [
  {
    key: "cash",
    icon: Banknote,
    bg: "bg-green-50",
    border: "border-green-100",
    iconBg: "bg-green-100",
    text: "text-green-600",
  },
  {
    key: "card",
    icon: CreditCard,
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    iconBg: "bg-indigo-100",
    text: "text-indigo-600",
  },
];

// Expense categories that don't map onto a specific department (Shop,
// Clinic, Hotel, Hospital, Salon). These only ever get subtracted from
// the grand-total net profit, never from a single department's net.
const GENERAL_EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Maintenance",
  "Transport",
  "Salaries",
  "Other",
];

// Subset of the general categories shown in the "Other / general
// expenses" tile. Rent and Salaries are excluded here since they now
// have their own dedicated card at the top of the report — this avoids
// double-showing the same amount in two places.
const OTHER_GENERAL_EXPENSE_CATEGORIES = GENERAL_EXPENSE_CATEGORIES.filter(
  (cat) => cat !== "Rent" && cat !== "Salaries"
);

// Department config for the net-profit breakdown (revenue - that
// department's own expense category). Room revenue for Hotel/Hospital
// comes from roomsByDepartment rather than salesByDepartment, since
// that's where paid/remaining figures live.
const NET_PROFIT_DEPARTMENTS = [
  { key: "Shop", label: "Shop", icon: ShoppingBag, source: "sales", bg: "bg-orange-50", border: "border-orange-100", iconBg: "bg-orange-100", text: "text-orange-600" },
  { key: "Salon", label: "Salon", icon: Scissors, source: "sales", bg: "bg-pink-50", border: "border-pink-100", iconBg: "bg-pink-100", text: "text-pink-600" },
  { key: "Clinic", label: "Clinic", icon: Stethoscope, source: "sales", bg: "bg-blue-50", border: "border-blue-100", iconBg: "bg-blue-100", text: "text-blue-600" },
  { key: "Hotel", label: "Room - Hotel", icon: BedDouble, source: "rooms", bg: "bg-teal-50", border: "border-teal-100", iconBg: "bg-teal-100", text: "text-teal-600" },
  { key: "Hospital", label: "Room - Hospital", icon: Building2, source: "rooms", bg: "bg-purple-50", border: "border-purple-100", iconBg: "bg-purple-100", text: "text-purple-600" },
];

const SALON_PARTNER_NAME = "Parvis";
const SALON_SPLIT_RATIO = 0.5;


const SALES_OVERVIEW_DEPARTMENTS = ["Shop", "Salon", "Clinic"];

const DEBT_CARD_DEPARTMENTS = [
  {
    key: "Shop",
    label: "departmentShop",
    fallback: "Shop",
    border: "border-orange-100",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    key: "Salon",
    label: "departmentSalon",
    fallback: "Salon",
    border: "border-pink-100",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  {
    key: "Clinic",
    label: "departmentClinic",
    fallback: "Clinic",
    border: "border-blue-100",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
];

// Config for the new item-sales cost/profit cards (Shop & Clinic only)
const ITEM_COST_DEPARTMENTS = [
  {
    key: "Shop",
    icon: ShoppingBag,
    border: "border-orange-100",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  {
    key: "Clinic",
    icon: Stethoscope,
    border: "border-blue-100",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
];

const EMPTY_DEBT = { total: 0, paid: 0, remaining: 0, count: 0 };
const EMPTY_ITEM_COST = { revenue: 0, cost: 0, profit: 0 };

// A single KPI tile used across every summary row on this page.
function StatTile({ icon: Icon, label, value, bg, border, iconBg, text, sub }) {
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

function SectionHeading({ children }) {
  return (
    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </h4>
  );
}

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const isRtl = ["ar", "ku"].includes(i18n.language);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await getReport(from, to);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatIQD = (amount) =>
    new Intl.NumberFormat("en-IQ", {
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const inventoryPurchasedValue =
    data?.inventory?.reduce(
      (sum, item) =>
        sum + Number(item.purchased_quantity || 0) * Number(item.cost_price || 0),
      0
    ) || 0;

  const totalUsedItems =
    data?.inventory?.reduce((sum, item) => sum + Number(item.used_quantity || 0), 0) || 0;

  const totalSalary =
    data?.staff?.reduce((sum, staff) => sum + Number(staff.salary || 0), 0) || 0;

  // Sales by department, always showing all departments even if a
  // department had zero bills in the selected range.
  const salesDeptMap = (data?.salesByDepartment || []).reduce((map, row) => {
    map[row.department] = {
      total: Number(row.total),
      count: Number(row.count),
    };
    return map;
  }, {});

  const salesPaymentMap = (data?.salesByPayment || []).reduce((map, row) => {
    map[row.payment_method] = {
      total: Number(row.total),
      count: Number(row.count),
    };
    return map;
  }, {});

  const totalSalesRevenueRaw = Number(data?.salesOverall?.total || 0);
  const totalSalesCount = Number(data?.salesOverall?.count || 0);

 
  const salonSalesSplitRows = data?.salonSalesSplit || [];
  const salonSplitSales = salonSalesSplitRows.find((r) => r.isSplit) || {
    total: 0,
    count: 0,
  };
  const salonNotSplitSales = salonSalesSplitRows.find((r) => !r.isSplit) || {
    total: 0,
    count: 0,
  };

  const salonDebtSplitRows = data?.salonDebtSplit || [];
  const salonSplitDebt = salonDebtSplitRows.find((r) => r.isSplit) || {
    total: 0,
    paid: 0,
    remaining: 0,
    count: 0,
  };
  const salonNotSplitDebt = salonDebtSplitRows.find((r) => !r.isSplit) || {
    total: 0,
    paid: 0,
    remaining: 0,
    count: 0,
  };

  // Parvis's cut is only ever computed from bills/debts that actually
  // had the split toggle on (salonSplitSales / salonSplitDebt) — never
  // from salonSplitSales + salonNotSplitSales combined.
  const parvisRevenueShare = salonSplitSales.total * SALON_SPLIT_RATIO;
  const parvisDebtShare = {
    total: salonSplitDebt.total * SALON_SPLIT_RATIO,
    paid: salonSplitDebt.paid * SALON_SPLIT_RATIO,
    remaining: salonSplitDebt.remaining * SALON_SPLIT_RATIO,
    count: salonSplitDebt.count,
  };

  // Salon revenue split 50/50 with Parvis only applies to bills that
  // had the toggle on, so only that portion of Parvis's cut is
  // excluded here — every "Total revenue" figure that spans all
  // departments (Financial Summary's "Total revenue (all
  // departments)" tile) needs to exclude just his actual cut, at the
  // single source, rather than trying to subtract it again in
  // multiple places. NOTE: this figure still includes Hotel/Hospital
  // room-checkout bills, since it's meant to represent literally every
  // bill across every department — that's intentional for the
  // Financial Summary section. The Sales Overview section below uses
  // its own, separately-scoped `salesOverviewRevenue` instead.
  const salonRawRevenue = salesDeptMap["Salon"]?.total || 0;
  const totalSalesRevenue = totalSalesRevenueRaw - parvisRevenueShare;

  // ---------- Sales Overview (Shop / Salon / Clinic only) ----------
  // Room checkouts (Hotel/Hospital) also land in the `bills` table, but
  // they're walk-in-sales-department figures here, not room figures —
  // those live in the "Rooms overview" section instead. So this total
  // is built directly from salesDeptMap / the split breakdown, restricted
  // to the three counter-sale departments, rather than from
  // data.salesOverall (which sums every bill regardless of department).
  const salesOverviewRevenue = SALES_OVERVIEW_DEPARTMENTS.reduce((sum, key) => {
    if (key === "Salon") {
      // Non-split Salon bills count in full; split ones only count the
      // business's 50% share.
      return sum + salonNotSplitSales.total + salonSplitSales.total * SALON_SPLIT_RATIO;
    }
    return sum + (salesDeptMap[key]?.total || 0);
  }, 0);

  const salesOverviewCount = SALES_OVERVIEW_DEPARTMENTS.reduce(
    (sum, key) => sum + (salesDeptMap[key]?.count || 0),
    0
  );

  const averageSale =
    salesOverviewCount > 0 ? salesOverviewRevenue / salesOverviewCount : 0;

  // Rooms (Hotel + Hospital) — total billed, total paid (deposits),
  // and total still remaining/owed, both combined and per department.
  const roomsByDeptMap = (data?.roomsByDepartment || []).reduce((map, row) => {
    map[row.department] = {
      total: Number(row.total),
      paid: Number(row.paid),
      remaining: Number(row.remaining),
      count: Number(row.count),
    };
    return map;
  }, {});

  const hotelStats = roomsByDeptMap["Hotel"] || {
    total: 0,
    paid: 0,
    remaining: 0,
    count: 0,
  };
  const hospitalStats = roomsByDeptMap["Hospital"] || {
    total: 0,
    paid: 0,
    remaining: 0,
    count: 0,
  };

  const roomsTotal = hotelStats.total + hospitalStats.total;
  const roomsPaid = hotelStats.paid + hospitalStats.paid;
  const roomsRemaining = hotelStats.remaining + hospitalStats.remaining;
  const roomsStayCount = hotelStats.count + hospitalStats.count;

  // ---------- Debts (Shop / Salon / Clinic + combined total) ----------

  const debtsByDeptMap = (data?.debtsByDepartment || []).reduce((map, row) => {
    map[row.department] = {
      total: Number(row.total),
      paid: Number(row.paid),
      remaining: Number(row.remaining),
      count: Number(row.count),
    };
    return map;
  }, {});

  const shopDebt = debtsByDeptMap["Shop"] || EMPTY_DEBT;
  const salonDebt = debtsByDeptMap["Salon"] || EMPTY_DEBT;
  const clinicDebt = debtsByDeptMap["Clinic"] || EMPTY_DEBT;

  // Salon's card in the Debts Overview section must show only the
  // business's share, same logic as salesOverviewRevenue /
  // displayTotal in Sales by department: non-split debts count in
  // full, split debts only count the business's 50% share. (Count is
  // left as the full debt count since a single debt isn't "split"
  // into two records.)
  const salonDebtBusinessShare = {
    total: salonNotSplitDebt.total + salonSplitDebt.total * SALON_SPLIT_RATIO,
    paid: salonNotSplitDebt.paid + salonSplitDebt.paid * SALON_SPLIT_RATIO,
    remaining:
      salonNotSplitDebt.remaining + salonSplitDebt.remaining * SALON_SPLIT_RATIO,
    count: salonDebt.count,
  };

  // Total debt across every department the API returns (Shop, Salon,
  // Clinic, Hotel, Hospital, etc.), not just the three cards above.
  const totalDebt = Object.values(debtsByDeptMap).reduce(
    (acc, d) => ({
      total: acc.total + d.total,
      paid: acc.paid + d.paid,
      remaining: acc.remaining + d.remaining,
      count: acc.count + d.count,
    }),
    { ...EMPTY_DEBT }
  );

  // Total debt card should also reflect only the business's share —
  // subtract Parvis's cut of split Salon debts. `totalDebt` itself is
  // left untouched since totalDebtsPaid (used in the revenue summary)
  // already does its own correct subtraction from it.
  const totalDebtBusinessShare = {
    total: totalDebt.total - parvisDebtShare.total,
    paid: totalDebt.paid - parvisDebtShare.paid,
    remaining: totalDebt.remaining - parvisDebtShare.remaining,
    count: totalDebt.count,
  };

  // Debt payments collected are real cash the business received, so
  // they belong in "Total revenue (all departments)" alongside regular
  // sales revenue. Parvis's cut of payments collected on SPLIT Salon
  // debts is excluded here too, same as totalSalesRevenue excludes his
  // cut of split sales.
  const totalDebtsPaid = totalDebt.paid - parvisDebtShare.paid;

  const debtCardData = {
    Shop: shopDebt,
    Salon: salonDebtBusinessShare,
    Clinic: clinicDebt,
    Total: totalDebtBusinessShare,
  };

  // ---------- Expenses ----------

  const expensesList = data?.expenses || [];

  const expensesByCategoryMap = expensesList.reduce((map, e) => {
    const cat = e.category || "Other";
    map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    return map;
  }, {});

  const totalExpenses = expensesList.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const generalExpensesTotal = OTHER_GENERAL_EXPENSE_CATEGORIES.reduce(
    (sum, cat) => sum + (expensesByCategoryMap[cat] || 0),
    0
  );

  // ---------- Inventory revenue vs cost ----------

  const inventoryRevenue = Number(data?.inventoryRevenue || 0);

  // ---------- Item sales cost & profit (Shop & Clinic only) ----------
  // Cost of goods actually sold in this range, computed backend-side
  // from bill_items/debt_items joined to inventory.cost_price. This is
  // deliberately separate from inventoryPurchasedValue/inventoryRevenue
  // above (which track purchased vs. used quantities across the whole
  // inventory, all departments) — this section is COGS for what was
  // actually sold through the counter in Shop and Clinic specifically.
  const itemSalesCostMap = (data?.itemSalesCostByDept || []).reduce((map, row) => {
    map[row.department] = {
      revenue: Number(row.revenue),
      cost: Number(row.cost),
      profit: Number(row.profit),
    };
    return map;
  }, {});

  const shopItemCost = itemSalesCostMap["Shop"] || EMPTY_ITEM_COST;
  const clinicItemCost = itemSalesCostMap["Clinic"] || EMPTY_ITEM_COST;

  const totalItemRevenue = shopItemCost.revenue + clinicItemCost.revenue;
  const totalItemCost = shopItemCost.cost + clinicItemCost.cost;
  const totalItemProfit = totalItemRevenue - totalItemCost;

  const itemCostCardData = {
    Shop: shopItemCost,
    Clinic: clinicItemCost,
  };

  // ---------- Net profit per department (revenue minus that ----------
  // department's own expense category only — general categories like
  // Rent/Utilities are never subtracted here, only from the grand total.
  //
  // Note: `revenue` below (used for each department's own card, e.g.
  // Salon's "Revenue" line) is intentionally the raw, un-split figure
  // — the split only applies to Salon's *net profit* and to the
  // all-departments totals computed above (totalSalesRevenue),
  // not to this per-department revenue display. Salon's net profit
  // itself only has Parvis's actual cut subtracted (bills with the
  // split toggle on) via `parvisRevenueShare`: `net` below reflects the
  // amount the business itself keeps, while `netFull` keeps the true,
  // un-split figure so Parvis's matching share can be shown on its own
  // separate card.
  const netProfitBreakdown = NET_PROFIT_DEPARTMENTS.map((cfg) => {
    const revenue =
      cfg.source === "rooms"
        ? (roomsByDeptMap[cfg.key]?.total || 0)
        : (salesDeptMap[cfg.key]?.total || 0);
    const expense = expensesByCategoryMap[cfg.key] || 0;
    const netFull = revenue - expense;
    // Only subtract Parvis's actual cut (bills that had the split
    // toggle on), not half of every Salon bill regardless of toggle.
    const net = cfg.key === "Salon" ? netFull - parvisRevenueShare : netFull;

    return {
      ...cfg,
      revenue,
      expense,
      netFull,
      net,
    };
  });

  const salonBreakdown = netProfitBreakdown.find((d) => d.key === "Salon");
  const salonFullNet = salonBreakdown ? salonBreakdown.netFull : 0;
  // Parvis's share is only ever his actual cut of bills that had the
  // split toggle on (computed above as parvisRevenueShare) — shown
  // only on its own card here, and never added or subtracted a second
  // time anywhere else. (His cut of Salon's raw *revenue* is already
  // excluded once, at the source, inside `totalSalesRevenue` above —
  // that's why Total Revenue, netProfit, and the Sales Overview /
  // Sales by Department tiles all correctly reflect only the
  // business's share of Salon.)
  const parvisShare = parvisRevenueShare;

  // ---------- Grand totals ----------
  // totalSalesRevenue already has Parvis's actual cut of split Salon
  // revenue excluded (see above). We also fold in debt payments
  // actually collected in this range, since that's real cash received
  // — outstanding/remaining debt is NOT included here.

  const totalDepartmentsRevenue = totalSalesRevenue + totalDebtsPaid;

  // Simple revenue - expenses, before cost of goods sold is factored
  // in. Shown as its own card next to Total expenses so you can see
  // this figure separately from the COGS-adjusted Net profit below.
  const revenueMinusExpenses = totalDepartmentsRevenue - totalExpenses;

  // True net profit = revenue - general expenses (rent, salaries, etc.)
  // - cost of goods actually sold (Shop & Clinic item cost, computed
  // above as totalItemCost). Previously this only subtracted general
  // expenses, so it overstated profit by ignoring what the sold
  // inventory actually cost to buy.
  const netProfit = totalDepartmentsRevenue - totalExpenses - totalItemCost;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <Card className="print:hidden">
        <h2
          dir={isRtl ? "rtl" : "ltr"}
          className="text-xl font-bold mb-4 flex items-center gap-2"
        >
          <Receipt size={22} className="text-orange-500" />
          {t("reports")}
        </h2>

        <div dir={isRtl ? "rtl" : "ltr"} className="grid md:grid-cols-6 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              {t("from")}
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded-xl p-3 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">
              {t("to")}
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded-xl p-3 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <Button onClick={loadReport} className="flex-1">
              {t("generateReport")}
            </Button>

            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={18} />
              {t("print")}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <p className="text-center text-gray-400 py-6">{t("loading")}</p>
        </Card>
      )}

      {data && (
        <>
          {/* ---------- Rent & Salaries ---------- */}
          <Card>
            <SectionHeading>{t("rentAndSalaries") || "Rent & salaries"}</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              <StatTile
                icon={Building2}
                label={t("expenseCategoryRent") || "Rent"}
                value={`${formatIQD(expensesByCategoryMap["Rent"] || 0)} IQD`}
                sub={t("fromExpensesInRange") || "From logged expenses in this range"}
                bg="bg-gray-50"
                border="border-gray-200"
                iconBg="bg-gray-100"
                text="text-gray-700"
              />
              <StatTile
                icon={Users}
                label={t("salaries") || "Salaries"}
                value={`${formatIQD(expensesByCategoryMap["Salaries"] || 0)} IQD`}
                sub={t("fromExpensesInRange") || "From logged expenses in this range"}
                bg="bg-gray-50"
                border="border-gray-200"
                iconBg="bg-gray-100"
                text="text-gray-700"
              />
            </div>
          </Card>

          {/* ---------- Financial summary (top of report) ---------- */}
          <Card>
            <SectionHeading>
              {t("financialSummary") || "Financial summary"}
            </SectionHeading>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatTile
                icon={DollarSign}
                label={t("totalDepartmentsRevenue") || "Total revenue (all departments)"}
                value={`${formatIQD(totalDepartmentsRevenue)} IQD`}
                sub={`${totalSalesCount} ${t("bills") || "bills"} + ${formatIQD(totalDebtsPaid)} IQD ${t("debtsPaid") || "debts paid"}`}
                bg="bg-orange-50"
                border="border-orange-100"
                iconBg="bg-orange-100"
                text="text-orange-600"
              />
              <StatTile
                icon={Wallet}
                label={t("totalExpenses") || "Total expenses"}
                value={`${formatIQD(totalExpenses)} IQD`}
                sub={`${expensesList.length} ${t("entries") || "entries"}`}
                bg="bg-red-50"
                border="border-red-100"
                iconBg="bg-red-100"
                text="text-red-600"
              />
              <StatTile
                icon={revenueMinusExpenses >= 0 ? TrendingUp : TrendingDown}
                label={
                  t("revenueMinusExpensesLabel") ||
                  "Total revenue - Total expenses"
                }
                value={`${formatIQD(revenueMinusExpenses)} IQD`}
                sub={
                  t("beforeCogsNote") ||
                  "Before cost of goods sold (see Net profit)"
                }
                bg={revenueMinusExpenses >= 0 ? "bg-teal-50" : "bg-red-50"}
                border={
                  revenueMinusExpenses >= 0
                    ? "border-teal-100"
                    : "border-red-100"
                }
                iconBg={
                  revenueMinusExpenses >= 0 ? "bg-teal-100" : "bg-red-100"
                }
                text={
                  revenueMinusExpenses >= 0
                    ? "text-teal-600"
                    : "text-red-600"
                }
              />
              <StatTile
                icon={netProfit >= 0 ? TrendingUp : TrendingDown}
                label={t("netProfit") || "Net profit"}
                value={`${formatIQD(netProfit)} IQD`}
                sub={
                  t("revenueMinusExpensesAndCost") ||
                  "Revenue minus expenses and cost of goods sold"
                }
                bg={netProfit >= 0 ? "bg-green-50" : "bg-red-50"}
                border={netProfit >= 0 ? "border-green-100" : "border-red-100"}
                iconBg={netProfit >= 0 ? "bg-green-100" : "bg-red-100"}
                text={netProfit >= 0 ? "text-green-600" : "text-red-600"}
              />
              <StatTile
                icon={Package}
                label={t("totalInventoryCost") || "Total inventory cost"}
                value={`${formatIQD(inventoryPurchasedValue)} IQD`}
                sub={t("purchasedThisRange") || "Purchased in this range"}
                bg="bg-blue-50"
                border="border-blue-100"
                iconBg="bg-blue-100"
                text="text-blue-600"
              />
              <StatTile
                icon={DollarSign}
                label={t("totalInventoryRevenue") || "Total inventory revenue"}
                value={`${formatIQD(inventoryRevenue)} IQD`}
                sub={t("soldThisRange") || "Sold in this range"}
                bg="bg-teal-50"
                border="border-teal-100"
                iconBg="bg-teal-100"
                text="text-teal-600"
              />
              <StatTile
                icon={Wallet}
                label={t("otherExpenses") || "Other / general expenses"}
                value={`${formatIQD(generalExpensesTotal)} IQD`}
                sub={t("rentUtilitiesEtc") || "Rent, utilities, salaries, etc."}
                bg="bg-gray-50"
                border="border-gray-200"
                iconBg="bg-gray-100"
                text="text-gray-600"
              />
            </div>

            <p className="mb-2 text-xs font-medium text-gray-400">
              {t("netProfitByDepartment") ||
                "Net profit by department (revenue minus that department's own expenses)"}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {netProfitBreakdown.map((dept) => (
                <Fragment key={dept.key}>
                  <div className={`rounded-2xl border ${dept.border} ${dept.bg} p-4`}>
                    <p
                      className={`text-sm font-semibold ${dept.text} mb-2 flex items-center gap-1`}
                    >
                      <dept.icon size={16} /> {t(`department${dept.key}`) || dept.label}
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>{t("revenue") || "Revenue"}</span>
                        <span className="font-semibold">
                          {formatIQD(dept.revenue)} IQD
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{t("expenses") || "Expenses"}</span>
                        <span className="font-semibold">
                          -{formatIQD(dept.expense)} IQD
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold text-gray-900">
                        <span>
                          {dept.key === "Salon"
                            ? t("salonNetShare") || "Net (after partner's share)"
                            : t("net") || "Net"}
                        </span>
                        <span className={dept.net >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatIQD(dept.net)} IQD
                        </span>
                      </div>

                      {dept.key === "Salon" && (
                        <p className="text-[10px] text-gray-400 pt-0.5">
                          {t("salonSplitNote") ||
                            `Full net ${formatIQD(dept.netFull)} IQD. ${SALON_PARTNER_NAME}'s share reflects only bills marked "split with partner".`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Parvis's actual share of only the SPLIT Salon bills,
                      shown right next to the Salon card */}
                  {dept.key === "Salon" && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                        <Handshake size={16} /> {SALON_PARTNER_NAME}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>{t("salonFullNet") || "Salon net profit (full)"}</span>
                          <span className="font-semibold">
                            {formatIQD(salonFullNet)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>{t("splitBillsRevenue") || "Revenue from split bills"}</span>
                          <span className="font-semibold">
                            {formatIQD(salonSplitSales.total)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>{t("splitRatio") || "Split ratio"}</span>
                          <span className="font-semibold">50 / 50</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 font-bold text-gray-900">
                          <span>
                            {t("parvisShareLabel") || `${SALON_PARTNER_NAME}'s share (50%)`}
                          </span>
                          <span className={parvisShare >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatIQD(parvisShare)} IQD
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 pt-0.5">
                          {t("parvisIndependentNote") ||
                            'Only counts bills where "split with partner" was toggled on in the basket. Informational only — this figure is not subtracted a second time from Salon\'s net, Sales Overview, or Total Revenue.'}
                        </p>
                      </div>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              {t("generalExpensesNote") ||
                "Rent, utilities, maintenance, transport, salaries and other uncategorized expenses are only subtracted from the overall net profit above, not from a single department."}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              {t("netProfitCogsNote") ||
                `The overall net profit above also subtracts the cost of goods sold (${formatIQD(totalItemCost)} IQD, Shop & Clinic items — see "Item sales — cost & profit" below). The per-department net figures here do not include that item cost.`}
            </p>
          </Card>

          {/* ---------- Sales overview ---------- */}
          <Card>
            <SectionHeading>{t("salesOverview") || "Sales overview"}</SectionHeading>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatTile
                icon={DollarSign}
                label={t("totalRevenue") || "Total revenue"}
                value={`${formatIQD(salesOverviewRevenue)} IQD`}
                sub={t("shopSalonClinicOnly") || "Shop, Salon & Clinic only"}
                bg="bg-orange-50"
                border="border-orange-100"
                iconBg="bg-orange-100"
                text="text-orange-600"
              />
              <StatTile
                icon={Receipt}
                label={t("totalSales") || "Total sales"}
                value={salesOverviewCount}
                sub={t("numberOfBills") || "Number of bills"}
                bg="bg-teal-50"
                border="border-teal-100"
                iconBg="bg-teal-100"
                text="text-teal-600"
              />
              <StatTile
                icon={Trophy}
                label={t("averageSale") || "Average sale"}
                value={`${formatIQD(averageSale)} IQD`}
                bg="bg-amber-50"
                border="border-amber-100"
                iconBg="bg-amber-100"
                text="text-amber-600"
              />
            </div>

            <p className="mb-2 text-xs font-medium text-gray-400">
              {t("salesByDepartment") || "Sales by department"}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DEPARTMENT_CONFIG.map((cfg) => {
                const stats = salesDeptMap[cfg.key] || { total: 0, count: 0 };
                // Salon's split bills have only their 50% business
                // share counted here; non-split bills count in full.
                const displayTotal =
                  cfg.key === "Salon"
                    ? salonNotSplitSales.total + salonSplitSales.total * SALON_SPLIT_RATIO
                    : stats.total;

                return (
                  <StatTile
                    key={cfg.key}
                    icon={cfg.icon}
                    label={t(`department${cfg.key}`) || cfg.key}
                    value={`${formatIQD(displayTotal)} IQD`}
                    sub={`${stats.count} ${t("bills") || "bills"}`}
                    bg={cfg.bg}
                    border={cfg.border}
                    iconBg={cfg.iconBg}
                    text={cfg.text}
                  />
                );
              })}
            </div>
          </Card>

          {/* ---------- Item sales cost & profit (Shop & Clinic) ---------- */}
          <Card>
            <SectionHeading>
              {t("itemSalesCostProfit") || "Item sales — cost & profit (Shop & Clinic)"}
            </SectionHeading>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatTile
                icon={DollarSign}
                label={t("totalRevenue") || "Total revenue"}
                value={`${formatIQD(totalItemRevenue)} IQD`}
                sub={t("itemsSoldShopClinic") || "Items sold, Shop & Clinic"}
                bg="bg-orange-50"
                border="border-orange-100"
                iconBg="bg-orange-100"
                text="text-orange-600"
              />
              <StatTile
                icon={Package}
                label={t("totalCost") || "Total cost"}
                value={`${formatIQD(totalItemCost)} IQD`}
                sub={t("costPriceOfItemsSold") || "Cost price of items sold"}
                bg="bg-red-50"
                border="border-red-100"
                iconBg="bg-red-100"
                text="text-red-600"
              />
              <StatTile
                icon={totalItemProfit >= 0 ? TrendingUp : TrendingDown}
                label={t("totalProfit") || "Total profit"}
                value={`${formatIQD(totalItemProfit)} IQD`}
                sub={t("revenueMinusCost") || "Revenue minus cost"}
                bg={totalItemProfit >= 0 ? "bg-green-50" : "bg-red-50"}
                border={totalItemProfit >= 0 ? "border-green-100" : "border-red-100"}
                iconBg={totalItemProfit >= 0 ? "bg-green-100" : "bg-red-100"}
                text={totalItemProfit >= 0 ? "text-green-600" : "text-red-600"}
              />
            </div>

            <p className="mb-2 text-xs font-medium text-gray-400">
              {t("itemCostByDepartment") || "By department"}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ITEM_COST_DEPARTMENTS.map((cfg) => {
                const d = itemCostCardData[cfg.key] || EMPTY_ITEM_COST;
                return (
                  <div key={cfg.key} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
                    <p className={`text-sm font-semibold ${cfg.text} mb-2 flex items-center gap-1`}>
                      <cfg.icon size={16} /> {t(`department${cfg.key}`) || cfg.key}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>{t("revenue") || "Revenue"}</span>
                        <span className="font-semibold">{formatIQD(d.revenue)} IQD</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{t("cost") || "Cost"}</span>
                        <span className="font-semibold">-{formatIQD(d.cost)} IQD</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold text-gray-900">
                        <span>{t("profit") || "Profit"}</span>
                        <span className={d.profit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatIQD(d.profit)} IQD
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              {t("itemCostNote") ||
                "Cost is the inventory cost price of items actually sold (bills + debts) in Shop and Clinic during this range — separate from the purchased/used inventory figures above."}
            </p>
          </Card>

          {/* ---------- Payment methods ---------- */}
          <Card>
            <SectionHeading>{t("paymentMethods") || "Payment methods"}</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_CONFIG.map((cfg) => {
                const stats = salesPaymentMap[cfg.key] || { total: 0, count: 0 };
                return (
                  <StatTile
                    key={cfg.key}
                    icon={cfg.icon}
                    label={t(cfg.key) || cfg.key}
                    value={`${formatIQD(stats.total)} IQD`}
                    sub={`${stats.count} ${t("bills") || "bills"}`}
                    bg={cfg.bg}
                    border={cfg.border}
                    iconBg={cfg.iconBg}
                    text={cfg.text}
                  />
                );
              })}
            </div>
          </Card>

          {/* ---------- Rooms overview (Hotel + Hospital) ---------- */}
          <Card>
            <SectionHeading>
              {t("roomsOverview") || "Rooms overview (Hotel + Hospital)"}
            </SectionHeading>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <StatTile
                icon={BedDouble}
                label={t("roomsTotalRevenue") || "Total rooms revenue"}
                value={`${formatIQD(roomsTotal)} IQD`}
                sub={`${roomsStayCount} ${t("stays") || "stays"}`}
                bg="bg-orange-50"
                border="border-orange-100"
                iconBg="bg-orange-100"
                text="text-orange-600"
              />
              <StatTile
                icon={Banknote}
                label={t("totalPaid") || "Total paid"}
                value={`${formatIQD(roomsPaid)} IQD`}
                bg="bg-green-50"
                border="border-green-100"
                iconBg="bg-green-100"
                text="text-green-600"
              />
              <StatTile
                icon={Receipt}
                label={t("totalRemaining") || "Total remaining"}
                value={`${formatIQD(roomsRemaining)} IQD`}
                bg="bg-red-50"
                border="border-red-100"
                iconBg="bg-red-100"
                text="text-red-600"
              />
            </div>

            <p className="mb-2 text-xs font-medium text-gray-400">
              {t("roomsByDepartment") || "Rooms by department"}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-700 mb-2 flex items-center gap-1">
                  <BedDouble size={16} /> {t("departmentHotel") || "Hotel"}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("total") || "Total"}</span>
                    <span className="font-semibold">
                      {formatIQD(hotelStats.total)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{t("paid") || "Paid"}</span>
                    <span className="font-semibold">
                      {formatIQD(hotelStats.paid)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{t("remaining") || "Remaining"}</span>
                    <span className="font-semibold">
                      {formatIQD(hotelStats.remaining)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs pt-1 border-t">
                    <span>{t("stays") || "Stays"}</span>
                    <span>{hotelStats.count}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <p className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1">
                  <Building2 size={16} /> {t("departmentHospital") || "Hospital"}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("total") || "Total"}</span>
                    <span className="font-semibold">
                      {formatIQD(hospitalStats.total)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{t("paid") || "Paid"}</span>
                    <span className="font-semibold">
                      {formatIQD(hospitalStats.paid)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{t("remaining") || "Remaining"}</span>
                    <span className="font-semibold">
                      {formatIQD(hospitalStats.remaining)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs pt-1 border-t">
                    <span>{t("stays") || "Stays"}</span>
                    <span>{hospitalStats.count}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ---------- Debts overview (Shop / Salon / Clinic + Total + Parvis) ---------- */}
          <Card>
            <SectionHeading>{t("debtsOverview") || "Debts overview"}</SectionHeading>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...DEBT_CARD_DEPARTMENTS, { key: "Total", label: "totalDebt", fallback: "Total debt", border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-800" }].map(
                (box) => {
                  const d = debtCardData[box.key] || EMPTY_DEBT;
                  return (
                    <div
                      key={box.key}
                      className={`rounded-2xl border ${box.border} ${box.bg} p-4`}
                    >
                      <p
                        className={`text-sm font-semibold ${box.text} mb-2 flex items-center gap-1`}
                      >
                        <HandCoins size={16} /> {t(box.label) || box.fallback}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>{t("total") || "Total"}</span>
                          <span className="font-semibold">
                            {formatIQD(d.total)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>{t("paid") || "Paid"}</span>
                          <span className="font-semibold">
                            {formatIQD(d.paid)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>{t("remaining") || "Remaining"}</span>
                          <span className="font-semibold">
                            {formatIQD(d.remaining)} IQD
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-xs pt-1 border-t">
                          <span>{t("debts") || "Debts"}</span>
                          <span>{d.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {/* Parvis's matching 50% share of Salon debts that
                  actually had the split-with-partner toggle on. Purely
                  informational — never subtracted a second time from
                  Salon's own debt card or the combined Total debt card. */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                  <Handshake size={16} /> {SALON_PARTNER_NAME}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t("total") || "Total"}</span>
                    <span className="font-semibold">
                      {formatIQD(parvisDebtShare.total)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{t("paid") || "Paid"}</span>
                    <span className="font-semibold">
                      {formatIQD(parvisDebtShare.paid)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>{t("remaining") || "Remaining"}</span>
                    <span className="font-semibold">
                      {formatIQD(parvisDebtShare.remaining)} IQD
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs pt-1 border-t">
                    <span>{t("debts") || "Debts"}</span>
                    <span>{parvisDebtShare.count}</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-gray-400">
                  {t("parvisDebtNote") ||
                    `${SALON_PARTNER_NAME}'s 50% share of Salon debts marked "split with partner". Informational only.`}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              {t("debtsPaidRevenueNote") ||
                "Amounts paid on debts in this range are included in \"Total revenue (all departments)\" above, minus Parvis's share of split Salon debt payments. Outstanding/remaining debt is not counted as revenue."}
            </p>
          </Card>

          {/* ---------- Operations overview ---------- */}
          <Card>
            <SectionHeading>{t("operationsOverview") || "Operations overview"}</SectionHeading>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatTile
                icon={PawPrint}
                label={t("dogsCaptured")}
                value={data.summary.dogs}
                bg="bg-orange-50"
                border="border-orange-100"
                iconBg="bg-orange-100"
                text="text-orange-600"
              />
              <StatTile
                icon={Syringe}
                label={t("procedures")}
                value={data.summary.procedures}
                bg="bg-green-50"
                border="border-green-100"
                iconBg="bg-green-100"
                text="text-green-600"
              />
              <StatTile
                icon={Package}
                label={t("inventoryAdded")}
                value={data.summary.inventory}
                bg="bg-blue-50"
                border="border-blue-100"
                iconBg="bg-blue-100"
                text="text-blue-600"
              />
              <StatTile
                icon={DollarSign}
                label={t("inventoryCost")}
                value={`${formatIQD(inventoryPurchasedValue)} IQD`}
                bg="bg-purple-50"
                border="border-purple-100"
                iconBg="bg-purple-100"
                text="text-purple-600"
              />
              <StatTile
                icon={Package}
                label={t("usedItems")}
                value={totalUsedItems}
                bg="bg-red-50"
                border="border-red-100"
                iconBg="bg-red-100"
                text="text-red-600"
              />
              <StatTile
                icon={Users}
                label={t("totalSalary")}
                value={`${formatIQD(totalSalary)} IQD`}
                bg="bg-indigo-50"
                border="border-indigo-100"
                iconBg="bg-indigo-100"
                text="text-indigo-600"
              />
            </div>
          </Card>

          {/* ---------- Expenses ---------- */}
          <Card>
            <h3 dir={isRtl ? "rtl" : "ltr"} className="font-bold mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-red-500" />
              {t("expenses") || "Expenses"}
            </h3>

            {expensesList.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">
                {t("noExpensesInRange") || "No expenses recorded in this date range"}
              </p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {Object.entries(expensesByCategoryMap).map(([cat, amount]) => (
                    <StatTile
                      key={cat}
                      icon={Wallet}
                      label={t(`expenseCategory${cat}`) || cat}
                      value={`${formatIQD(amount)} IQD`}
                      bg="bg-gray-50"
                      border="border-gray-200"
                      iconBg="bg-gray-100"
                      text="text-gray-700"
                    />
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">{t("date") || "Date"}</th>
                        <th className="p-3 text-left">{t("description") || "Description"}</th>
                        <th className="p-3 text-left">{t("category") || "Category"}</th>
                        <th className="p-3 text-right">{t("amount") || "Amount"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expensesList.map((e, idx) => (
                        <tr
                          key={e.id}
                          className={`border-b last:border-0 ${
                            idx % 2 === 1 ? "bg-gray-50/50" : ""
                          } hover:bg-orange-50`}
                        >
                          <td className="p-3 text-gray-600">
                            {new Date(e.expense_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-medium text-gray-700">
                            {e.description}
                          </td>
                          <td className="p-3 text-gray-600">
                            {t(`expenseCategory${e.category}`) || e.category || "-"}
                          </td>
                          <td className="p-3 text-right font-semibold text-red-600">
                            {formatIQD(e.amount)} IQD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold text-gray-900">
                        <td className="p-3" colSpan={3}>
                          {t("totalExpenses") || "Total expenses"}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {formatIQD(totalExpenses)} IQD
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </Card>

          {/* ---------- Top selling items ---------- */}
          {data.topItems && data.topItems.length > 0 && (
            <Card>
              <h3
                dir={isRtl ? "rtl" : "ltr"}
                className="font-bold mb-4 flex items-center gap-2"
              >
                <Trophy size={18} className="text-amber-500" />
                {t("topSellingItems") || "Top selling items"}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">{t("name")}</th>
                      <th className="p-3 text-center">{t("quantitySold") || "Qty sold"}</th>
                      <th className="p-3 text-right">{t("revenue") || "Revenue"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topItems.map((item, idx) => (
                      <tr
                        key={item.item_name}
                        className={`border-b last:border-0 ${
                          idx % 2 === 1 ? "bg-gray-50/50" : ""
                        } hover:bg-orange-50`}
                      >
                        <td className="p-3 font-medium text-gray-700">{item.item_name}</td>
                        <td className="p-3 text-center">{item.quantity_sold}</td>
                        <td className="p-3 text-right font-semibold text-orange-600">
                          {formatIQD(item.revenue)} IQD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ---------- Dogs ---------- */}
          <Card>
            <h3 dir={isRtl ? "rtl" : "ltr"} className="font-bold mb-4 flex items-center gap-2">
              <PawPrint size={18} className="text-orange-500" />
              {t("dogs")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">{t("dogId")}</th>
                    <th className="text-left p-3">{t("capturedate")}</th>
                    <th className="text-left p-3">{t("sex")}</th>
                    <th className="text-left p-3">{t("outcome")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dogs.map((dog, idx) => (
                    <tr
                      key={dog.id}
                      className={`border-b last:border-0 ${
                        idx % 2 === 1 ? "bg-gray-50/50" : ""
                      } hover:bg-orange-50`}
                    >
                      <td className="p-3">{dog.dog_id}</td>
                      <td className="p-3">
                        {new Date(dog.capture_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">{dog.sex}</td>
                      <td className="p-3">{dog.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ---------- Procedures ---------- */}
          <Card>
            <h3 dir={isRtl ? "rtl" : "ltr"} className="font-bold mb-4 flex items-center gap-2">
              <Syringe size={18} className="text-green-500" />
              {t("procedures")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">{t("vetenerianName")}</th>
                    <th className="text-left p-3">{t("procedureType")}</th>
                    <th className="text-left p-3">{t("dates")}</th>
                    <th className="text-left p-3">{t("successful")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.procedures.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b last:border-0 ${
                        idx % 2 === 1 ? "bg-gray-50/50" : ""
                      } hover:bg-orange-50`}
                    >
                      <td className="p-3">{p.veterinarian_name}</td>
                      <td className="p-3">{p.procedure_type}</td>
                      <td className="p-3">
                        {new Date(p.procedure_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">{p.surgery_successful ? t("yes") : t("no")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ---------- Inventory ---------- */}
          <Card>
            <h3 dir={isRtl ? "rtl" : "ltr"} className="font-bold mb-4 flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              {t("inventory")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">{t("name")}</th>
                    <th className="p-3 text-center">{t("purchased")}</th>
                    <th className="p-3 text-center">{t("used")}</th>
                    <th className="p-3 text-center">{t("currentStock")}</th>
                    <th className="p-3 text-right">{t("cost")}</th>
                    <th className="p-3 text-right">{t("totalCost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.map((item, idx) => {
                    const purchaseValue =
                      Number(item.purchased_quantity || 0) * Number(item.cost_price || 0);

                    return (
                      <tr
                        key={item.id}
                        className={`border-b last:border-0 ${
                          idx % 2 === 1 ? "bg-gray-50/50" : ""
                        } hover:bg-orange-50`}
                      >
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-center">{item.purchased_quantity}</td>
                        <td className="p-3 text-center text-red-600">{item.used_quantity}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatIQD(item.cost_price)} IQD</td>
                        <td className="p-3 text-right font-semibold">
                          {formatIQD(purchaseValue)} IQD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ---------- Staff performance ---------- */}
          <Card>
            <h3 dir={isRtl ? "rtl" : "ltr"} className="font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-indigo-500" />
              {t("staffPerformance")}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">{t("staffName")}</th>
                    <th className="p-3 text-left">{t("role")}</th>
                    <th className="p-3 text-right">{t("salary")}</th>
                    <th className="p-3 text-center">{t("proceduresDone")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.staff?.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      className={`border-b last:border-0 ${
                        idx % 2 === 1 ? "bg-gray-50/50" : ""
                      } hover:bg-orange-50`}
                    >
                      <td className="p-3">{staff.full_name}</td>
                      <td className="p-3">{staff.role}</td>
                      <td className="p-3 text-right">{formatIQD(staff.salary)} IQD</td>
                      <td className="p-3 text-center font-semibold">
                        {staff.procedures_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}