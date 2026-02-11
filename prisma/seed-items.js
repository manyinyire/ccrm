const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  // Only Offering and Tithe are default income items
  const defaultIncomeItems = ["Offering", "Tithe"];
  const otherIncomeItems = ["Feast Badges", "Firewood", "Instruments", "Pastors Welfare"];

  for (let i = 0; i < defaultIncomeItems.length; i++) {
    await p.incomeItem.upsert({
      where: { name: defaultIncomeItems[i] },
      update: { isDefault: true },
      create: { name: defaultIncomeItems[i], isDefault: true, sortOrder: i },
    });
  }
  for (let i = 0; i < otherIncomeItems.length; i++) {
    await p.incomeItem.upsert({
      where: { name: otherIncomeItems[i] },
      update: { isDefault: false },
      create: { name: otherIncomeItems[i], isDefault: false, sortOrder: defaultIncomeItems.length + i },
    });
  }

  const expCats = [
    "Transport",
    "Utilities",
    "Supplies",
    "Maintenance",
    "Events",
    "Salaries",
    "Miscellaneous",
  ];
  for (let i = 0; i < expCats.length; i++) {
    await p.expenseCategory.upsert({
      where: { name: expCats[i] },
      update: {},
      create: { name: expCats[i], isDefault: true, sortOrder: i },
    });
  }

  console.log("Seeded defaults - only Offering & Tithe are default income items");
  await p.$disconnect();
}

main();
