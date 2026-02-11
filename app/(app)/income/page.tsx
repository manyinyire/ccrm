"use client"

import { useState } from "react"
import { Plus, Search, Filter, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { incomeRecords, assemblies, formatCurrency } from "@/lib/mock-data"
import type { IncomeRecord } from "@/lib/mock-data"

export default function IncomePage() {
  const [search, setSearch] = useState("")
  const [assemblyFilter, setAssemblyFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = incomeRecords.filter((r) => {
    const matchesSearch =
      r.assemblyName.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search)
    const matchesAssembly = assemblyFilter === "all" || r.assemblyId === assemblyFilter
    return matchesSearch && matchesAssembly
  })

  const totalIncome = filtered.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalAttendance = filtered.reduce((sum, r) => sum + r.adults + r.children, 0)
  const totalNewSouls = filtered.reduce((sum, r) => sum + r.newSouls, 0)

  return (
    <>
      <PageHeader
        title="Income & Attendance"
        description="Track and manage weekly income from all assemblies"
        breadcrumb="Income"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Income Record</DialogTitle>
              <DialogDescription>
                Enter the weekly income and attendance data for an assembly.
              </DialogDescription>
            </DialogHeader>
            <IncomeForm onClose={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Income</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalIncome)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Attendance</span>
                <span className="text-2xl font-bold">{totalAttendance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Souls</span>
                <span className="text-2xl font-bold text-success">{totalNewSouls}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by assembly or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={assemblyFilter} onValueChange={setAssemblyFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Assemblies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assemblies</SelectItem>
              {assemblies.filter(a => a.status === "active").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Assembly</TableHead>
                  <TableHead className="text-right">Adults</TableHead>
                  <TableHead className="text-right">Children</TableHead>
                  <TableHead className="text-right">New Souls</TableHead>
                  <TableHead className="text-right">Offering</TableHead>
                  <TableHead className="text-right">Tithe</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sent to Pastor</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {record.assemblyName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{record.adults}</TableCell>
                    <TableCell className="text-right tabular-nums">{record.children}</TableCell>
                    <TableCell className="text-right">
                      {record.newSouls > 0 ? (
                        <Badge className="bg-success text-success-foreground">{record.newSouls}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.offering)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.tithe)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(record.totalAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.sentToPastor)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(record.received)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={record.balance > 0 ? "text-warning font-medium" : "text-success font-medium"}>
                        {formatCurrency(record.balance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function IncomeForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" defaultValue="2026-02-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assembly">Assembly</Label>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assemblies.filter(a => a.status === "active").map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="adults">Adults</Label>
          <Input id="adults" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="children">Children</Label>
          <Input id="children" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newSouls">New Souls</Label>
          <Input id="newSouls" type="number" placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="offering">Offering</Label>
          <Input id="offering" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tithe">Tithe</Label>
          <Input id="tithe" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="feastBadges">Feast Badges</Label>
          <Input id="feastBadges" type="number" placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firewood">Firewood</Label>
          <Input id="firewood" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instruments">Instruments</Label>
          <Input id="instruments" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pastorsWelfare">{"Pastor's Welfare"}</Label>
          <Input id="pastorsWelfare" type="number" placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sentToPastor">Sent to Pastor</Label>
          <Input id="sentToPastor" type="number" placeholder="0" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="received">Received (Cash to Freddy)</Label>
          <Input id="received" type="number" placeholder="0" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Save Record</Button>
      </DialogFooter>
    </div>
  )
}
