"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Pencil, Trash2, CheckCircle, RotateCcw, Eye, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import { MoreHorizontal } from "lucide-react"

type Project = {
  id: string
  name: string
  description: string
  budget: number
  status: "ACTIVE" | "COMPLETED"
  createdAt: string
  updatedAt: string
  _count?: { incomes: number; expenses: number }
  incomes?: Array<{ totalAmount: number; currency: string }>
  expenses?: Array<{ amount: number; currency: string }>
}

export default function ProjectsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/projects")
    setProjects(await res.json())
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/projects/${deleteId}`, { method: "DELETE" })
    setDeleteId(null)
    fetchData()
  }

  const handleToggleStatus = async (project: Project) => {
    const newStatus = project.status === "ACTIVE" ? "COMPLETED" : "ACTIVE"
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...project, status: newStatus }),
    })
    fetchData()
  }

  const handleViewDetails = async (project: Project) => {
    const res = await fetch(`/api/projects/${project.id}`)
    setDetailProject(await res.json())
  }

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage church projects with budgets, income, and expenses"
        breadcrumb="Projects"
      >
        <Button variant="outline" onClick={() => router.push("/projects/reports")}>
          <FileText className="mr-2 h-4 w-4" />
          Reports
        </Button>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProject(null) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
              <DialogDescription>
                {editingProject ? "Update project details." : "Create a new project. Active projects appear as options in income and expense forms."}
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              onClose={() => { setDialogOpen(false); setEditingProject(null); fetchData() }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Projects</span>
                <span className="text-2xl font-bold text-primary">{activeCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed Projects</span>
                <span className="text-2xl font-bold text-success">{completedCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Budget (USD)</span>
                <span className="text-2xl font-bold">{formatCurrency(totalBudget, "USD")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Budget (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No projects found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-semibold">{project.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{project.description || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(project.budget, "USD")}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                        {project.status === "ACTIVE" ? "Active" : "Completed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {(project._count?.incomes || 0) + (project._count?.expenses || 0)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(project.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/reports?id=${project.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Report
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditingProject(project); setDialogOpen(true) }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(project)}>
                            {project.status === "ACTIVE" ? (
                              <><CheckCircle className="mr-2 h-4 w-4" /> Mark Completed</>
                            ) : (
                              <><RotateCcw className="mr-2 h-4 w-4" /> Reactivate</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(project.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the project. Income and expense records linked to it will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Report Dialog */}
      <Dialog open={!!detailProject} onOpenChange={(open) => { if (!open) setDetailProject(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailProject && <ProjectReport project={detailProject} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProjectForm({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    budget: project?.budget || 0,
    status: project?.status || "ACTIVE",
  })

  const set = (key: string, value: string | number) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    const url = project ? `/api/projects/${project.id}` : "/api/projects"
    await fetch(url, {
      method: project ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: parseFloat(String(form.budget)) || 0 }),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Project Name</Label>
        <Input id="name" placeholder="e.g. Church Building Extension" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the project goals and scope..." rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input id="budget" type="number" placeholder="0" value={form.budget || ""} onChange={(e) => set("budget", parseFloat(e.target.value) || 0)} />
        </div>
        {project && (
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
          {loading ? "Saving..." : project ? "Update Project" : "Create Project"}
        </Button>
      </DialogFooter>
    </div>
  )
}

function ProjectReport({ project }: { project: Project }) {
  const incomes = project.incomes || []
  const expenses = project.expenses || []

  const totalIncome = incomes.reduce((sum, i) => sum + convertToUSD(i.totalAmount, i.currency), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + convertToUSD(e.amount, e.currency), 0)
  const remaining = project.budget - totalExpenses
  const budgetUsedPct = project.budget > 0 ? Math.round((totalExpenses / project.budget) * 100) : 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project.name} — Report</DialogTitle>
        <DialogDescription>{project.description || "No description"}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4 mt-4">
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
            <p className={`text-xl font-bold mt-1 ${remaining < 0 ? "text-destructive" : "text-success"}`}>
              {formatCurrency(remaining, "USD")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Budget Used</span>
          <span className="font-medium">{budgetUsedPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetUsedPct > 100 ? "bg-destructive" : budgetUsedPct > 75 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Income records */}
      {incomes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Income Records ({incomes.length})</h4>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Assembly</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((inc: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{inc.assembly?.name || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(inc.totalAmount, inc.currency)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{inc.currency}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Expense records */}
      {expenses.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Expense Records ({expenses.length})</h4>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Assembly</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{exp.assembly?.name || "—"}</TableCell>
                    <TableCell className="truncate max-w-[150px]">{exp.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(exp.amount, exp.currency)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{exp.currency}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {incomes.length === 0 && expenses.length === 0 && (
        <p className="text-center text-muted-foreground mt-6 py-4">No income or expense records linked to this project yet.</p>
      )}
    </>
  )
}
