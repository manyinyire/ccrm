// ============================================================
// Mock Data for Church Assembly Finance CRM
// Multi-currency: USD and ZWL
// ============================================================

export type Currency = "USD" | "ZWL"

export const ZWL_RATE = 28000 // 1 USD = 28,000 ZWL approx

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
  currency: Currency
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
  currency: Currency
  event: string
  description: string
  amount: number
  paidTo: string
  paymentSource: "OWED_PERSON" | "CASH_AT_HAND" | "PASTOR"
  owedPersonId?: string
  status: "OWED" | "PARTIAL" | "PAID"
}

export type OwedPerson = {
  id: string
  name: string
  phone: string
  role: string
  createdAt: string
}

export type Refund = {
  id: string
  expenseId: string
  owedPersonId: string
  amount: number
  currency: Currency
  date: string
  note: string
}

export type AppUser = {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "treasurer" | "viewer"
  assemblyId?: string
  assemblyName?: string
  status: "active" | "inactive" | "deactivated"
  lastLogin: string
  createdAt: string
  avatar?: string
}

export type Asset = {
  id: string
  name: string
  category: "equipment" | "vehicle" | "furniture" | "electronics" | "property" | "other"
  assemblyId: string
  assemblyName: string
  purchaseDate: string
  purchasePrice: number
  currency: Currency
  currentValue: number
  condition: "excellent" | "good" | "fair" | "poor" | "damaged"
  location: string
  assignedTo?: string
  serialNumber?: string
  notes?: string
}

// Assemblies
export const assemblies: Assembly[] = [
  { id: "1", name: "Grace Assembly", location: "Harare CBD", leader: "Pastor James", status: "active" },
  { id: "2", name: "Faith Assembly", location: "Bulawayo", leader: "Pastor Mary", status: "active" },
  { id: "3", name: "Hope Assembly", location: "Chitungwiza", leader: "Pastor David", status: "active" },
  { id: "4", name: "Victory Assembly", location: "Mutare", leader: "Pastor Ruth", status: "active" },
  { id: "5", name: "Covenant Assembly", location: "Gweru", leader: "Pastor Samuel", status: "inactive" },
]

// Owed Persons (replaces "Freddy" concept)
export const owedPersons: OwedPerson[] = [
  { id: "op-1", name: "Freddy Moyo", phone: "+263 77 123 4567", role: "Finance Officer", createdAt: "2025-01-15" },
  { id: "op-2", name: "Tendai Chirwa", phone: "+263 71 987 6543", role: "Deacon", createdAt: "2025-03-20" },
  { id: "op-3", name: "Grace Mutasa", phone: "+263 78 555 1234", role: "Elder", createdAt: "2025-06-10" },
]

// Users
export const appUsers: AppUser[] = [
  { id: "u-1", name: "Freddy Moyo", email: "freddy@church.org", role: "super_admin", status: "active", lastLogin: "2026-02-11", createdAt: "2025-01-01" },
  { id: "u-2", name: "Pastor James", email: "james@church.org", role: "admin", assemblyId: "1", assemblyName: "Grace Assembly", status: "active", lastLogin: "2026-02-10", createdAt: "2025-01-15" },
  { id: "u-3", name: "Pastor Mary", email: "mary@church.org", role: "admin", assemblyId: "2", assemblyName: "Faith Assembly", status: "active", lastLogin: "2026-02-09", createdAt: "2025-02-01" },
  { id: "u-4", name: "Tendai Chirwa", email: "tendai@church.org", role: "treasurer", assemblyId: "1", assemblyName: "Grace Assembly", status: "active", lastLogin: "2026-02-08", createdAt: "2025-03-20" },
  { id: "u-5", name: "Grace Mutasa", email: "grace@church.org", role: "treasurer", assemblyId: "3", assemblyName: "Hope Assembly", status: "inactive", lastLogin: "2026-01-15", createdAt: "2025-06-10" },
  { id: "u-6", name: "David Ncube", email: "david@church.org", role: "viewer", assemblyId: "4", assemblyName: "Victory Assembly", status: "deactivated", lastLogin: "2025-12-20", createdAt: "2025-04-05" },
  { id: "u-7", name: "Ruth Banda", email: "ruth@church.org", role: "admin", assemblyId: "4", assemblyName: "Victory Assembly", status: "active", lastLogin: "2026-02-11", createdAt: "2025-05-12" },
]

// Assets
export const assets: Asset[] = [
  { id: "a-1", name: "Yamaha Sound System", category: "equipment", assemblyId: "1", assemblyName: "Grace Assembly", purchaseDate: "2025-06-15", purchasePrice: 2500, currency: "USD", currentValue: 2200, condition: "excellent", location: "Main Hall", serialNumber: "YM-2025-001" },
  { id: "a-2", name: "Toyota HiAce Van", category: "vehicle", assemblyId: "1", assemblyName: "Grace Assembly", purchaseDate: "2024-03-10", purchasePrice: 18000, currency: "USD", currentValue: 15000, condition: "good", location: "Church Parking", serialNumber: "TH-2024-VAN", assignedTo: "Pastor James" },
  { id: "a-3", name: "Projector Epson EB-X51", category: "electronics", assemblyId: "2", assemblyName: "Faith Assembly", purchaseDate: "2025-09-01", purchasePrice: 800, currency: "USD", currentValue: 700, condition: "excellent", location: "Auditorium", serialNumber: "EP-X51-002" },
  { id: "a-4", name: "Office Desk Set (6 pcs)", category: "furniture", assemblyId: "3", assemblyName: "Hope Assembly", purchaseDate: "2025-04-20", purchasePrice: 1200, currency: "USD", currentValue: 1000, condition: "good", location: "Admin Office" },
  { id: "a-5", name: "Generator 10kVA", category: "equipment", assemblyId: "1", assemblyName: "Grace Assembly", purchaseDate: "2025-01-10", purchasePrice: 3500, currency: "USD", currentValue: 3000, condition: "good", location: "Generator Room", serialNumber: "GEN-10K-001" },
  { id: "a-6", name: "Plastic Chairs (200 pcs)", category: "furniture", assemblyId: "4", assemblyName: "Victory Assembly", purchaseDate: "2025-07-05", purchasePrice: 12000000, currency: "ZWL", currentValue: 10000000, condition: "fair", location: "Main Hall" },
  { id: "a-7", name: "PA Amplifier", category: "electronics", assemblyId: "2", assemblyName: "Faith Assembly", purchaseDate: "2025-11-15", purchasePrice: 450, currency: "USD", currentValue: 420, condition: "excellent", location: "Sound Room", serialNumber: "PA-AMP-007" },
  { id: "a-8", name: "Church Property Lot", category: "property", assemblyId: "3", assemblyName: "Hope Assembly", purchaseDate: "2023-08-01", purchasePrice: 45000, currency: "USD", currentValue: 55000, condition: "good", location: "Chitungwiza Stand 1234" },
]

// Income Records (mixed currency)
export const incomeRecords: IncomeRecord[] = [
  {
    id: "inc-1", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-01", currency: "USD",
    adults: 120, children: 45, newSouls: 3, offering: 450, tithe: 320,
    feastBadges: 50, firewood: 20, instruments: 0, pastorsWelfare: 80,
    totalAmount: 920, sentToPastor: 400, received: 300, balance: 220,
  },
  {
    id: "inc-2", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-02-01", currency: "USD",
    adults: 85, children: 30, newSouls: 1, offering: 380, tithe: 250,
    feastBadges: 30, firewood: 15, instruments: 20, pastorsWelfare: 60,
    totalAmount: 755, sentToPastor: 350, received: 250, balance: 155,
  },
  {
    id: "inc-3", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-02-01", currency: "ZWL",
    adults: 95, children: 38, newSouls: 5, offering: 12000000, tithe: 8000000,
    feastBadges: 1200000, firewood: 500000, instruments: 400000, pastorsWelfare: 2000000,
    totalAmount: 24100000, sentToPastor: 10000000, received: 8000000, balance: 6100000,
  },
  {
    id: "inc-4", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-25", currency: "USD",
    adults: 110, children: 42, newSouls: 2, offering: 500, tithe: 350,
    feastBadges: 60, firewood: 25, instruments: 30, pastorsWelfare: 90,
    totalAmount: 1055, sentToPastor: 450, received: 350, balance: 255,
  },
  {
    id: "inc-5", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-01-25", currency: "USD",
    adults: 115, children: 40, newSouls: 4, offering: 430, tithe: 300,
    feastBadges: 45, firewood: 18, instruments: 10, pastorsWelfare: 75,
    totalAmount: 878, sentToPastor: 380, received: 280, balance: 218,
  },
  {
    id: "inc-6", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-01-18", currency: "USD",
    adults: 80, children: 28, newSouls: 0, offering: 350, tithe: 220,
    feastBadges: 25, firewood: 12, instruments: 18, pastorsWelfare: 55,
    totalAmount: 680, sentToPastor: 300, received: 220, balance: 160,
  },
  {
    id: "inc-7", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-18", currency: "ZWL",
    adults: 90, children: 35, newSouls: 3, offering: 11000000, tithe: 7500000,
    feastBadges: 1000000, firewood: 450000, instruments: 350000, pastorsWelfare: 1800000,
    totalAmount: 22100000, sentToPastor: 9500000, received: 7000000, balance: 5600000,
  },
  {
    id: "inc-8", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-11", currency: "USD",
    adults: 105, children: 40, newSouls: 1, offering: 480, tithe: 330,
    feastBadges: 55, firewood: 22, instruments: 28, pastorsWelfare: 85,
    totalAmount: 1000, sentToPastor: 420, received: 330, balance: 250,
  },
]

// Expenses (mixed currency, now with owedPersonId)
export const expenses: Expense[] = [
  { id: "exp-1", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-05", currency: "USD", event: "Sunday Service", description: "Sound equipment rental", amount: 150, paidTo: "SoundPro Ltd", paymentSource: "OWED_PERSON", owedPersonId: "op-1", status: "OWED" },
  { id: "exp-2", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-02-03", currency: "USD", event: "Youth Conference", description: "Venue decoration", amount: 85, paidTo: "Decor Events", paymentSource: "CASH_AT_HAND", status: "PAID" },
  { id: "exp-3", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-01-28", currency: "USD", event: "Outreach", description: "Transport for outreach team", amount: 120, paidTo: "City Buses", paymentSource: "OWED_PERSON", owedPersonId: "op-1", status: "PARTIAL" },
  { id: "exp-4", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-25", currency: "ZWL", event: "Building Maintenance", description: "Roof repair materials", amount: 7000000, paidTo: "BuildRight Construction", paymentSource: "CASH_AT_HAND", status: "PAID" },
  { id: "exp-5", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-01-20", currency: "USD", event: "Choir Ministry", description: "Choir uniforms", amount: 180, paidTo: "Fashion House", paymentSource: "OWED_PERSON", owedPersonId: "op-2", status: "OWED" },
  { id: "exp-6", assemblyId: "2", assemblyName: "Faith Assembly", date: "2026-01-15", currency: "USD", event: "Sunday Service", description: "Communion supplies", amount: 35, paidTo: "Church Supplies Co", paymentSource: "PASTOR", status: "PAID" },
  { id: "exp-7", assemblyId: "3", assemblyName: "Hope Assembly", date: "2026-01-12", currency: "ZWL", event: "Women's Ministry", description: "Conference materials printing", amount: 2500000, paidTo: "PrintWorks", paymentSource: "OWED_PERSON", owedPersonId: "op-3", status: "PAID" },
  { id: "exp-8", assemblyId: "1", assemblyName: "Grace Assembly", date: "2026-02-08", currency: "USD", event: "Welfare", description: "Food packages for widows", amount: 200, paidTo: "FoodMart", paymentSource: "CASH_AT_HAND", status: "PAID" },
  { id: "exp-9", assemblyId: "4", assemblyName: "Victory Assembly", date: "2026-02-01", currency: "USD", event: "Crusade", description: "PA system hire", amount: 250, paidTo: "EventSound", paymentSource: "OWED_PERSON", owedPersonId: "op-1", status: "OWED" },
]

// Refunds (now linked to owedPersonId)
export const refunds: Refund[] = [
  { id: "ref-1", expenseId: "exp-1", owedPersonId: "op-1", amount: 0, currency: "USD", date: "", note: "" },
  { id: "ref-2", expenseId: "exp-3", owedPersonId: "op-1", amount: 50, currency: "USD", date: "2026-02-01", note: "Partial refund from income" },
  { id: "ref-3", expenseId: "exp-5", owedPersonId: "op-2", amount: 0, currency: "USD", date: "", note: "" },
  { id: "ref-4", expenseId: "exp-7", owedPersonId: "op-3", amount: 2500000, currency: "ZWL", date: "2026-01-20", note: "Full refund from Hope Assembly" },
  { id: "ref-5", expenseId: "exp-9", owedPersonId: "op-1", amount: 0, currency: "USD", date: "", note: "" },
]

// Monthly trends for charts (USD equivalents)
export const monthlyIncome = [
  { month: "Sep", income: 2800, expenses: 1200 },
  { month: "Oct", income: 3100, expenses: 1450 },
  { month: "Nov", income: 2950, expenses: 1300 },
  { month: "Dec", income: 3800, expenses: 1800 },
  { month: "Jan", income: 3400, expenses: 1550 },
  { month: "Feb", income: 2518, expenses: 1110 },
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
  { name: "Grace", income: 1798, expenses: 470 },
  { name: "Faith", income: 1435, expenses: 120 },
  { name: "Hope", income: 1650, expenses: 340 },
  { name: "Victory", income: 2055, expenses: 430 },
]

export const cashFlowTrends = [
  { month: "Sep", inflow: 820, outflow: 350, balance: 470 },
  { month: "Oct", inflow: 950, outflow: 420, balance: 1000 },
  { month: "Nov", inflow: 880, outflow: 380, balance: 1500 },
  { month: "Dec", inflow: 1200, outflow: 550, balance: 2150 },
  { month: "Jan", inflow: 1080, outflow: 450, balance: 2780 },
  { month: "Feb", inflow: 830, outflow: 285, balance: 3325 },
]

// Helper calculations
export function getCashAtHand(currency?: Currency) {
  const cashInUSD = incomeRecords
    .filter((r) => r.currency === "USD")
    .reduce((sum, r) => sum + r.received, 0)
  const cashInZWL = incomeRecords
    .filter((r) => r.currency === "ZWL")
    .reduce((sum, r) => sum + r.received, 0)
  const cashOutUSD = expenses
    .filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "USD")
    .reduce((sum, e) => sum + e.amount, 0)
  const cashOutZWL = expenses
    .filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "ZWL")
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    usd: { cashIn: cashInUSD, cashOut: cashOutUSD, balance: cashInUSD - cashOutUSD },
    zwl: { cashIn: cashInZWL, cashOut: cashOutZWL, balance: cashInZWL - cashOutZWL },
  }
}

export function getOwedLedger(personId?: string) {
  const owedExpenses = expenses.filter(
    (e) => e.paymentSource === "OWED_PERSON" && (!personId || e.owedPersonId === personId)
  )
  const personRefunds = refunds.filter((r) => !personId || r.owedPersonId === personId)

  // Separate by currency
  const usdDebt = owedExpenses.filter((e) => e.currency === "USD").reduce((sum, e) => sum + e.amount, 0)
  const zwlDebt = owedExpenses.filter((e) => e.currency === "ZWL").reduce((sum, e) => sum + e.amount, 0)
  const usdRefund = personRefunds.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.amount, 0)
  const zwlRefund = personRefunds.filter((r) => r.currency === "ZWL").reduce((sum, r) => sum + r.amount, 0)

  return {
    usd: { totalDebt: usdDebt, totalRefund: usdRefund, balance: usdDebt - usdRefund },
    zwl: { totalDebt: zwlDebt, totalRefund: zwlRefund, balance: zwlDebt - zwlRefund },
    expenses: owedExpenses,
  }
}

export function formatCurrency(amount: number, currency: Currency = "USD") {
  if (currency === "ZWL") {
    return `ZWL ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function convertToUSD(amount: number, currency: Currency): number {
  if (currency === "USD") return amount
  return Math.round(amount / ZWL_RATE)
}

export const roleLabels: Record<AppUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  treasurer: "Treasurer",
  viewer: "Viewer",
}

export const conditionLabels: Record<Asset["condition"], string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  damaged: "Damaged",
}

export const categoryLabels: Record<Asset["category"], string> = {
  equipment: "Equipment",
  vehicle: "Vehicle",
  furniture: "Furniture",
  electronics: "Electronics",
  property: "Property",
  other: "Other",
}
