// app/api/articles/public/[id]/route.ts

import { db } from "@/lib/db/drizzle";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const articleId = Number(params.id);

  if (isNaN(articleId)) {
    return new Response("Invalid article ID", { status: 400 });
  }

  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, articleId));

  const article = result[0];

  if (!article || !article.isPublic) {
    return new Response("文章不存在或未公开", { status: 404 });
  }

  return Response.json(article);
}
