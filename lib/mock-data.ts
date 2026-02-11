// ============================================================
// Mock Data for Church Assembly Finance CRM
// ============================================================

export type Assembly = {
  id: string
  name: string
  location: string
  leader: string
  status: "active" | "inactive"
}

export type IncomeRecord = {
  id: string
  assemblyId: string
  assemblyName: string
  date: string
  adults: number
  children: number
  newSouls: number
  offering: number
  tithe: number
  feastBadges: number
  firewood: number
  instruments: number
  pastorsWelfare: number
  totalAmount: number
  sentToPastor: number
  received: number
  balance: number
}

export type Expense = {
  id: string
  assemblyId: string
  assemblyName: string
  date: string
  event: string
  description: string
  amount: number
  paidTo: string
  paymentSource: "FREDDY" | "CASH_AT_HAND" | "PASTOR"
  status: "OWED" | "PARTIAL" | "PAID"
}

export type Refund = {
  id: string
  expenseId: string
  amount: number
  date: string
  note: string
}

// Assemblies
export const assemblies: Assembly[] = [
  { id: "1", name: "Grace Assembly", location: "Downtown", leader: "Pastor James", status: "active" },
  { id: "2", name: "Faith Assembly", location: "Westside", leader: "Pastor Mary", status: "active" },
  { id: "3", name: "Hope Assembly", location: "Northgate", leader: "Pastor David", status: "active" },
  { id: "4", name: "Victory Assembly", location: "Eastpoint", leader: "Pastor Ruth", status: "active" },
  { id: "5", name: "Covenant Assembly", location: "Southend", leader: "Pastor Samuel", status: "inactive" },
]

// Income Records
export const incomeRecords: IncomeRecord[] = [
  {
    id: "inc-1", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-01",
    adults: 120, children: 45, newSouls: 3, offering: 45000, tithe: 32000,
    feastBadges: 5000, firewood: 2000, instruments: 0, pastorsWelfare: 8000,
    totalAmount: 92000, sentToPastor: 40000, received: 30000, balance: 22000,
  },
  {
    id: "inc-2", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-02-01",
    adults: 85, children: 30, newSouls: 1, offering: 38000, tithe: 25000,
    feastBadges: 3000, firewood: 1500, instruments: 2000, pastorsWelfare: 6000,
    totalAmount: 75500, sentToPastor: 35000, received: 25000, balance: 15500,
  },
  {
    id: "inc-3", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-02-01",
    adults: 95, children: 38, newSouls: 5, offering: 42000, tithe: 28000,
    feastBadges: 4000, firewood: 1800, instruments: 1500, pastorsWelfare: 7000,
    totalAmount: 84300, sentToPastor: 38000, received: 28000, balance: 18300,
  },
  {
    id: "inc-4", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-25",
    adults: 110, children: 42, newSouls: 2, offering: 50000, tithe: 35000,
    feastBadges: 6000, firewood: 2500, instruments: 3000, pastorsWelfare: 9000,
    totalAmount: 105500, sentToPastor: 45000, received: 35000, balance: 25500,
  },
  {
    id: "inc-5", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-01-25",
    adults: 115, children: 40, newSouls: 4, offering: 43000, tithe: 30000,
    feastBadges: 4500, firewood: 1800, instruments: 1000, pastorsWelfare: 7500,
    totalAmount: 87800, sentToPastor: 38000, received: 28000, balance: 21800,
  },
  {
    id: "inc-6", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-01-18",
    adults: 80, children: 28, newSouls: 0, offering: 35000, tithe: 22000,
    feastBadges: 2500, firewood: 1200, instruments: 1800, pastorsWelfare: 5500,
    totalAmount: 68000, sentToPastor: 30000, received: 22000, balance: 16000,
  },
  {
    id: "inc-7", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-18",
    adults: 90, children: 35, newSouls: 3, offering: 40000, tithe: 26000,
    feastBadges: 3500, firewood: 1600, instruments: 1200, pastorsWelfare: 6500,
    totalAmount: 78800, sentToPastor: 35000, received: 25000, balance: 18800,
  },
  {
    id: "inc-8", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-11",
    adults: 105, children: 40, newSouls: 1, offering: 48000, tithe: 33000,
    feastBadges: 5500, firewood: 2200, instruments: 2800, pastorsWelfare: 8500,
    totalAmount: 100000, sentToPastor: 42000, received: 33000, balance: 25000,
  },
]

// Expenses
export const expenses: Expense[] = [
  { id: "exp-1", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-05", event: "Sunday Service", description: "Sound equipment rental", amount: 15000, paidTo: "SoundPro Ltd", paymentSource: "FREDDY", status: "OWED" },
  { id: "exp-2", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-02-03", event: "Youth Conference", description: "Venue decoration", amount: 8500, paidTo: "Decor Events", paymentSource: "CASH_AT_HAND", status: "PAID" },
  { id: "exp-3", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-01-28", event: "Outreach", description: "Transport for outreach team", amount: 12000, paidTo: "City Buses", paymentSource: "FREDDY", status: "PARTIAL" },
  { id: "exp-4", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-25", event: "Building Maintenance", description: "Roof repair", amount: 25000, paidTo: "BuildRight Construction", paymentSource: "CASH_AT_HAND", status: "PAID" },
  { id: "exp-5", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-20", event: "Choir Ministry", description: "Choir uniforms", amount: 18000, paidTo: "Fashion House", paymentSource: "FREDDY", status: "OWED" },
  { id: "exp-6", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-01-15", event: "Sunday Service", description: "Communion supplies", amount: 3500, paidTo: "Church Supplies Co", paymentSource: "PASTOR", status: "PAID" },
  { id: "exp-7", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-12", event: "Women's Ministry", description: "Conference materials", amount: 9000, paidTo: "PrintWorks", paymentSource: "FREDDY", status: "PAID" },
  { id: "exp-8", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-08", event: "Welfare", description: "Food packages for widows", amount: 20000, paidTo: "FoodMart", paymentSource: "CASH_AT_HAND", status: "PAID" },
]

// Refunds (linked to Freddy expenses)
export const refunds: Refund[] = [
  { id: "ref-1", expenseId: "exp-1", amount: 0, date: "", note: "" },
  { id: "ref-2", expenseId: "exp-3", amount: 5000, date: "2026-02-01", note: "Partial refund from income" },
  { id: "ref-3", expenseId: "exp-5", amount: 0, date: "", note: "" },
  { id: "ref-4", expenseId: "exp-7", amount: 9000, date: "2026-01-20", note: "Full refund from Hope Assembly" },
]

// Monthly trends for charts
export const monthlyIncome = [
  { month: "Sep", income: 280000, expenses: 120000 },
  { month: "Oct", income: 310000, expenses: 145000 },
  { month: "Nov", income: 295000, expenses: 130000 },
  { month: "Dec", income: 380000, expenses: 180000 },
  { month: "Jan", income: 340000, expenses: 155000 },
  { month: "Feb", income: 251800, expenses: 111000 },
]

export const attendanceTrends = [
  { month: "Sep", adults: 380, children: 140, newSouls: 8 },
  { month: "Oct", adults: 400, children: 155, newSouls: 12 },
  { month: "Nov", adults: 390, children: 148, newSouls: 6 },
  { month: "Dec", adults: 450, children: 180, newSouls: 15 },
  { month: "Jan", adults: 410, children: 153, newSouls: 10 },
  { month: "Feb", adults: 300, children: 113, newSouls: 9 },
]

export const assemblyComparison = [
  { name: "Grace", income: 179800, expenses: 47000 },
  { name: "Faith", income: 143500, expenses: 12000 },
  { name: "Hope", income: 163100, expenses: 34000 },
  { name: "Victory", income: 205500, expenses: 18000 },
]

// Helper calculations
export function getCashAtHand() {
  const cashIn = incomeRecords.reduce((sum, r) => sum + r.received, 0)
  const cashOut = expenses
    .filter((e) => e.paymentSource === "CASH_AT_HAND")
    .reduce((sum, e) => sum + e.amount, 0)
  return { cashIn, cashOut, balance: cashIn - cashOut }
}

export function getFreddyLedger() {
  const freddyExpenses = expenses.filter((e) => e.paymentSource === "FREDDY")
  const totalDebt = freddyExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalRefund = refunds.reduce((sum, r) => sum + r.amount, 0)
  return { totalDebt, totalRefund, balance: totalDebt - totalRefund, expenses: freddyExpenses }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
