// ============================================================
// Helper utilities for Church Assembly Finance CRM
// Multi-currency: USD and ZWL
// ============================================================

export type Currency = "USD" | "ZWL"

export const ZWL_RATE = 28000 // 1 USD = 28,000 ZWL approx

export type Assembly = {
  id: string
  name: string
  location: string
  leader: string
  status: string
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
  owedPersonId?: string | null
  owedPersonName?: string | null
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
  role: string
  assemblyId?: string | null
  assemblyName?: string | null
  status: string
  createdAt: string
  updatedAt?: string
}

export type Asset = {
  id: string
  name: string
  category: string
  assemblyId: string
  assemblyName: string
  purchaseDate: string
  purchasePrice: number
  currency: Currency
  currentValue: number
  condition: string
  location: string
  assignedTo?: string | null
  serialNumber?: string | null
  notes?: string | null
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

export function convertToUSD(amount: number, currency: Currency | string): number {
  if (currency === "USD") return amount
  return Math.round(amount / ZWL_RATE)
}

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TREASURER: "Treasurer",
  ASSEMBLY_LEADER: "Assembly Leader",
  VIEWER: "Viewer",
}

export const conditionLabels: Record<string, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DAMAGED: "Damaged",
}

export const categoryLabels: Record<string, string> = {
  EQUIPMENT: "Equipment",
  VEHICLE: "Vehicle",
  FURNITURE: "Furniture",
  ELECTRONICS: "Electronics",
  PROPERTY: "Property",
  OTHER: "Other",
}
