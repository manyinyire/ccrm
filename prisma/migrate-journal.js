const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// Account code -> ID cache
const accountIds = {}

async function getAccountId(code) {
  if (accountIds[code]) return accountIds[code]
  const acc = await prisma.account.findUnique({ where: { code } })
  if (!acc) throw new Error(`Account ${code} not found. Run seed-accounts.js first.`)
  accountIds[code] = acc.id
  return acc.id
}

async function createEntry({ date, debitCode, creditCode, amount, currency, description, reference, sourceType, sourceId, assemblyId }) {
  if (amount <= 0) return
  const [debitAccountId, creditAccountId] = await Promise.all([
    getAccountId(debitCode),
    getAccountId(creditCode),
  ])
  await prisma.journalEntry.create({
    data: { date, debitAccountId, creditAccountId, amount, currency, description, reference, sourceType, sourceId, assemblyId: assemblyId || null },
  })
}

async function migrateIncome() {
  const records = await prisma.income.findMany()
  let count = 0
  for (const r of records) {
    const base = { date: r.date, currency: r.currency, sourceType: "Income", sourceId: r.id, assemblyId: r.assemblyId }
    const ref = `INC-${r.id.slice(-6)}`

    if (r.projectId) {
      await createEntry({ ...base, debitCode: "1300", creditCode: "4800", amount: r.totalAmount, description: "Project income", reference: ref })
      count++
      continue
    }

    const items = [
      [r.offering, "4100", "Offering"],
      [r.tithe, "4200", "Tithe"],
      [r.feastBadges, "4300", "Feast badges"],
      [r.firewood, "4400", "Firewood"],
      [r.instruments, "4500", "Instruments"],
      [r.pastorsWelfare, "4600", "Pastor's welfare"],
    ]
    for (const [amount, creditCode, label] of items) {
      if (amount > 0) {
        await createEntry({ ...base, debitCode: "1300", creditCode, amount, description: label, reference: ref })
        count++
      }
    }

    const customTotal = Object.values(r.customItems || {}).reduce((s, v) => s + (Number(v) || 0), 0)
    if (customTotal > 0) {
      await createEntry({ ...base, debitCode: "1300", creditCode: "4700", amount: customTotal, description: "Custom income items", reference: ref })
      count++
    }
  }
  console.log(`  Income: ${records.length} records -> ${count} journal entries`)
}

async function migrateReceivables() {
  const records = await prisma.receivable.findMany()
  let count = 0
  for (const r of records) {
    const base = { date: r.date, currency: r.currency, sourceType: "Receivable", sourceId: r.id, assemblyId: r.assemblyId }
    const ref = `REC-${r.id.slice(-6)}`
    const cashCode = r.paymentMethod === "ECOCASH" ? "1200" : "1100"

    // DR Cash, CR Accounts Receivable
    await createEntry({ ...base, debitCode: cashCode, creditCode: "1300", amount: r.amount, description: "Received from assembly", reference: ref })
    count++

    // If sent to pastor: DR Pastor Remittance, CR Cash
    if (r.sentToPastor) {
      await createEntry({ ...base, debitCode: "2200", creditCode: cashCode, amount: r.amount, description: "Forwarded to pastor", reference: ref })
      count++
    }
  }
  console.log(`  Receivables: ${records.length} records -> ${count} journal entries`)
}

async function migrateExpenses() {
  const records = await prisma.expense.findMany()
  let count = 0
  for (const r of records) {
    const base = { date: r.date, currency: r.currency, sourceType: "Expense", sourceId: r.id, assemblyId: r.assemblyId }
    const ref = `EXP-${r.id.slice(-6)}`
    const debitCode = r.projectId ? "5200" : "5100"
    let creditCode = "1100"
    if (r.paymentSource === "OWED_PERSON") creditCode = "2100"
    else if (r.paymentSource === "ECOCASH") creditCode = "1200"

    await createEntry({ ...base, debitCode, creditCode, amount: r.amount, description: r.description, reference: ref })
    count++
  }
  console.log(`  Expenses: ${records.length} records -> ${count} journal entries`)
}

async function migrateRefunds() {
  const records = await prisma.refund.findMany()
  let count = 0
  for (const r of records) {
    const ref = `REF-${r.id.slice(-6)}`
    await createEntry({
      date: r.date, currency: r.currency, sourceType: "Refund", sourceId: r.id, assemblyId: null,
      debitCode: "2100", creditCode: "1100", amount: r.amount, description: "Refund payment", reference: ref,
    })
    count++
  }
  console.log(`  Refunds: ${records.length} records -> ${count} journal entries`)
}

async function main() {
  // Check if journal entries already exist
  const existing = await prisma.journalEntry.count()
  if (existing > 0) {
    console.log(`Found ${existing} existing journal entries. Clearing and re-migrating...`)
    await prisma.journalEntry.deleteMany()
  }

  console.log("Migrating existing transactions to journal entries...")
  await migrateIncome()
  await migrateReceivables()
  await migrateExpenses()
  await migrateRefunds()

  const total = await prisma.journalEntry.count()
  console.log(`\nDone! Total journal entries: ${total}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
