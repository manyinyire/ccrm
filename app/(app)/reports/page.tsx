"use client"

import { useState, useEffect } from "react"
import { Download, FileText, Printer } from "lucide-react"
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
} from "recharts"

const COLORS = [
  "hsl(213, 94%, 40%)",
  "hsl(160, 64%, 43%)",
  "hsl(32, 95%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(270, 60%, 52%)",
]

export default function ReportsPage() {
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses"), fetch("/api/assemblies")]).then(
      async ([incRes, expRes, asmRes]) => {
        setIncomeRecords(await incRes.json())
        setExpenses(await expRes.json())
        setAssemblies(await asmRes.json())
      }
    )
  }, [])

  // Cash at hand computed
  const cashInUSD = incomeRecords.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.received, 0)
  const cashOutUSD = expenses.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "USD").reduce((sum, e) => sum + e.amount, 0)
  const cashBalance = cashInUSD - cashOutUSD

  // Owed balance computed
  const owedExpenses = expenses.filter((e) => e.paymentSource === "OWED_PERSON")
  const owedBalance = owedExpenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)

  // Income by category
  const incomeCategories = [
    { name: "Offering", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.offering, r.currency), 0) },
    { name: "Tithe", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.tithe, r.currency), 0) },
    { name: "Feast Badges", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.feastBadges, r.currency), 0) },
    { name: "Firewood", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.firewood, r.currency), 0) },
    { name: "Instruments", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.instruments, r.currency), 0) },
    { name: "Welfare", value: incomeRecords.reduce((s, r) => s + convertToUSD(r.pastorsWelfare, r.currency), 0) },
  ]

  // Expense by source
  const expenseBySource = [
    { name: "Cash at Hand", value: expenses.filter((e) => e.paymentSource === "CASH_AT_HAND").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
    { name: "Owed Person", value: expenses.filter((e) => e.paymentSource === "OWED_PERSON").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
    { name: "Pastor", value: expenses.filter((e) => e.paymentSource === "PASTOR").reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0) },
  ]

  // Assembly summary
  const assemblySummary = assemblies
    .filter((a) => a.status === "ACTIVE")
    .map((a) => {
      const income = incomeRecords.filter((r) => r.assemblyId === a.id)
      const exp = expenses.filter((e) => e.assemblyId === a.id)
      return {
        name: a.name,
        leader: a.leader,
        totalIncome: income.reduce((s, r) => s + convertToUSD(r.totalAmount, r.currency), 0),
        totalExpenses: exp.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0),
        totalAttendance: income.reduce((s, r) => s + r.adults + r.children, 0),
        newSouls: income.reduce((s, r) => s + r.newSouls, 0),
        balance: income.reduce((s, r) => s + convertToUSD(r.balance, r.currency), 0),
      }
    })

  const grandTotalIncome = assemblySummary.reduce((s, a) => s + a.totalIncome, 0)
  const grandTotalExpenses = assemblySummary.reduce((s, a) => s + a.totalExpenses, 0)
  const grandTotalAttendance = assemblySummary.reduce((s, a) => s + a.totalAttendance, 0)

  return (
    <>
      <PageHeader
        title="Reports"
        description="Financial reports and analytics"
        breadcrumb="Reports"
      >
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Date Range Filter */}
        <div className="flex items-center gap-3">
          <Select defaultValue="feb2026">
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feb2026">February 2026</SelectItem>
              <SelectItem value="jan2026">January 2026</SelectItem>
              <SelectItem value="dec2025">December 2025</SelectItem>
              <SelectItem value="q1-2026">Q1 2026</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="summary" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="income">Income Breakdown</TabsTrigger>
            <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="flex flex-col gap-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
            </div>

            {/* Assembly Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Assembly Summary Report</CardTitle>
                <CardDescription>Performance overview for each assembly</CardDescription>
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
                    {assemblySummary.map((a) => (
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
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">Grand Total</TableCell>
                      <TableCell className="text-right tabular-nums font-bold">{formatCurrency(grandTotalIncome)}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold">{formatCurrency(grandTotalExpenses)}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-success">
                        {formatCurrency(grandTotalIncome - grandTotalExpenses)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold">{grandTotalAttendance}</TableCell>
                      <TableCell className="text-right tabular-nums font-bold">
                        {assemblySummary.reduce((s, a) => s + a.newSouls, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-warning">
                        {formatCurrency(assemblySummary.reduce((s, a) => s + a.balance, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Breakdown Tab */}
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

          {/* Expense Analysis Tab */}
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
                    {expenses
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
