import { db } from "@/lib/db/drizzle";
import { articles } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/db/queries";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const userArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.userId, user.id));

  if (user.role !== "pro_member" && userArticles.length >= 3) {
    return NextResponse.json(
      { error: "非会员最多保存 3 篇文章，请升级会员" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const newArticle = await db
    .insert(articles)
    .values({
      userId: user.id,
      title: body.title,
      content: body.content, // 直接存储数组，不要 JSON.stringify
    })
    .returning();

  return NextResponse.json(newArticle[0]);
}
