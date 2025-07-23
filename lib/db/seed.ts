import { stripe } from "../payments/stripe";
import { db } from "./drizzle";
import { users, teams, teamMembers, articles, categories } from "./schema";
import { hashPassword } from "@/lib/auth/session";

async function createStripeProducts() {
  console.log("Creating Stripe products and prices...");

  const baseProduct = await stripe.products.create({
    name: "Base",
    description: "Base subscription plan",
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 800, // $8 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: "Plus",
    description: "Plus subscription plan",
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1200, // $12 in cents
    currency: "usd",
    recurring: {
      interval: "month",
      trial_period_days: 7,
    },
  });

  console.log("Stripe products and prices created successfully.");
}

async function seed() {
  const email = "test@test.com";
  const password = "admin123";
  const passwordHash = await hashPassword(password);

  // const [user] = await db
  //   .insert(users)
  //   .values([
  //     {
  //       email: email,
  //       passwordHash: passwordHash,
  //       role: "owner",
  //     },
  //   ])
  //   .returning();

  // console.log("Initial user created.");

  // const [team] = await db
  //   .insert(teams)
  //   .values({
  //     name: "Test Team",
  //   })
  //   .returning();

  // await db.insert(teamMembers).values({
  //   teamId: team.id,
  //   userId: user.id,
  //   role: "owner",
  // });

  // await createStripeProducts();

  // Insert categories
  const categoryData = [
    { name: "科技创新", description: "探索最新的科技趋势和创新思维" },
    { name: "个人成长", description: "提升自我，实现个人价值" },
    { name: "商业管理", description: "商业智慧和管理艺术" },
    { name: "社会议题", description: "关注社会热点和人文思考" },
    { name: "健康生活", description: "身心健康和生活方式" },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();

  // Insert sample articles
  const articleData = [
    {
      title: "The Power of Vulnerability",
      content: [
        "So I'll start with this: a couple years ago, an event planner called me because I was going to do a speaking event.",
        "And she called, and she said, 'I'm really struggling with how to write about you on the little flyer.'",
        "And I thought, 'Well, what's the struggle?' And she said, 'Well, I saw you speak, and I'm going to call you a researcher, I think, but I'm afraid if I call you a researcher, no one will come, because they'll think you're boring and irrelevant.'",
      ],
      categoryId: insertedCategories[1].id,
      isFeatured: true,
    },
    {
      title: "How to Build Your Creative Confidence",
      content: [
        "I want to tell you about a moment that changed my life and might change yours too.",
        "It happened when I was nine years old, and I was in my fourth-grade art class.",
        "My teacher, Mrs. Box, was teaching us how to make clay sculptures.",
      ],
      categoryId: insertedCategories[1].id,
      isFeatured: false,
    },
  ];

  await db.insert(articles).values(articleData);

  console.log("Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("Seed process failed:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Seed process finished. Exiting...");
    process.exit(0);
  });
