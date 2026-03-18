import { PrismaClient } from "@prisma/client";
import { COMPANY_CONFIGS } from "../src/lib/scraper/companies.config";

const prisma = new PrismaClient();

/**
 * Seeds the database with company data from the config.
 * This runs via `npm run db:seed` or `npx prisma db seed`.
 */

async function main() {
  console.log("🌱 Seeding database...\n");

  for (const company of COMPANY_CONFIGS) {
    const result = await prisma.company.upsert({
      where: { slug: company.slug },
      create: company,
      update: company,
    });
    console.log(`  ✅ ${result.name} (${result.slug})`);
  }

  // Deactivate companies that were removed from the config
  const activeSlugs = COMPANY_CONFIGS.map((c) => c.slug);
  const deactivated = await prisma.company.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });
  if (deactivated.count > 0) {
    console.log(`\n  🗑️  Deactivated ${deactivated.count} removed companies`);
  }

  console.log(`\n🎉 Seeded ${COMPANY_CONFIGS.length} companies.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
