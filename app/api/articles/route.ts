import { getArticlesByCategoryId } from "@/lib/db/articles";

import { db } from "@/lib/db/drizzle";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  let articles;
  try {
    if (categoryId) {
      articles = await getArticlesByCategoryId(parseInt(categoryId));
    }
    console.log("articles", articles);
    return new Response(JSON.stringify(articles), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch articles" }), {
      status: 500,
    });
  }
}
