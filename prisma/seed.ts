import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS } from "../lib/permissions";

const db = new PrismaClient();

// Permissions withheld from the manager default role.
// The admin can always re-grant these via the Roles UI.
const MANAGER_EXCLUDED = new Set([
  'Manage Roles',
  'Manage Users',
]);

// Permissions granted to the cashier default role.
const CASHIER_PERMS = new Set([
  'Manage Dashboard',
  'Manage Pos Screen',
  'Manage Sale',
]);

// Permissions granted to the user default role.
const USER_PERMS = new Set([
  'Manage Dashboard',
]);

async function seedRole(name: string, perms: readonly string[]) {
  const role = await db.role.upsert({
    where:  { name },
    update: { deletedAt: null },
    create: { name },
  });

  // Replace permissions: delete all then create the new set atomically.
  await db.rolePermission.deleteMany({ where: { roleId: role.id } });
  if (perms.length > 0) {
    await db.rolePermission.createMany({
      data: perms.map((permission) => ({ roleId: role.id, permission })),
    });
  }

  console.log(`  ${name}: ${perms.length} permission(s)`);
  return role;
}

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash("Admin@1234", 12);

  const adminUser = await db.user.upsert({
    where:  { email: "admin@gildedglow.com" },
    update: {},
    create: {
      firstName:   "Admin",
      lastName:    "User",
      email:       "admin@gildedglow.com",
      password:    hashed,
      phoneNumber: "+1 555 000 0000",
      image:       null,
      role:        "admin",
    },
  });

  console.log(`Seeded admin user → id: ${adminUser.id}  email: ${adminUser.email}`);

  // ── Default / walk-in customer ──────────────────────────────────────────────
  const directCustomer = await db.customer.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      name:        "direct-customer",
      email:       "customer@gildedglow.com",
      phoneNumber: null,
      isDefault:   true,
    },
  });

  console.log(`Seeded default customer → id: ${directCustomer.id}  name: ${directCustomer.name}`);

  // ── Roles with permissions ──────────────────────────────────────────────────
  // admin: every permission in the canonical list (super-role)
  // manager: everything except Manage Roles + Manage Users
  // cashier: POS-focused subset
  // user: dashboard only
  console.log('Seeding roles:');

  const adminPerms   = [...PERMISSIONS];
  const managerPerms = PERMISSIONS.filter((p) => !MANAGER_EXCLUDED.has(p));
  const cashierPerms = PERMISSIONS.filter((p) => CASHIER_PERMS.has(p));
  const userPerms    = PERMISSIONS.filter((p) => USER_PERMS.has(p));

  const adminRole   = await seedRole('admin',   adminPerms);
  const managerRole = await seedRole('manager', managerPerms);
  const cashierRole = await seedRole('cashier', cashierPerms);
  const userRole    = await seedRole('user',    userPerms);

  // ── Link existing users to their Role records via roleId ────────────────────
  // Users whose role string matches a Role name get their roleId set.
  // This is safe to run repeatedly; already-linked users are re-confirmed.
  const roleMap: Record<string, number> = {
    admin:   adminRole.id,
    manager: managerRole.id,
    cashier: cashierRole.id,
    user:    userRole.id,
  };

  for (const [roleName, roleId] of Object.entries(roleMap)) {
    const { count } = await db.user.updateMany({
      where: { role: roleName, deletedAt: null },
      data:  { roleId },
    });
    if (count > 0) console.log(`  Linked ${count} user(s) with role="${roleName}" → roleId=${roleId}`);
  }

  // ── Default product units ────────────────────────────────────────────────────
  const units = ['Piece', 'Kilogram', 'Gram', 'Meter', 'Centimeter', 'Liter', 'Milliliter', 'Box', 'Dozen', 'Pack', 'Set', 'Bottle', 'Bag', 'Roll'];
  for (const name of units) {
    await db.unit.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Seeded units: ${units.join(', ')}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
