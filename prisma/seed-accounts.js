const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// Church-specific Chart of Accounts
const accounts = [
  // ASSET accounts (1xxx)
  { code: "1000", name: "Assets", type: "ASSET", description: "All asset accounts", isSystem: true },
  { code: "1100", name: "Cash at Hand", type: "ASSET", parentCode: "1000", description: "Physical cash held by the church", isSystem: true },
  { code: "1200", name: "Bank / EcoCash", type: "ASSET", parentCode: "1000", description: "Money in bank or mobile money", isSystem: true },
  { code: "1300", name: "Accounts Receivable", type: "ASSET", parentCode: "1000", description: "Money owed by assemblies", isSystem: true },
  { code: "1400", name: "Fixed Assets", type: "ASSET", parentCode: "1000", description: "Church property and equipment", isSystem: true },
  { code: "1500", name: "Venture Inventory", type: "ASSET", parentCode: "1000", description: "Venture product stock", isSystem: true },

  // LIABILITY accounts (2xxx)
  { code: "2000", name: "Liabilities", type: "LIABILITY", description: "All liability accounts", isSystem: true },
  { code: "2100", name: "Accounts Payable", type: "LIABILITY", parentCode: "2000", description: "Money owed to individuals (owed persons)", isSystem: true },
  { code: "2200", name: "Pastor Remittance Payable", type: "LIABILITY", parentCode: "2000", description: "Money collected to be sent to pastor", isSystem: true },

  // EQUITY accounts (3xxx)
  { code: "3000", name: "Equity", type: "EQUITY", description: "Church equity/fund balance", isSystem: true },
  { code: "3100", name: "General Fund", type: "EQUITY", parentCode: "3000", description: "Accumulated church funds", isSystem: true },
  { code: "3200", name: "Project Funds", type: "EQUITY", parentCode: "3000", description: "Funds allocated to projects", isSystem: true },

  // REVENUE accounts (4xxx)
  { code: "4000", name: "Revenue", type: "REVENUE", description: "All income/revenue accounts", isSystem: true },
  { code: "4100", name: "Offerings", type: "REVENUE", parentCode: "4000", description: "Sunday offerings", isSystem: true },
  { code: "4200", name: "Tithes", type: "REVENUE", parentCode: "4000", description: "Member tithes", isSystem: true },
  { code: "4300", name: "Feast Badges", type: "REVENUE", parentCode: "4000", description: "Feast badge income", isSystem: true },
  { code: "4400", name: "Firewood", type: "REVENUE", parentCode: "4000", description: "Firewood contributions", isSystem: true },
  { code: "4500", name: "Instruments", type: "REVENUE", parentCode: "4000", description: "Musical instruments fund", isSystem: true },
  { code: "4600", name: "Pastor's Welfare", type: "REVENUE", parentCode: "4000", description: "Pastor welfare contributions", isSystem: true },
  { code: "4700", name: "Other Income", type: "REVENUE", parentCode: "4000", description: "Miscellaneous income items", isSystem: true },
  { code: "4800", name: "Project Income", type: "REVENUE", parentCode: "4000", description: "Income designated for projects", isSystem: true },
  { code: "4900", name: "Venture Revenue", type: "REVENUE", parentCode: "4000", description: "Revenue from church ventures", isSystem: true },

  // EXPENSE accounts (5xxx)
  { code: "5000", name: "Expenses", type: "EXPENSE", description: "All expense accounts", isSystem: true },
  { code: "5100", name: "General Expenses", type: "EXPENSE", parentCode: "5000", description: "General church expenses", isSystem: true },
  { code: "5200", name: "Project Expenses", type: "EXPENSE", parentCode: "5000", description: "Expenses for church projects", isSystem: true },
  { code: "5300", name: "Venture Expenses", type: "EXPENSE", parentCode: "5000", description: "Expenses for church ventures", isSystem: true },
  { code: "5400", name: "Refunds Paid", type: "EXPENSE", parentCode: "5000", description: "Refunds paid to owed persons", isSystem: true },
]

async function main() {
  console.log("Seeding chart of accounts...")

  // Create accounts in order (parents first)
  const created = {}
  for (const acc of accounts) {
    const parentId = acc.parentCode ? created[acc.parentCode] : null
    const existing = await prisma.account.findUnique({ where: { code: acc.code } })
    if (existing) {
      created[acc.code] = existing.id
      console.log(`  ✓ ${acc.code} ${acc.name} (exists)`)
      continue
    }
    const record = await prisma.account.create({
      data: {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId,
        description: acc.description || "",
        isSystem: acc.isSystem || false,
      },
    })
    created[acc.code] = record.id
    console.log(`  + ${acc.code} ${acc.name}`)
  }

  console.log(`\nSeeded ${Object.keys(created).length} accounts.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
