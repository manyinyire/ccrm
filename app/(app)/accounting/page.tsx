"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, AlertTriangle, Download, FileText, BookOpen, ArrowRightLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatCurrency } from "@/lib/mock-data"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

type TrialBalanceRow = {
  id: string
  code: string
  name: string
  type: string
  debit: number
  credit: number
  balance: number
  normalSide: string
}

type TrialBalanceData = {
  rows: TrialBalanceRow[]
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
  currency: string
}

type Account = {
  id: string
  code: string
  name: string
  type: string
  parentId: string | null
  description: string
  isSystem: boolean
  children: { id: string; code: string; name: string; type: string }[]
}

type JournalEntry = {
  id: string
  date: string
  amount: number
  currency: string
  description: string
  reference: string
  sourceType: string
  debitAccount: { code: string; name: string; type: string }
  creditAccount: { code: string; name: string; type: string }
}

const typeColors: Record<string, string> = {
  ASSET: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  LIABILITY: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  EQUITY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  REVENUE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  EXPENSE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function AccountingPage() {
  const { currency } = useCurrency()
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journal, setJournal] = useState<{ entries: JournalEntry[]; total: number; totalPages: number }>({ entries: [], total: 0, totalPages: 0 })
  const [journalPage, setJournalPage] = useState(1)
  const [sourceFilter, setSourceFilter] = useState("all")

  const fetchTrialBalance = useCallback(async () => {
    const res = await fetch(`/api/trial-balance?currency=${currency}`)
    setTrialBalance(await res.json())
  }, [currency])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts")
    setAccounts(await res.json())
  }, [])

  const fetchJournal = useCallback(async () => {
    const params = new URLSearchParams({ page: String(journalPage), limit: "30", currency })
    if (sourceFilter !== "all") params.set("sourceType", sourceFilter)
    const res = await fetch(`/api/journal?${params}`)
    setJournal(await res.json())
  }, [journalPage, currency, sourceFilter])

  useEffect(() => { fetchTrialBalance() }, [fetchTrialBalance])
  useEffect(() => { fetchAccounts() }, [fetchAccounts])
  useEffect(() => { fetchJournal() }, [fetchJournal])

  const fmt = (v: number) => formatCurrency(v, currency)

  function handleExportTrialBalance() {
    if (!trialBalance) return
    const rows = trialBalance.rows.map((r) => ({
      Code: r.code,
      Account: r.name,
      Type: r.type,
      Debit: r.debit,
      Credit: r.credit,
      Balance: r.balance,
    }))
    exportToCSV(rows, `trial-balance-${currency.toLowerCase()}`)
  }

  // Group accounts by type for chart of accounts
  const accountsByType = accounts.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = []
    acc[a.type].push(a)
    return acc
  }, {} as Record<string, Account[]>)

  return (
    <>
      <PageHeader
        title="Accounting"
        description="Double-entry ledger, trial balance, and chart of accounts"
        breadcrumb="Accounting"
      >
        <Button variant="outline" size="sm" onClick={handleExportTrialBalance}>
          <Download className="mr-2 h-4 w-4" />
          Export Trial Balance
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportToPDF("Accounting Report", "accounting-content")}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6" id="accounting-content">
        <Tabs defaultValue="trial-balance">
          <TabsList>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="journal">General Journal</TabsTrigger>
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          </TabsList>

          {/* ─── Trial Balance ─── */}
          <TabsContent value="trial-balance" className="flex flex-col gap-6">
            {trialBalance && (
              <>
                {/* Balance Status */}
                <Card className={trialBalance.isBalanced ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {trialBalance.isBalanced ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">
                        {trialBalance.isBalanced ? "Books are balanced" : "Books are NOT balanced"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Debits: {fmt(trialBalance.totalDebits)} · Total Credits: {fmt(trialBalance.totalCredits)}
                        {!trialBalance.isBalanced && ` · Difference: ${fmt(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits))}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {currency} · {trialBalance.rows.length} accounts
                    </Badge>
                  </CardContent>
                </Card>

                {/* Trial Balance Table */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Code</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialBalance.rows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No journal entries found for {currency}. Record some transactions first.
                            </TableCell>
                          </TableRow>
                        )}
                        {trialBalance.rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-sm">{row.code}</TableCell>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${typeColors[row.type] || ""}`}>
                                {row.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.debit > 0 ? fmt(row.debit) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.credit > 0 ? fmt(row.credit) : "—"}
                            </TableCell>
                            <TableCell className={`text-right tabular-nums font-semibold ${row.balance < 0 ? "text-destructive" : ""}`}>
                              {fmt(Math.abs(row.balance))} {row.balance < 0 ? "(Cr)" : "(Dr)"}
                            </TableCell>
                          </TableRow>
                        ))}
                        {trialBalance.rows.length > 0 && (
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={3}>Totals</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(trialBalance.totalDebits)}</TableCell>
                            <TableCell className="text-right tabular-nums">{fmt(trialBalance.totalCredits)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {trialBalance.isBalanced ? "✓ Balanced" : fmt(Math.abs(trialBalance.totalDebits - trialBalance.totalCredits))}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── General Journal ─── */}
          <TabsContent value="journal" className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setJournalPage(1) }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                  <SelectItem value="Receivable">Receivable</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{journal.total} entries</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit Account</TableHead>
                      <TableHead>Credit Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journal.entries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No journal entries found.
                        </TableCell>
                      </TableRow>
                    )}
                    {journal.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{entry.reference}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{entry.debitAccount.code}</span>{" "}
                          <span className="text-sm">{entry.debitAccount.name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{entry.creditAccount.code}</span>{" "}
                          <span className="text-sm">{entry.creditAccount.name}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{fmt(entry.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{entry.sourceType}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {journal.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={journalPage <= 1} onClick={() => setJournalPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {journalPage} of {journal.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={journalPage >= journal.totalPages} onClick={() => setJournalPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ─── Chart of Accounts ─── */}
          <TabsContent value="accounts" className="flex flex-col gap-6">
            {["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => {
              const typeAccounts = accountsByType[type] || []
              if (typeAccounts.length === 0) return null
              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={typeColors[type]}>{type}</Badge>
                      <CardTitle className="text-base">{type.charAt(0) + type.slice(1).toLowerCase()} Accounts</CardTitle>
                    </div>
                    <CardDescription>
                      {type === "ASSET" && "Resources owned by the church"}
                      {type === "LIABILITY" && "Obligations owed to others"}
                      {type === "EQUITY" && "Church fund balances"}
                      {type === "REVENUE" && "Income and contributions received"}
                      {type === "EXPENSE" && "Money spent on operations"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="w-[80px]">Code</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[80px]">System</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeAccounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell className="font-mono text-sm font-semibold">{acc.code}</TableCell>
                            <TableCell className={`font-medium ${acc.parentId ? "pl-8" : ""}`}>
                              {!acc.parentId && <BookOpen className="inline mr-2 h-3.5 w-3.5 text-muted-foreground" />}
                              {acc.parentId && <ArrowRightLeft className="inline mr-2 h-3 w-3 text-muted-foreground/50" />}
                              {acc.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{acc.description}</TableCell>
                            <TableCell>
                              {acc.isSystem && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
