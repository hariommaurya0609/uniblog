import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function scrapeDatadog() {
  console.log("🗑️  Deleting all Datadog articles...\n");

  const deleted = await prisma.article.deleteMany({
    where: { company: { slug: "datadog" } },
  });

  console.log(`✅ Deleted ${deleted.count} articles\n`);
  console.log("🔄 Running scraper for all companies...\n");

  try {
    const { stdout, stderr } = await execAsync("npx tsx scripts/scrape.ts", {
      cwd: process.cwd(),
      env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
    });

    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("\n📊 Checking Datadog articles...\n");

    const stats = await prisma.article.aggregate({
      where: { company: { slug: "datadog" } },
      _count: true,
    });

    const withImages = await prisma.article.count({
      where: {
        company: { slug: "datadog" },
        imageUrl: { not: null },
      },
    });

    console.log(`✅ Total Datadog articles: ${stats._count}`);
    console.log(`🖼️  Articles with images: ${withImages}`);
    console.log(`❌ Articles without images: ${stats._count - withImages}`);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

scrapeDatadog()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
