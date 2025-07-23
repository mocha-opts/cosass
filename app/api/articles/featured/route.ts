// app/api/articles/featured/route.ts

import { db } from "@/lib/db/drizzle";
import { articles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries";

export async function GET() {
  const user = await getUser();

  // 非会员用户禁止访问精选文章
  if (user?.role !== "pro_member") {
    return new Response(
      JSON.stringify({ error: "请升级为会员后访问精选文章" }),
      { status: 403 }
    );
  }

  const featured = await db
    .select()
    .from(articles)
    .where(eq(articles.isFeatured, true));

  return Response.json(featured);
}
