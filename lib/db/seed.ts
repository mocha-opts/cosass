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
        "So I'll start with this: a couple years ago, an event planner called me because I was going to do a speaking event. And she called, and she said, 'I'm really struggling with how to write about you on the little flyer.' And I thought, 'Well, what's the struggle?' And she said, 'Well, I saw you speak, and I'm going to call you a researcher, I think, but I'm afraid if I call you a researcher, no one will come, because they'll think you're boring and irrelevant.'",

        "And I was like, 'Okay.' And she said, 'But the thing I liked about your talk is you're a storyteller. So I think what I'll do is just call you a storyteller.' And of course, the academic, insecure part of me was like, 'You're going to call me a what?' And she said, 'I'm going to call you a storyteller.' And I was like, 'Why not magic pixie?' I was like, 'Let me think about this for a second.'",

        "I tried to call myself a researcher-storyteller, and the hyphen got lost in translation, and I ended up being called a research storyteller, which makes no sense. So I'll be a storyteller. And like all good stories, this one has a beginning, a middle, and an end.",

        "So the beginning: I am a qualitative researcher. I collect stories; that's what I do. And maybe stories is a kind of grandiose way of saying it, but I collect stories, and I study human connection -- our ability to empathize, to belong, to love. And over the past six years, I've found that there's really this one thing that underpins this sense of connection, this ability to connect.",

        "And that one thing is vulnerability. And so these past six years, I've been thinking about vulnerability and courage and authenticity and shame. And what I've learned is this: We numb vulnerability -- when we're waiting for the call. It was funny, I sent something out on Twitter and on Facebook that says, 'How would you define vulnerability? What makes you feel vulnerable?' And within an hour and a half, I had 150 responses.",

        "Because I wanted to know what's the anatomy of vulnerability and what's it built out of. So, vulnerability is basically uncertainty, risk, and emotional exposure. And that seems pretty straightforward, but let me tell you what it's not. Vulnerability is not weakness. And that myth is profoundly dangerous. Let me tell you why.",

        "We live in a vulnerable world. And one of the ways we deal with it is we numb vulnerability. And I think there's evidence -- and it's not the only reason this evidence exists, but I think it's a huge cause -- We are the most in-debt, obese, addicted and medicated adult cohort in U.S. history.",

        "The problem is -- and I learned this from the research -- that you cannot selectively numb emotion. You can't say, here's the bad stuff. Here's vulnerability, here's grief, here's shame, here's fear, here's disappointment. I don't want to feel these. I'm going to have a couple of beers and a banana nut muffin.",

        "You can't numb those hard feelings without numbing the other affects, our emotions. You cannot selectively numb. So when we numb those, we numb joy, we numb gratitude, we numb happiness. And then, we are miserable, and we are looking for purpose and meaning, and then we feel vulnerable, so then we have a couple of beers and a banana nut muffin.",

        "And it becomes this dangerous cycle. One of the things that I think we need to think about is why and how we numb. And it doesn't necessarily have to be addiction. The other thing we do is we make everything that's uncertain certain. Religion has gone from a belief in faith and mystery to certainty.",

        "I'm right, you're wrong. Shut up. That's it. Just certain. The more afraid we are, the more vulnerable we are, the more afraid we are. This is what politics looks like today. There's no discourse anymore. There's no conversation",
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
