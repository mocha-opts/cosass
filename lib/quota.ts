// lib/quota.ts
import { db } from "@/lib/db/drizzle";
import { articles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getUser } from "./db/queries";

export async function canCreateArticle() {
  const session = await getSession();
  if (!session) return false;

  // 是否会员
  const user = await getUser();
  if (user.isPro) return true;

  // 已创建数量
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.ownerId, session.user.id));
  return count < 3;
}
