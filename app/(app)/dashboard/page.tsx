"use client"

import { useState } from "react"
import {
  DollarSign,
  Receipt,
  Wallet,
  BookOpen,
  Users,
  TrendingUp,
  Package,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import {
  IncomeExpenseChart,
  AttendanceChart,
  AssemblyComparisonChart,
} from "@/components/dashboard-charts"
import { RecentActivity } from "@/components/recent-activity"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  incomeRecords,
  expenses,
  assets,
  getCashAtHand,
  getOwedLedger,
  formatCurrency,
  convertToUSD,
  assemblies,
} from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"

export default function DashboardPage() {
  const { currency } = useCurrency()
  const [assemblyFilter, setAssemblyFilter] = useState("all")

  const filteredIncome = incomeRecords
    .filter((r) => r.date.startsWith("2026-02"))
    .filter((r) => assemblyFilter === "all" || r.assemblyId === assemblyFilter)

  const filteredExpenses = expenses
    .filter((e) => e.date.startsWith("2026-02"))
    .filter((e) => assemblyFilter === "all" || e.assemblyId === assemblyFilter)

  // Convert everything to USD for unified dashboard stats
  const totalIncome = filteredIncome.reduce((sum, r) => sum + convertToUSD(r.totalAmount, r.currency), 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)

  const cash = getCashAtHand()
  const cashBalance = cash.usd.balance + convertToUSD(cash.zwl.balance, "ZWL")

  const owed = getOwedLedger()
  const owedBalance = owed.usd.balance + convertToUSD(owed.zwl.balance, "ZWL")

  const totalAttendance = filteredIncome.reduce((sum, r) => sum + r.adults + r.children, 0)

  const totalAssetValue = assets
    .filter((a) => assemblyFilter === "all" || a.assemblyId === assemblyFilter)
    .reduce((s, a) => s + convertToUSD(a.currentValue, a.currency), 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of church finances and attendance"
        breadcrumb="Dashboard"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Viewing in USD equiv.
          </Badge>
          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Assemblies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {assemblies.filter((a) => a.status === "active").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Monthly Income"
            value={formatCurrency(totalIncome, "USD")}
            icon={DollarSign}
            trend={{ value: "12%", positive: true }}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Monthly Expenses"
            value={formatCurrency(totalExpenses, "USD")}
            icon={Receipt}
            trend={{ value: "5%", positive: false }}
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="Cash At Hand"
            value={formatCurrency(cashBalance, "USD")}
            icon={Wallet}
            description={`USD: ${formatCurrency(cash.usd.balance, "USD")}`}
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Total Owed"
            value={formatCurrency(owedBalance, "USD")}
            icon={BookOpen}
            description="To owed persons"
            iconClassName="bg-warning/10 text-warning"
          />
          <StatCard
            title="Attendance"
            value={totalAttendance.toLocaleString()}
            icon={Users}
            trend={{ value: "8%", positive: true }}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Asset Value"
            value={formatCurrency(totalAssetValue, "USD")}
            icon={Package}
            description="Current valuation"
            iconClassName="bg-success/10 text-success"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <IncomeExpenseChart />
          <AttendanceChart />
        </div>

        {/* Charts Row 2 + Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AssemblyComparisonChart />
          </div>
          <RecentActivity />
        </div>
      </div>
    </>
  )
}
