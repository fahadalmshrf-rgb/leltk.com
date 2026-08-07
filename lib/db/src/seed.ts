import { db } from "./index";
import * as schema from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    const targetTable = (schema as any).venues || (schema as any).venuesTable;

    await db.insert(targetTable).values([
      {
        nameAr: "قاعة ليلتك الكبرى",
        categorySlug: "wedding-halls",
        description: "قاعة أفراح ومناسبات راقية بأحدث التقنيات",
        district: "الرياض",
        address: "حي حطين، الرياض",
        pricePerNight: 5000,
        capacity: 300,
        rating: 5,
        isFeatured: true,
        isAvailable: true,
      },
      {
        nameAr: "قاعة حطين الملكية",
        categorySlug: "wedding-halls",
        description: "قاعة فخمة في قلب حطين",
        district: "حطين",
        address: "حي حطين، الرياض",
        pricePerNight: 6000,
        capacity: 400,
        rating: 4.9,
        isFeatured: true,
        isAvailable: true,
      },
      {
        nameAr: "قاعة الأسطورة",
        categorySlug: "wedding-halls",
        description: "قاعة فخمة للمناسبات الخاصة والاحتفالات",
        district: "جدة",
        address: "حي الشاطئ، جدة",
        pricePerNight: 4500,
        capacity: 250,
        rating: 4.8,
        isFeatured: true,
        isAvailable: true,
      },
    ]);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }

  process.exit(0);
}

seed();