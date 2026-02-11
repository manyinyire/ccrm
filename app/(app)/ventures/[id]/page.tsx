"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Package, DollarSign, TrendingUp, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { formatCurrency, convertToUSD } from "@/lib/mock-data"
import type { Assembly } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"

type VentureProduct = { id: string; name: string; currency: string; unitPrice: number; stock: number }
type VentureExpense = { id: string; date: string; currency: string; amount: number; description: string }
type VentureAllocation = { id: string; assemblyId: string; assembly: { name: string }; productId?: string; product?: { name: string } | null; date: string; currency: string; quantity: number; unitPrice: number; totalAmount: number; description: string }
type VenturePayment = { id: string; assemblyId: string; assembly: { name: string }; date: string; currency: string; amount: number; paymentMethod: string; description: string }
type Venture = {
  id: string; name: string; description: string; status: string; createdAt: string
  products: VentureProduct[]; expenses: VentureExpense[]; allocations: VentureAllocation[]; payments: VenturePayment[]
}

export default function VentureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currency } = useCurrency()
  const ventureId = params.id as string

  const [venture, setVenture] = useState<Venture | null>(null)
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [productDialog, setProductDialog] = useState(false)
  const [expenseDialog, setExpenseDialog] = useState(false)
  const [allocationDialog, setAllocationDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)

  const fetchData = useCallback(async () => {
    const [vRes, asmRes] = await Promise.all([
      fetch(`/api/ventures/${ventureId}`),
      fetch("/api/assemblies"),
    ])
    if (vRes.ok) setVenture(await vRes.json())
    setAssemblies(await asmRes.json())
  }, [ventureId])

  useEffect(() => { fetchData() }, [fetchData])

  if (!venture) return <div className="p-6 text-muted-foreground">Loading...</div>

  const totalCapital = venture.expenses.reduce((s, e) => s + convertToUSD(e.amount, e.currency), 0)
  const totalAllocated = venture.allocations.reduce((s, a) => s + convertToUSD(a.totalAmount, a.currency), 0)
  const totalRevenue = venture.payments.reduce((s, p) => s + convertToUSD(p.amount, p.currency), 0)
  const profit = totalRevenue - totalCapital
  const outstanding = totalAllocated - totalRevenue

  // Assembly breakdown for allocations vs payments
  const assemblyMap = new Map<string, { name: string; allocated: number; paid: number }>()
  venture.allocations.forEach((a) => {
    const entry = assemblyMap.get(a.assemblyId) || { name: a.assembly.name, allocated: 0, paid: 0 }
    entry.allocated += convertToUSD(a.totalAmount, a.currency)
    assemblyMap.set(a.assemblyId, entry)
  })
  venture.payments.forEach((p) => {
    const entry = assemblyMap.get(p.assemblyId) || { name: p.assembly.name, allocated: 0, paid: 0 }
    entry.paid += convertToUSD(p.amount, p.currency)
    assemblyMap.set(p.assemblyId, entry)
  })
  const assemblyBreakdown = Array.from(assemblyMap.entries()).map(([id, data]) => ({
    id, ...data, owing: data.allocated - data.paid,
  }))

  const activeAssemblies = assemblies.filter((a) => a.status === "ACTIVE")

  return (
    <>
      <PageHeader
        title={venture.name}
        description={venture.description || "Venture details"}
        breadcrumb="Ventures"
      >
        <Button variant="outline" onClick={() => router.push("/ventures")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Select value={venture.status} onValueChange={async (v) => {
          await fetch(`/api/ventures/${ventureId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...venture, status: v }),
          })
          fetchData()
        }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capital</span>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalCapital, "USD")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Allocated</span>
              <p className="text-xl font-bold mt-1 text-blue-600">{formatCurrency(totalAllocated, "USD")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</span>
              <p className="text-xl font-bold mt-1 text-primary">{formatCurrency(totalRevenue, "USD")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit/Loss</span>
              <p className={`text-xl font-bold mt-1 ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {profit >= 0 ? "+" : ""}{formatCurrency(profit, "USD")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</span>
              <p className={`text-xl font-bold mt-1 ${outstanding > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                {outstanding > 0 ? formatCurrency(outstanding, "USD") : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assembly Breakdown */}
        {assemblyBreakdown.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Assembly Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assemblyBreakdown.map((asm) => (
                  <div key={asm.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{asm.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Allocated: {formatCurrency(asm.allocated, "USD")} · Paid: {formatCurrency(asm.paid, "USD")}
                      </p>
                    </div>
                    <Badge variant={asm.owing > 0 ? "destructive" : "secondary"} className="ml-2 tabular-nums">
                      {asm.owing > 0 ? `Owes ${formatCurrency(asm.owing, "USD")}` : "Settled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Products, Expenses, Allocations, Payments */}
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products ({venture.products.length})</TabsTrigger>
            <TabsTrigger value="expenses">Capital / Expenses ({venture.expenses.length})</TabsTrigger>
            <TabsTrigger value="allocations">Allocations ({venture.allocations.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({venture.payments.length})</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Products</CardTitle>
                <Dialog open={productDialog} onOpenChange={setProductDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Product</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Product</DialogTitle>
                      <DialogDescription>Define a product for this venture with price and initial stock.</DialogDescription>
                    </DialogHeader>
                    <ProductForm ventureId={ventureId} onClose={() => { setProductDialog(false); fetchData() }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Product</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venture.products.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No products defined yet.</TableCell></TableRow>
                    )}
                    {venture.products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{p.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.unitPrice, p.currency as any)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{p.stock}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(p.stock * p.unitPrice, p.currency as any)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            await fetch(`/api/ventures/${ventureId}/products?productId=${p.id}`, { method: "DELETE" })
                            fetchData()
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
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
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Capital & Expenses</CardTitle>
                <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Expense</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Venture Expense</DialogTitle>
                      <DialogDescription>Record capital or processing costs for this venture.</DialogDescription>
                    </DialogHeader>
                    <ExpenseForm ventureId={ventureId} onClose={() => { setExpenseDialog(false); fetchData() }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venture.expenses.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No expenses recorded.</TableCell></TableRow>
                    )}
                    {venture.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{e.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(e.amount, e.currency as any)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            await fetch(`/api/ventures/${ventureId}/expenses?expenseId=${e.id}`, { method: "DELETE" })
                            fetchData()
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Allocations to Assemblies</CardTitle>
                <Dialog open={allocationDialog} onOpenChange={setAllocationDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 h-4 w-4" />Allocate</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Allocate Products</DialogTitle>
                      <DialogDescription>Send products to an assembly to sell. This creates an amount they owe.</DialogDescription>
                    </DialogHeader>
                    <AllocationForm ventureId={ventureId} assemblies={activeAssemblies} products={venture.products} onClose={() => { setAllocationDialog(false); fetchData() }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Assembly</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venture.allocations.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No allocations yet.</TableCell></TableRow>
                    )}
                    {venture.allocations.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{a.assembly.name}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{a.quantity}{a.product ? ` × ${a.product.name}` : ""}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(a.unitPrice, a.currency as any)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{a.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(a.totalAmount, a.currency as any)}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{a.description || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            await fetch(`/api/ventures/${ventureId}/allocations?allocationId=${a.id}`, { method: "DELETE" })
                            fetchData()
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Payments Received</CardTitle>
                <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-1 h-4 w-4" />Record Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                      <DialogDescription>Record money received from an assembly for this venture.</DialogDescription>
                    </DialogHeader>
                    <PaymentForm ventureId={ventureId} assemblies={activeAssemblies} onClose={() => { setPaymentDialog(false); fetchData() }} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Assembly</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Cur.</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venture.payments.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No payments received yet.</TableCell></TableRow>
                    )}
                    {venture.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{p.assembly.name}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{p.paymentMethod === "ECOCASH" ? "EcoCash" : "Cash"}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{p.currency}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(p.amount, p.currency as any)}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{p.description || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            await fetch(`/api/ventures/${ventureId}/payments?paymentId=${p.id}`, { method: "DELETE" })
                            fetchData()
                          }}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
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

/* ─── Form Components ─── */

function ExpenseForm({ ventureId, onClose }: { ventureId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], currency: "USD", amount: 0, description: "" })
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.amount || !form.description) return
    setLoading(true)
    await fetch(`/api/ventures/${ventureId}/expenses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Amount</Label>
        <Input type="number" placeholder="0" onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Input placeholder="e.g. Purchase of raw materials" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.amount || !form.description}>{loading ? "Saving..." : "Add Expense"}</Button>
      </DialogFooter>
    </div>
  )
}

function AllocationForm({ ventureId, assemblies, products, onClose }: { ventureId: string; assemblies: Assembly[]; products: VentureProduct[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    assemblyId: assemblies[0]?.id || "",
    productId: "",
    currency: "USD",
    quantity: 0,
    unitPrice: 0,
    description: "",
  })
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const selectedProduct = products.find((p) => p.id === form.productId)

  const handleProductChange = (productId: string) => {
    if (productId === "_none") {
      setForm((f) => ({ ...f, productId: "", unitPrice: 0, currency: "USD" }))
    } else {
      const prod = products.find((p) => p.id === productId)
      if (prod) {
        setForm((f) => ({ ...f, productId, unitPrice: prod.unitPrice, currency: prod.currency }))
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.assemblyId || !form.quantity || !form.unitPrice) return
    setError("")
    setLoading(true)
    const res = await fetch(`/api/ventures/${ventureId}/allocations`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to allocate")
      setLoading(false)
      return
    }
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Assembly</Label>
          <Select value={form.assemblyId} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {assemblies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {products.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Product</Label>
          <Select value={form.productId || "_none"} onValueChange={handleProductChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Manual entry —</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({formatCurrency(p.unitPrice, p.currency as any)}) — {p.stock} in stock</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Quantity{selectedProduct ? ` (${selectedProduct.stock} available)` : ""}</Label>
          <Input type="number" placeholder="0" value={form.quantity || ""} onChange={(e) => set("quantity", parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Unit Price</Label>
          <Input type="number" placeholder="0.00" value={form.unitPrice || ""} onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)} disabled={!!form.productId} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)} disabled={!!form.productId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Total: <strong>{formatCurrency(form.quantity * form.unitPrice, form.currency as any)}</strong>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2">
        <Label>Description (optional)</Label>
        <Input placeholder="e.g. 50 chickens for sale" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.assemblyId || !form.quantity || !form.unitPrice}>{loading ? "Saving..." : "Allocate"}</Button>
      </DialogFooter>
    </div>
  )
}

function ProductForm({ ventureId, onClose }: { ventureId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", currency: "USD", unitPrice: 0, stock: 0 })
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.unitPrice) return
    setLoading(true)
    await fetch(`/api/ventures/${ventureId}/products`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Label>Product Name</Label>
        <Input placeholder="e.g. Broiler Chicken" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Unit Price</Label>
          <Input type="number" placeholder="0.00" onChange={(e) => set("unitPrice", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Initial Stock</Label>
          <Input type="number" placeholder="0" onChange={(e) => set("stock", parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name.trim() || !form.unitPrice}>{loading ? "Saving..." : "Add Product"}</Button>
      </DialogFooter>
    </div>
  )
}

function PaymentForm({ ventureId, assemblies, onClose }: { ventureId: string; assemblies: Assembly[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    assemblyId: assemblies[0]?.id || "",
    currency: "USD",
    amount: 0,
    paymentMethod: "CASH",
    description: "",
  })
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.assemblyId || !form.amount) return
    setLoading(true)
    await fetch(`/api/ventures/${ventureId}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Assembly</Label>
          <Select value={form.assemblyId} onValueChange={(v) => set("assemblyId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {assemblies.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Amount</Label>
          <Input type="number" placeholder="0" onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ZWL">ZWL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Payment Method</Label>
          <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="ECOCASH">EcoCash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Description (optional)</Label>
        <Input placeholder="e.g. Payment for chickens sold" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.assemblyId || !form.amount}>{loading ? "Saving..." : "Record Payment"}</Button>
      </DialogFooter>
    </div>
  )
}
