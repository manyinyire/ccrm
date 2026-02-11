"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/mock-data"
import type { IncomeRecord, Expense } from "@/lib/mock-data"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

type ActivityItem = {
  id: string
  type: "income" | "expense"
  assembly: string
  amount: number
  date: string
  label: string
}

function buildActivity(incomeRecords: IncomeRecord[], expenses: Expense[]): ActivityItem[] {
  const items: ActivityItem[] = []
  for (const r of incomeRecords.slice(0, 4)) {
    items.push({
      id: r.id,
      type: "income",
      assembly: r.assemblyName,
      amount: r.totalAmount,
      date: r.date,
      label: "Income recorded",
    })
  }
  for (const e of expenses.slice(0, 4)) {
    items.push({
      id: e.id,
      type: "expense",
      assembly: e.assemblyName,
      amount: e.amount,
      date: e.date,
      label: e.description,
    })
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
}

export function RecentActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    Promise.all([fetch("/api/income"), fetch("/api/expenses")]).then(async ([incRes, expRes]) => {
      const incomes = await incRes.json()
      const expenses = await expRes.json()
      setActivity(buildActivity(incomes, expenses))
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <CardDescription>Latest transactions across assemblies</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="flex flex-col gap-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  item.type === "income"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {item.type === "income" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.assembly}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    item.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
