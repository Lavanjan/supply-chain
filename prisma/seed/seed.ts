import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import {
  ADMIN_PERMISSION_CODES,
  MANAGER_PERMISSION_CODES,
  PERMISSIONS,
} from "../../lib/constants/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLE_PERMISSION_MAP: Record<"ADMIN" | "MANAGER", string[]> = {
  ADMIN: ADMIN_PERMISSION_CODES,
  MANAGER: MANAGER_PERMISSION_CODES,
};

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

async function seedRoles() {
  for (const roleName of ["ADMIN", "MANAGER"] as const) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: roleName === "ADMIN" ? "Full system access" : "Operational access",
      },
    });

    const permissionCodes = ROLE_PERMISSION_MAP[roleName];
    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    console.log(`Role ${roleName}: ${permissions.length} permissions assigned.`);
  }
}

async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@supplychain.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Administrator",
      email: adminEmail,
      password: passwordHash,
      roleId: adminRole.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Default password: ${adminPassword} (change this immediately after first login)`);
  }
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedAdminUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
