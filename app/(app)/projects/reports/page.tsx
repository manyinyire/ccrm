"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { Download, FileText, ArrowLeft, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"
import { useRouter, useSearchParams } from "next/navigation"

type IncomeRecord = { id: string; assemblyName?: string; assembly?: { name: string }; date: string; currency: string; totalAmount: number; customItems?: Record<string, number> }
type ExpenseRecord = { id: string; assemblyName?: string; assembly?: { name: string }; date: string; currency: string; amount: number; description: string; event: string; category: string; status: string }
type Project = {
  id: string; name: string; description: string; budget: number; status: string; createdAt: string
  incomes: IncomeRecord[]; expenses: ExpenseRecord[]
}

export default function ProjectReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ProjectReportsContent />
    </Suspense>
  )
}

function ProjectReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get("id")
  const { currency } = useCurrency()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [singleProjectId, setSingleProjectId] = useState<string>(preselectedId || "")

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/projects")
    const list = await res.json()
    // Fetch full details for each project
    const detailed = await Promise.all(
      list.map(async (p: Project) => {
        const r = await fetch(`/api/projects/${p.id}`)
        return r.json()
      })
    )
    setProjects(detailed)
    if (preselectedId) {
      setSingleProjectId(preselectedId)
      setSelectedIds(new Set([preselectedId]))
    }
  }, [preselectedId])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleProject = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === projects.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(projects.map((p) => p.id)))
  }

  const selectedProjects = projects.filter((p) => selectedIds.has(p.id))
  const singleProject = projects.find((p) => p.id === singleProjectId)

  return (
    <>
      <PageHeader
        title="Project Reports"
        description="Generate detailed reports for individual or multiple projects"
        breadcrumb="Projects / Reports"
      >
        <Button variant="outline" onClick={() => router.push("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        <Tabs defaultValue={preselectedId ? "single" : "multi"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Project Report</TabsTrigger>
            <TabsTrigger value="multi">Multi-Project Report</TabsTrigger>
          </TabsList>

          {/* Single Project Report */}
          <TabsContent value="single" className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label>Select Project</Label>
                  <Select value={singleProjectId} onValueChange={setSingleProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {singleProject && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSingleCSV(singleProject)}>
                      <Download className="mr-2 h-4 w-4" />CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPDF(`${singleProject.name} — Project Report`, "single-report")}>
                      <FileText className="mr-2 h-4 w-4" />PDF
                    </Button>
                  </div>
                )}
              </div>

              {singleProject && (
                <div id="single-report">
                  <SingleProjectReport project={singleProject} />
                </div>
              )}

              {!singleProject && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Select a project above to view its report.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Multi-Project Report */}
          <TabsContent value="multi" className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Project Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Select Projects</CardTitle>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      {selectedIds.size === projects.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-md border p-2">
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleProject(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(p.budget, "USD")} · {p.status}
                          </p>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full">No projects found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedProjects.length > 0 && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleMultiCSV(selectedProjects)}>
                    <Download className="mr-2 h-4 w-4" />Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF("Multi-Project Report", "multi-report")}>
                    <FileText className="mr-2 h-4 w-4" />Export PDF
                  </Button>
                </div>
              )}

              {selectedProjects.length > 0 && (
                <div id="multi-report">
                  <MultiProjectReport projects={selectedProjects} />
                </div>
              )}

              {selectedProjects.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Select one or more projects above to generate a report.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

/* ─── Single Project Report ─── */

function SingleProjectReport({ project }: { project: Project }) {
  const incomes = project.incomes || []
  const expenses = project.expenses || []

  const totalIncome = incomes.reduce((sum, i) => sum + convertToUSD(i.totalAmount, i.currency), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)
  const netPosition = totalIncome - totalExpenses
  const remaining = project.budget - totalExpenses
  const budgetUsedPct = project.budget > 0 ? Math.round((totalExpenses / project.budget) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{project.name}</h3>
          {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
        </div>
        <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>{project.status}</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget</span>
            <p className="text-xl font-bold mt-1">{formatCurrency(project.budget, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Income</span>
            <p className="text-xl font-bold text-primary mt-1">{formatCurrency(totalIncome, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <p className="text-xl font-bold mt-1">{formatCurrency(totalExpenses, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Remaining</span>
            <p className={`text-xl font-bold mt-1 ${remaining < 0 ? "text-destructive" : "text-green-600"}`}>
              {formatCurrency(remaining, "USD")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Budget Used</span>
          <span className="font-medium">{budgetUsedPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetUsedPct > 100 ? "bg-destructive" : budgetUsedPct > 75 ? "bg-orange-500" : "bg-primary"}`}
            style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Net Position */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Net Position (Income − Expenses)</span>
          <span className={`text-lg font-bold ${netPosition >= 0 ? "text-green-600" : "text-destructive"}`}>
            {netPosition >= 0 ? "+" : ""}{formatCurrency(netPosition, "USD")}
          </span>
        </CardContent>
      </Card>

      {/* Income Records */}
      {incomes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income Records ({incomes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Cur.</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((inc: any) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-medium">{new Date(inc.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                    <TableCell>{inc.assembly?.name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{inc.currency}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(inc.totalAmount, inc.currency)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell colSpan={3} className="text-right">Total (USD equiv.)</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(totalIncome, "USD")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Expense Records */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Records ({expenses.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cur.</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp: any) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{new Date(exp.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                    <TableCell>{exp.assembly?.name || "—"}</TableCell>
                    <TableCell className="truncate max-w-[150px]">{exp.description}</TableCell>
                    <TableCell>{exp.category || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{exp.currency}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(exp.amount, exp.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={exp.status === "PAID" ? "secondary" : "destructive"} className="text-[10px]">{exp.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell colSpan={5} className="text-right">Total (USD equiv.)</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(totalExpenses, "USD")}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {incomes.length === 0 && expenses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No income or expense records linked to this project yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ─── Multi-Project Report ─── */

function MultiProjectReport({ projects }: { projects: Project[] }) {
  const rows = projects.map((p) => {
    const totalIncome = (p.incomes || []).reduce((s, i) => s + convertToUSD(i.totalAmount, i.currency), 0)
    const totalExpenses = (p.expenses || []).reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)
    const net = totalIncome - totalExpenses
    const remaining = p.budget - totalExpenses
    const budgetPct = p.budget > 0 ? Math.round((totalExpenses / p.budget) * 100) : 0
    return { ...p, totalIncome, totalExpenses, net, remaining, budgetPct }
  })

  const grandBudget = rows.reduce((s, r) => s + r.budget, 0)
  const grandIncome = rows.reduce((s, r) => s + r.totalIncome, 0)
  const grandExpenses = rows.reduce((s, r) => s + r.totalExpenses, 0)
  const grandNet = grandIncome - grandExpenses
  const grandRemaining = grandBudget - grandExpenses

  return (
    <div className="flex flex-col gap-4">
      {/* Grand Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
            <p className="text-xl font-bold mt-1">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Budget</span>
            <p className="text-xl font-bold mt-1">{formatCurrency(grandBudget, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Income</span>
            <p className="text-xl font-bold text-primary mt-1">{formatCurrency(grandIncome, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <p className="text-xl font-bold mt-1">{formatCurrency(grandExpenses, "USD")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Position</span>
            <p className={`text-xl font-bold mt-1 ${grandNet >= 0 ? "text-green-600" : "text-destructive"}`}>
              {grandNet >= 0 ? "+" : ""}{formatCurrency(grandNet, "USD")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Budget Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      {r.description && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{r.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.budget, "USD")}</TableCell>
                  <TableCell className="text-right tabular-nums text-primary">{formatCurrency(r.totalIncome, "USD")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.totalExpenses, "USD")}</TableCell>
                  <TableCell className={`text-right tabular-nums font-semibold ${r.net >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {r.net >= 0 ? "+" : ""}{formatCurrency(r.net, "USD")}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums ${r.remaining < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(r.remaining, "USD")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.budgetPct > 100 ? "bg-destructive" : r.budgetPct > 75 ? "bg-orange-500" : "bg-primary"}`}
                          style={{ width: `${Math.min(r.budgetPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-8 text-right">{r.budgetPct}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-muted/30 font-bold">
                <TableCell>Totals ({rows.length} projects)</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(grandBudget, "USD")}</TableCell>
                <TableCell className="text-right tabular-nums text-primary">{formatCurrency(grandIncome, "USD")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(grandExpenses, "USD")}</TableCell>
                <TableCell className={`text-right tabular-nums ${grandNet >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {grandNet >= 0 ? "+" : ""}{formatCurrency(grandNet, "USD")}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${grandRemaining < 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(grandRemaining, "USD")}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-project detail breakdown */}
      {rows.map((r) => {
        const incomes = r.incomes || []
        const expenses = r.expenses || []
        if (incomes.length === 0 && expenses.length === 0) return null
        return (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{r.name}</CardTitle>
                <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incomes.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase">Income ({incomes.length})</div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Assembly</TableHead>
                        <TableHead>Cur.</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomes.map((inc: any) => (
                        <TableRow key={inc.id}>
                          <TableCell>{new Date(inc.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                          <TableCell>{inc.assembly?.name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{inc.currency}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(inc.totalAmount, inc.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              {expenses.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase">Expenses ({expenses.length})</div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Assembly</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Cur.</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp: any) => (
                        <TableRow key={exp.id}>
                          <TableCell>{new Date(exp.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                          <TableCell>{exp.assembly?.name || "—"}</TableCell>
                          <TableCell className="truncate max-w-[150px]">{exp.description}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{exp.currency}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(exp.amount, exp.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ─── Export Helpers ─── */

function handleSingleCSV(project: Project) {
  const incomes = project.incomes || []
  const expenses = project.expenses || []

  const rows: Record<string, unknown>[] = []

  incomes.forEach((inc: any) => {
    rows.push({
      Type: "Income",
      Date: new Date(inc.date).toLocaleDateString("en-GB"),
      Assembly: inc.assembly?.name || "",
      Description: "",
      Category: "",
      Currency: inc.currency,
      Amount: inc.totalAmount,
      Status: "",
    })
  })

  expenses.forEach((exp: any) => {
    rows.push({
      Type: "Expense",
      Date: new Date(exp.date).toLocaleDateString("en-GB"),
      Assembly: exp.assembly?.name || "",
      Description: exp.description,
      Category: exp.category || "",
      Currency: exp.currency,
      Amount: exp.amount,
      Status: exp.status,
    })
  })

  exportToCSV(rows, `project-report-${project.name.replace(/\s+/g, "-").toLowerCase()}`)
}

function handleMultiCSV(projects: Project[]) {
  const rows = projects.map((p) => {
    const totalIncome = (p.incomes || []).reduce((s, i) => s + convertToUSD(i.totalAmount, i.currency), 0)
    const totalExpenses = (p.expenses || []).reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)
    return {
      Project: p.name,
      Status: p.status,
      Budget: p.budget,
      "Total Income (USD)": Math.round(totalIncome * 100) / 100,
      "Total Expenses (USD)": Math.round(totalExpenses * 100) / 100,
      "Net (USD)": Math.round((totalIncome - totalExpenses) * 100) / 100,
      "Budget Remaining (USD)": Math.round((p.budget - totalExpenses) * 100) / 100,
      "Budget Used %": p.budget > 0 ? Math.round((totalExpenses / p.budget) * 100) : 0,
    }
  })
  exportToCSV(rows, "multi-project-report")
}
