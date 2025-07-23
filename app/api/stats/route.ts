import { getUser } from "@/lib/db/queries";
import { getLearningStats } from "@/lib/db/progress";
import { db } from "@/lib/db/drizzle";
import { userProgress, articles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getLearningStats(user.id);
    
    // 获取最近的学习进度
    const recentProgress = await db
      .select({
        id: userProgress.id,
        readingProgress: userProgress.readingProgress,
        isCompleted: userProgress.isCompleted,
        lastReadAt: userProgress.lastReadAt,
        article: {
          id: articles.id,
          title: articles.title,
        },
      })
      .from(userProgress)
      .leftJoin(articles, eq(userProgress.articleId, articles.id))
      .where(eq(userProgress.userId, user.id))
      .orderBy(desc(userProgress.lastReadAt))
      .limit(5);

    return Response.json({
      ...stats,
      recentProgress,
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}