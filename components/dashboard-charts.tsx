"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { convertToUSD } from "@/lib/mock-data"
import type { IncomeRecord, Expense, Assembly } from "@/lib/mock-data"

const currencyFormatter = (value: number) =>
  `$${(value / 1000).toFixed(0)}k`

function groupByMonth(incomes: IncomeRecord[], expenses: Expense[]) {
  const months: Record<string, { income: number; expenses: number }> = {}
  for (const r of incomes) {
    const m = new Date(r.date).toLocaleString("en-US", { month: "short" })
    if (!months[m]) months[m] = { income: 0, expenses: 0 }
    months[m].income += convertToUSD(r.totalAmount, r.currency)
  }
  for (const e of expenses) {
    const m = new Date(e.date).toLocaleString("en-US", { month: "short" })
    if (!months[m]) months[m] = { income: 0, expenses: 0 }
    months[m].expenses += convertToUSD(e.amount, e.currency)
  }
  return Object.entries(months).map(([month, data]) => ({ month, ...data }))
}

function groupAttendance(incomes: IncomeRecord[]) {
  const months: Record<string, { adults: number; children: number; newSouls: number }> = {}
  for (const r of incomes) {
    const m = new Date(r.date).toLocaleString("en-US", { month: "short" })
    if (!months[m]) months[m] = { adults: 0, children: 0, newSouls: 0 }
    months[m].adults += r.adults
    months[m].children += r.children
    months[m].newSouls += r.newSouls
  }
  return Object.entries(months).map(([month, data]) => ({ month, ...data }))
}

function groupByAssembly(incomes: IncomeRecord[], expenses: Expense[], assemblies: Assembly[]) {
  return assemblies
    .filter((a) => a.status === "ACTIVE")
    .map((a) => ({
      name: a.name.replace(" Assembly", ""),
      income: incomes.filter((r) => r.assemblyId === a.id).reduce((s, r) => s + convertToUSD(r.totalAmount, r.currency), 0),
      expenses: expenses.filter((e) => e.assemblyId === a.id).reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0),
    }))
}

export function IncomeExpenseChart() {
  const [data, setData] = useState<{ month: string; income: number; expenses: number }[]>([])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses")]).then(async ([incRes, expRes]) => {
      const incomes = await incRes.json()
      const expenses = await expRes.json()
      setData(groupByMonth(incomes, expenses))
    })
  }, [])

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
        <CardDescription>Monthly financial overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(213, 94%, 40%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(213, 94%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 16%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="income" stroke="hsl(213, 94%, 40%)" strokeWidth={2} fill="url(#incomeGradient)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 51%)" strokeWidth={2} fill="url(#expenseGradient)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function AttendanceChart() {
  const [data, setData] = useState<{ month: string; adults: number; children: number; newSouls: number }[]>([])

  useEffect(() => {
    fetch("/api/income").then(async (res) => {
      const incomes = await res.json()
      setData(groupAttendance(incomes))
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Attendance Trends</CardTitle>
        <CardDescription>Weekly attendance across all assemblies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(214, 16%, 90%)", borderRadius: "8px", fontSize: "12px" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="adults" stroke="hsl(213, 94%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Adults" />
              <Line type="monotone" dataKey="children" stroke="hsl(160, 64%, 43%)" strokeWidth={2} dot={{ r: 3 }} name="Children" />
              <Line type="monotone" dataKey="newSouls" stroke="hsl(32, 95%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="New Souls" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function AssemblyComparisonChart() {
  const [data, setData] = useState<{ name: string; income: number; expenses: number }[]>([])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses"), fetch("/api/assemblies")]).then(async ([incRes, expRes, asmRes]) => {
      const incomes = await incRes.json()
      const expenses = await expRes.json()
      const assemblies = await asmRes.json()
      setData(groupByAssembly(incomes, expenses, assemblies))
    })
  }, [])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Assembly Comparison</CardTitle>
        <CardDescription>Income and expenses by assembly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(214, 16%, 90%)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="income" fill="hsl(213, 94%, 40%)" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="hsl(32, 95%, 50%)" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
