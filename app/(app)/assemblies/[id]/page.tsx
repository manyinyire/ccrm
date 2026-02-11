"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Users, DollarSign, Receipt, HandCoins, Package, Store, Download, FileText } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

type AssemblyDetail = {
  id: string; name: string; location: string; leader: string; status: string
  users: Array<{ id: string; name: string; email: string; role: string; status: string }>
  incomes: Array<{ id: string; date: string; currency: string; totalAmount: number; offering: number; tithe: number; adults: number; children: number; newSouls: number; customItems: any }>
  expenses: Array<{ id: string; date: string; currency: string; amount: number; event: string; description: string; category: string; status: string; paymentSource: string; owedPerson?: { name: string } | null }>
  assets: Array<{ id: string; name: string; category: string; currency: string; purchasePrice: number; currentValue: number; condition: string; location: string }>
  receivables: Array<{ id: string; date: string; currency: string; amount: number; paymentMethod: string; sentToPastor: boolean; description: string }>
  ventureAllocations: Array<{ id: string; date: string; currency: string; quantity: number; unitPrice: number; totalAmount: number; description: string; venture: { name: string }; product?: { name: string } | null }>
  venturePayments: Array<{ id: string; date: string; currency: string; amount: number; paymentMethod: string; description: string; venture: { name: string } }>
}

export default function AssemblyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currency } = useCurrency()
  const assemblyId = params.id as string

  const [assembly, setAssembly] = useState<AssemblyDetail | null>(null)

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/assemblies/${assemblyId}`)
    if (res.ok) setAssembly(await res.json())
  }, [assemblyId])

  useEffect(() => { fetchData() }, [fetchData])

  if (!assembly) return <div className="p-6 text-muted-foreground">Loading...</div>

  const totalIncome = assembly.incomes.reduce((s, i) => s + convertToUSD(i.totalAmount, i.currency), 0)
  const totalExpenses = assembly.expenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)
  const totalReceived = assembly.receivables.reduce((s, r) => s + convertToUSD(r.amount, r.currency), 0)
  const totalAttendance = assembly.incomes.reduce((s, i) => s + i.adults + i.children, 0)
  const totalNewSouls = assembly.incomes.reduce((s, i) => s + i.newSouls, 0)
  const assetValue = assembly.assets.reduce((s, a) => s + convertToUSD(a.currentValue, a.currency), 0)
  const ventureAllocated = assembly.ventureAllocations.reduce((s, a) => s + convertToUSD(a.totalAmount, a.currency), 0)
  const venturePaid = assembly.venturePayments.reduce((s, p) => s + convertToUSD(p.amount, p.currency), 0)
  const ventureOwing = ventureAllocated - venturePaid
  const outstandingBalance = totalIncome - totalReceived

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  return (
    <>
      <PageHeader
        title={assembly.name}
        description={`${assembly.location} · Leader: ${assembly.leader}`}
        breadcrumb="Assemblies"
      >
        <Button variant="outline" onClick={() => router.push("/assemblies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF(`${assembly.name} — 360° Report`, "assembly-360")}>
          <FileText className="mr-2 h-4 w-4" />PDF
        </Button>
        <Badge variant={assembly.status === "ACTIVE" ? "default" : "secondary"} className="text-sm px-3 py-1">{assembly.status}</Badge>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="assembly-360">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <SummaryCard label="Total Income" value={formatCurrency(totalIncome, "USD")} className="text-primary" />
          <SummaryCard label="Total Expenses" value={formatCurrency(totalExpenses, "USD")} />
          <SummaryCard label="Received" value={formatCurrency(totalReceived, "USD")} className="text-green-600" />
          <SummaryCard label="Outstanding" value={outstandingBalance > 0 ? formatCurrency(outstandingBalance, "USD") : "—"} className={outstandingBalance > 0 ? "text-orange-600" : ""} />
          <SummaryCard label="Attendance" value={totalAttendance.toString()} />
          <SummaryCard label="New Souls" value={totalNewSouls.toString()} className="text-primary" />
          <SummaryCard label="Asset Value" value={formatCurrency(assetValue, "USD")} />
          <SummaryCard label="Venture Owing" value={ventureOwing > 0 ? formatCurrency(ventureOwing, "USD") : "—"} className={ventureOwing > 0 ? "text-orange-600" : ""} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="income">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="income">Income ({assembly.incomes.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({assembly.expenses.length})</TabsTrigger>
            <TabsTrigger value="receivables">Receivables ({assembly.receivables.length})</TabsTrigger>
            <TabsTrigger value="ventures">Ventures ({assembly.ventureAllocations.length + assembly.venturePayments.length})</TabsTrigger>
            <TabsTrigger value="assets">Assets ({assembly.assets.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({assembly.users.length})</TabsTrigger>
          </TabsList>

          {/* Income Tab */}
          <TabsContent value="income" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Offering</TableHead>
                      <TableHead className="text-right">Tithe</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Adults</TableHead>
                      <TableHead className="text-right">Children</TableHead>
                      <TableHead className="text-right">New Souls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assembly.incomes.length === 0 && <EmptyRow cols={8} />}
                    {assembly.incomes.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{fmtDate(i.date)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{i.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(i.offering, i.currency as any)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(i.tithe, i.currency as any)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(i.totalAmount, i.currency as any)}</TableCell>
                        <TableCell className="text-right tabular-nums">{i.adults}</TableCell>
                        <TableCell className="text-right tabular-nums">{i.children}</TableCell>
                        <TableCell className="text-right tabular-nums">{i.newSouls}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assembly.expenses.length === 0 && <EmptyRow cols={8} />}
                    {assembly.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{fmtDate(e.date)}</TableCell>
                        <TableCell>{e.event}</TableCell>
                        <TableCell className="truncate max-w-[150px]">{e.description}</TableCell>
                        <TableCell>{e.category || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{e.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(e.amount, e.currency as any)}</TableCell>
                        <TableCell className="text-xs">{e.paymentSource.replace(/_/g, " ")}</TableCell>
                        <TableCell><Badge variant={e.status === "PAID" ? "secondary" : "destructive"} className="text-[10px]">{e.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receivables Tab */}
          <TabsContent value="receivables" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Sent to Pastor</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assembly.receivables.length === 0 && <EmptyRow cols={6} />}
                    {assembly.receivables.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{fmtDate(r.date)}</TableCell>
                        <TableCell><Badge variant="outline">{r.paymentMethod === "ECOCASH" ? "EcoCash" : "Cash"}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{r.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(r.amount, r.currency as any)}</TableCell>
                        <TableCell>{r.sentToPastor ? <Badge className="bg-green-600 text-white">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[150px]">{r.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ventures Tab */}
          <TabsContent value="ventures" className="mt-4">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Allocations Received</CardTitle>
                    <Badge variant="outline">Allocated: {formatCurrency(ventureAllocated, "USD")} · Paid: {formatCurrency(venturePaid, "USD")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Venture</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Cur.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assembly.ventureAllocations.length === 0 && <EmptyRow cols={6} msg="No allocations." />}
                      {assembly.ventureAllocations.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{fmtDate(a.date)}</TableCell>
                          <TableCell><Badge variant="secondary">{a.venture.name}</Badge></TableCell>
                          <TableCell>{a.product?.name || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.quantity}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{a.currency}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(a.totalAmount, a.currency as any)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Payments Made</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Venture</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Cur.</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assembly.venturePayments.length === 0 && <EmptyRow cols={6} msg="No payments." />}
                      {assembly.venturePayments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{fmtDate(p.date)}</TableCell>
                          <TableCell><Badge variant="secondary">{p.venture.name}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{p.paymentMethod === "ECOCASH" ? "EcoCash" : "Cash"}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{p.currency}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(p.amount, p.currency as any)}</TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[120px]">{p.description || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assembly.assets.length === 0 && <EmptyRow cols={7} msg="No assets." />}
                    {assembly.assets.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                        <TableCell><Badge variant={a.condition === "EXCELLENT" || a.condition === "GOOD" ? "secondary" : "destructive"} className="text-[10px]">{a.condition}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{a.location}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{a.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(a.purchasePrice, a.currency as any)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(a.currentValue, a.currency as any)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assembly.users.length === 0 && <EmptyRow cols={4} msg="No users assigned." />}
                    {assembly.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell><Badge variant="outline">{u.role.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell><Badge variant={u.status === "active" ? "secondary" : "destructive"}>{u.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function SummaryCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <p className={`text-lg font-bold mt-0.5 ${className}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyRow({ cols, msg = "No records." }: { cols: number; msg?: string }) {
  return <TableRow><TableCell colSpan={cols} className="text-center text-muted-foreground py-6">{msg}</TableCell></TableRow>
}
