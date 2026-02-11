"use client"

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
import { monthlyIncome, attendanceTrends, assemblyComparison } from "@/lib/mock-data"

const currencyFormatter = (value: number) =>
  `${(value / 1000).toFixed(0)}k`

export function IncomeExpenseChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
        <CardDescription>Monthly financial overview for the past 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyIncome} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                formatter={(value: number) => [`NGN ${value.toLocaleString()}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 16%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="hsl(213, 94%, 40%)"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                name="Income"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="hsl(0, 72%, 51%)"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function AttendanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Attendance Trends</CardTitle>
        <CardDescription>Weekly attendance across all assemblies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrends} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 16%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
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
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Assembly Comparison</CardTitle>
        <CardDescription>Income and expenses by assembly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assemblyComparison} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 16%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                formatter={(value: number) => [`NGN ${value.toLocaleString()}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(214, 16%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
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
