"use client"

import {
  DollarSign,
  Receipt,
  Wallet,
  BookOpen,
  Users,
  TrendingUp,
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
  incomeRecords,
  expenses,
  getCashAtHand,
  getFreddyLedger,
  formatCurrency,
} from "@/lib/mock-data"

export default function DashboardPage() {
  const totalIncome = incomeRecords
    .filter((r) => r.date.startsWith("2026-02"))
    .reduce((sum, r) => sum + r.totalAmount, 0)
  const totalExpenses = expenses
    .filter((e) => e.date.startsWith("2026-02"))
    .reduce((sum, e) => sum + e.amount, 0)
  const cash = getCashAtHand()
  const freddy = getFreddyLedger()
  const totalAttendance = incomeRecords
    .filter((r) => r.date.startsWith("2026-02"))
    .reduce((sum, r) => sum + r.adults + r.children, 0)
  const outstandingBalances = incomeRecords.reduce((sum, r) => sum + r.balance, 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of church finances and attendance"
        breadcrumb="Dashboard"
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Monthly Income"
            value={formatCurrency(totalIncome)}
            icon={DollarSign}
            trend={{ value: "12%", positive: true }}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Monthly Expenses"
            value={formatCurrency(totalExpenses)}
            icon={Receipt}
            trend={{ value: "5%", positive: false }}
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="Cash At Hand"
            value={formatCurrency(cash.balance)}
            icon={Wallet}
            description={`In: ${formatCurrency(cash.cashIn)}`}
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Owed to Freddy"
            value={formatCurrency(freddy.balance)}
            icon={BookOpen}
            description={`Refunded: ${formatCurrency(freddy.totalRefund)}`}
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
            title="Outstanding"
            value={formatCurrency(outstandingBalances)}
            icon={TrendingUp}
            description="Across all assemblies"
            iconClassName="bg-warning/10 text-warning"
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
