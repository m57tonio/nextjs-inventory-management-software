// check-data.ts
import { db } from "./lib/db";

async function main() {
  const count = await db.purchase.count();
  const rows = await db.purchase.findMany({ take: 5 });

  console.log(`Total purchases: ${count}`);
  console.table(rows);

  await db.$disconnect();
}

main();