"use client"

import { useState, useEffect, useCallback } from "react"
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
import { formatCurrency } from "@/lib/mock-data"
import type { Assembly } from "@/lib/mock-data"

export default function DashboardPage() {
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [stats, setStats] = useState({
    totalIncome: 0, totalExpenses: 0, cashBalance: 0, cashUSD: 0,
    owedBalance: 0, totalAttendance: 0, totalAssetValue: 0,
  })

  const fetchData = useCallback(async () => {
    const [asmRes, dashRes] = await Promise.all([
      fetch("/api/assemblies"),
      fetch(`/api/dashboard?assemblyId=${assemblyFilter}`),
    ])
    setAssemblies(await asmRes.json())
    setStats(await dashRes.json())
  }, [assemblyFilter])

  useEffect(() => { fetchData() }, [fetchData])

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
              {assemblies.filter((a) => a.status === "ACTIVE").map((a) => (
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
            title="Total Income"
            value={formatCurrency(stats.totalIncome, "USD")}
            icon={DollarSign}
            description="USD equivalent"
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(stats.totalExpenses, "USD")}
            icon={Receipt}
            description="USD equivalent"
            iconClassName="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="Cash At Hand"
            value={formatCurrency(stats.cashBalance, "USD")}
            icon={Wallet}
            description={`USD: ${formatCurrency(stats.cashUSD, "USD")}`}
            iconClassName="bg-success/10 text-success"
          />
          <StatCard
            title="Total Owed"
            value={formatCurrency(stats.owedBalance, "USD")}
            icon={BookOpen}
            description="To owed persons"
            iconClassName="bg-warning/10 text-warning"
          />
          <StatCard
            title="Attendance"
            value={stats.totalAttendance.toLocaleString()}
            icon={Users}
            description="Total headcount"
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            title="Asset Value"
            value={formatCurrency(stats.totalAssetValue, "USD")}
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
