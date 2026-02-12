"use client"

import { useState, useEffect, useMemo } from "react"
import { Download, Printer } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import type { Assembly, IncomeRecord, Expense } from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"

const COLORS = [
  "hsl(213, 94%, 40%)",
  "hsl(160, 64%, 43%)",
  "hsl(32, 95%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 52%)",
  "hsl(340, 75%, 55%)",
  "hsl(190, 70%, 42%)",
  "hsl(50, 90%, 45%)",
]

/* ── helpers ─────────────────────────────────────────────── */

function buildMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [{ value: "all", label: "All Time" }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" })
    options.push({ value: val, label })
  }
  return options
}

function inPeriod(dateStr: string, period: string): boolean {
  if (period === "all") return true
  const d = new Date(dateStr)
  const [y, m] = period.split("-").map(Number)
  return d.getFullYear() === y && d.getMonth() + 1 === m
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  if (day <= 7) return "Week 1"
  if (day <= 14) return "Week 2"
  if (day <= 21) return "Week 3"
  return "Week 4"
}

export default function ReportsPage() {
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [period, setPeriod] = useState("all")
  const [assemblyFilter, setAssemblyFilter] = useState("all")

  const monthOptions = useMemo(() => buildMonthOptions(), [])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses"), fetch("/api/assemblies")]).then(
      async ([incRes, expRes, asmRes]) => {
        setIncomeRecords(await incRes.json())
        setExpenses(await expRes.json())
        setAssemblies(await asmRes.json())
      }
    )
  }, [])

  /* ── filtered data ─────────────────────────────────────── */
  const filteredIncome = useMemo(
    () =>
      incomeRecords
        .filter((r) => inPeriod(r.date, period))
        .filter((r) => assemblyFilter === "all" || r.assemblyId === assemblyFilter),
    [incomeRecords, period, assemblyFilter]
  )

  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((e) => inPeriod(e.date, period))
        .filter((e) => assemblyFilter === "all" || e.assemblyId === assemblyFilter),
    [expenses, period, assemblyFilter]
  )

  // Cash at hand computed
  const cashInUSD = filteredIncome.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.received, 0)
  const cashOutUSD = filteredExpenses.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "USD").reduce((sum, e) => sum + e.amount, 0)
  const cashBalance = cashInUSD - cashOutUSD

  // Owed balance computed
  const owedExpenses = filteredExpenses.filter((e) => e.paymentSource === "OWED_PERSON")
  const owedBalance = owedExpenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)

  // Income by category
  const incomeCategories = [
    { name: "Offering", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.offering, r.currency), 0) },
    { name: "Tithe", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.tithe, r.currency), 0) },
    { name: "Feast Badges", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.feastBadges, r.currency), 0) },
    { name: "Firewood", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.firewood, r.currency), 0) },
    { name: "Instruments", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.instruments, r.currency), 0) },
    { name: "Welfare", value: filteredIncome.reduce((s, r) => s + convertToUSD(r.pastorsWelfare, r.currency), 0) },
  ]

  // Expense by source
  const expenseBySource = [
    { name: "Cash at Hand", value: filteredExpenses.filter((e) => e.paymentSource === "CASH_AT_HAND").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
    { name: "Owed Person", value: filteredExpenses.filter((e) => e.paymentSource === "OWED_PERSON").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
    { name: "Pastor", value: filteredExpenses.filter((e) => e.paymentSource === "PASTOR").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
  ]

  // Assembly summary
  const activeAssemblies = assemblies.filter((a) => a.status === "ACTIVE")
  const assemblySummary = activeAssemblies.map((a) => {
    const income = filteredIncome.filter((r) => r.assemblyId === a.id)
    const exp = filteredExpenses.filter((e) => e.assemblyId === a.id)
    return {
      id: a.id,
      name: a.name,
      leader: a.leader,
      totalIncome: income.reduce((s, r) => s + convertToUSD(r.totalAmount, r.currency), 0),
      totalExpenses: exp.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0),
      adults: income.reduce((s, r) => s + r.adults, 0),
      children: income.reduce((s, r) => s + r.children, 0),
      totalAttendance: income.reduce((s, r) => s + r.adults + r.children, 0),
      newSouls: income.reduce((s, r) => s + r.newSouls, 0),
      balance: income.reduce((s, r) => s + convertToUSD(r.balance, r.currency), 0),
      services: income.length,
    }
  })

  const grandTotalIncome = assemblySummary.reduce((s, a) => s + a.totalIncome, 0)
  const grandTotalExpenses = assemblySummary.reduce((s, a) => s + a.totalExpenses, 0)
  const grandTotalAttendance = assemblySummary.reduce((s, a) => s + a.totalAttendance, 0)
  const grandTotalAdults = assemblySummary.reduce((s, a) => s + a.adults, 0)
  const grandTotalChildren = assemblySummary.reduce((s, a) => s + a.children, 0)
  const grandTotalNewSouls = assemblySummary.reduce((s, a) => s + a.newSouls, 0)
  const grandTotalServices = assemblySummary.reduce((s, a) => s + a.services, 0)

  /* ── attendance trend data (weekly breakdown within selected period) ── */
  const attendanceTrend = useMemo(() => {
    if (period === "all") {
      // Group by month
      const map = new Map<string, { adults: number; children: number; total: number }>()
      filteredIncome.forEach((r) => {
        const d = new Date(r.date)
        const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
        const cur = map.get(key) || { adults: 0, children: 0, total: 0 }
        cur.adults += r.adults
        cur.children += r.children
        cur.total += r.adults + r.children
        map.set(key, cur)
      })
      return Array.from(map.entries())
        .map(([name, v]) => ({ name, ...v }))
    }
    // Group by week within month
    const map = new Map<string, { adults: number; children: number; total: number }>()
    ;["Week 1", "Week 2", "Week 3", "Week 4"].forEach((w) => map.set(w, { adults: 0, children: 0, total: 0 }))
    filteredIncome.forEach((r) => {
      const week = getWeekLabel(r.date)
      const cur = map.get(week)!
      cur.adults += r.adults
      cur.children += r.children
      cur.total += r.adults + r.children
    })
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }))
  }, [filteredIncome, period])

  /* ── attendance by assembly (bar chart) ── */
  const attendanceByAssembly = assemblySummary
    .filter((a) => a.totalAttendance > 0)
    .sort((a, b) => b.totalAttendance - a.totalAttendance)

  /* ── new souls trend data ── */
  const newSoulsTrend = useMemo(() => {
    if (period === "all") {
      const map = new Map<string, number>()
      filteredIncome.forEach((r) => {
        const d = new Date(r.date)
        const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
        map.set(key, (map.get(key) || 0) + r.newSouls)
      })
      return Array.from(map.entries()).map(([name, souls]) => ({ name, souls }))
    }
    const map = new Map<string, number>()
    ;["Week 1", "Week 2", "Week 3", "Week 4"].forEach((w) => map.set(w, 0))
    filteredIncome.forEach((r) => {
      const week = getWeekLabel(r.date)
      map.set(week, (map.get(week) || 0) + r.newSouls)
    })
    return Array.from(map.entries()).map(([name, souls]) => ({ name, souls }))
  }, [filteredIncome, period])

  /* ── new souls by assembly ── */
  const newSoulsByAssembly = assemblySummary
    .filter((a) => a.newSouls > 0)
    .sort((a, b) => b.newSouls - a.newSouls)

  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial reports, attendance & new souls analytics"
        breadcrumb="Reports"
      >
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select assembly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {activeAssemblies.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="summary" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="income">Income Breakdown</TabsTrigger>
            <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="newsouls">New Souls</TabsTrigger>
          </TabsList>

          {/* ═══════ Summary Tab ═══════ */}
          <TabsContent value="summary" className="flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Income</span>
                  <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(grandTotalIncome)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</span>
                  <p className="mt-1 text-xl font-bold text-destructive">{formatCurrency(grandTotalExpenses)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cash at Hand</span>
                  <p className="mt-1 text-xl font-bold text-success">{formatCurrency(cashBalance)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Owed</span>
                  <p className="mt-1 text-xl font-bold text-warning">{formatCurrency(owedBalance)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Attendance</span>
                  <p className="mt-1 text-xl font-bold">{grandTotalAttendance.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Souls</span>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{grandTotalNewSouls.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Assembly Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {assemblyFilter === "all" ? "All Assemblies Overview" : "Assembly Report"}
                </CardTitle>
                <CardDescription>
                  {assemblyFilter === "all"
                    ? "Performance overview across all assemblies"
                    : `Detailed report for ${activeAssemblies.find((a) => a.id === assemblyFilter)?.name || "selected assembly"}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Assembly</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                      <TableHead className="text-right">New Souls</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assemblySummary
                      .filter((a) => assemblyFilter === "all" || a.id === assemblyFilter)
                      .map((a) => (
                        <TableRow key={a.name}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-muted-foreground">{a.leader}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(a.totalIncome)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(a.totalExpenses)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-success">
                            {formatCurrency(a.totalIncome - a.totalExpenses)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{a.totalAttendance}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.newSouls}</TableCell>
                          <TableCell className="text-right tabular-nums text-warning font-medium">
                            {formatCurrency(a.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                  {assemblyFilter === "all" && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Grand Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{formatCurrency(grandTotalIncome)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{formatCurrency(grandTotalExpenses)}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-success">
                          {formatCurrency(grandTotalIncome - grandTotalExpenses)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalAttendance}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalNewSouls}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-warning">
                          {formatCurrency(assemblySummary.reduce((s, a) => s + a.balance, 0))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ Income Breakdown Tab ═══════ */}
          <TabsContent value="income" className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Income by Category</CardTitle>
                  <CardDescription>Breakdown of income sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {incomeCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Income by Category</CardTitle>
                  <CardDescription>Detailed amounts per source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeCategories} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                        <XAxis type="number" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="hsl(213, 94%, 40%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════ Expense Analysis Tab ═══════ */}
          <TabsContent value="expenses" className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Expenses by Payment Source</CardTitle>
                  <CardDescription>Where the money came from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBySource}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {expenseBySource.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Expense Details</CardTitle>
                  <CardDescription>Top expenses by amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {filteredExpenses
                      .slice()
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 6)
                      .map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{e.description}</span>
                            <span className="text-xs text-muted-foreground">{e.assemblyName} - {e.event}</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums">{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                    {filteredExpenses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No expenses for the selected period.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════ Attendance Tab ═══════ */}
          <TabsContent value="attendance" className="flex flex-col gap-6">
            {/* Attendance Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Attendance</span>
                  <p className="mt-1 text-xl font-bold">{grandTotalAttendance.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adults</span>
                  <p className="mt-1 text-xl font-bold text-primary">{grandTotalAdults.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Children</span>
                  <p className="mt-1 text-xl font-bold text-amber-600">{grandTotalChildren.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Services Recorded</span>
                  <p className="mt-1 text-xl font-bold text-muted-foreground">{grandTotalServices}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Attendance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Attendance Trend</CardTitle>
                  <CardDescription>
                    {period === "all" ? "Monthly attendance over time" : "Weekly attendance breakdown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {attendanceTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="adults" stroke="hsl(213, 94%, 40%)" strokeWidth={2} name="Adults" />
                          <Line type="monotone" dataKey="children" stroke="hsl(32, 95%, 50%)" strokeWidth={2} name="Children" />
                          <Line type="monotone" dataKey="total" stroke="hsl(160, 64%, 43%)" strokeWidth={2} name="Total" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-20">No attendance data for the selected period.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Attendance by Assembly */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Attendance by Assembly</CardTitle>
                  <CardDescription>Adults vs Children per assembly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {attendanceByAssembly.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceByAssembly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="adults" stackId="a" fill="hsl(213, 94%, 40%)" name="Adults" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="children" stackId="a" fill="hsl(32, 95%, 50%)" name="Children" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-20">No attendance data for the selected period.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Attendance Details by Assembly</CardTitle>
                <CardDescription>Breakdown of adults, children, and average per service</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Assembly</TableHead>
                      <TableHead className="text-right">Services</TableHead>
                      <TableHead className="text-right">Adults</TableHead>
                      <TableHead className="text-right">Children</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Avg / Service</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assemblySummary
                      .filter((a) => assemblyFilter === "all" || a.id === assemblyFilter)
                      .map((a) => (
                        <TableRow key={a.name}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.services}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.adults}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.children}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{a.totalAttendance}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {a.services > 0 ? Math.round(a.totalAttendance / a.services) : 0}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                  {assemblyFilter === "all" && (
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-bold">Grand Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalServices}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalAdults}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalChildren}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalAttendance}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-muted-foreground">
                          {grandTotalServices > 0 ? Math.round(grandTotalAttendance / grandTotalServices) : 0}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ New Souls Tab ═══════ */}
          <TabsContent value="newsouls" className="flex flex-col gap-6">
            {/* New Souls Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total New Souls</span>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{grandTotalNewSouls.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg / Service</span>
                  <p className="mt-1 text-xl font-bold">
                    {grandTotalServices > 0 ? (grandTotalNewSouls / grandTotalServices).toFixed(1) : 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Assembly</span>
                  <p className="mt-1 text-lg font-bold text-primary truncate">
                    {newSoulsByAssembly.length > 0 ? newSoulsByAssembly[0].name : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assemblies Active</span>
                  <p className="mt-1 text-xl font-bold text-muted-foreground">{newSoulsByAssembly.length}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* New Souls Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">New Souls Trend</CardTitle>
                  <CardDescription>
                    {period === "all" ? "Monthly new souls over time" : "Weekly new souls breakdown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {newSoulsTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={newSoulsTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="souls" fill="hsl(160, 64%, 43%)" name="New Souls" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-20">No new souls data for the selected period.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* New Souls by Assembly */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">New Souls by Assembly</CardTitle>
                  <CardDescription>Which assemblies are winning souls</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {newSoulsByAssembly.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={newSoulsByAssembly} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
                          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="newSouls" fill="hsl(160, 64%, 43%)" name="New Souls" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-20">No new souls data for the selected period.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* New Souls Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">New Souls Details by Assembly</CardTitle>
                <CardDescription>Breakdown of new souls won per assembly</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Assembly</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead className="text-right">Services</TableHead>
                      <TableHead className="text-right">New Souls</TableHead>
                      <TableHead className="text-right">Avg / Service</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assemblySummary
                      .filter((a) => assemblyFilter === "all" || a.id === assemblyFilter)
                      .map((a) => (
                        <TableRow key={a.name}>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-muted-foreground">{a.leader}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.services}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-emerald-600">{a.newSouls}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {a.services > 0 ? (a.newSouls / a.services).toFixed(1) : 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {grandTotalNewSouls > 0 ? ((a.newSouls / grandTotalNewSouls) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                  {assemblyFilter === "all" && (
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="font-bold">Grand Total</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">{grandTotalServices}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold text-emerald-600">{grandTotalNewSouls}</TableCell>
                        <TableCell className="text-right tabular-nums font-bold">
                          {grandTotalServices > 0 ? (grandTotalNewSouls / grandTotalServices).toFixed(1) : 0}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold">100%</TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
