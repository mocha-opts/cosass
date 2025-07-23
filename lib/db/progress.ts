import { and, eq, sql } from "drizzle-orm";
import { db } from "./drizzle";
import { userProgress, learningStats, wordNotes } from "./schema";

export async function getUserProgress(articleId: number, userId: number) {
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.articleId, articleId),
        eq(userProgress.userId, userId)
      )
    );
  
  return progress || null;
}

export async function updateUserProgress({
  userId,
  articleId,
  readingProgress,
  timeSpent,
  isCompleted = false,
}: {
  userId: number;
  articleId: number;
  readingProgress?: number;
  timeSpent?: number;
  isCompleted?: boolean;
}) {
  const existing = await getUserProgress(articleId, userId);
  
  if (existing) {
    return await db
      .update(userProgress)
      .set({
        readingProgress: readingProgress ?? existing.readingProgress,
        timeSpent: (existing.timeSpent || 0) + (timeSpent || 0),
        isCompleted,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userProgress.articleId, articleId),
          eq(userProgress.userId, userId)
        )
      )
      .returning();
  } else {
    return await db
      .insert(userProgress)
      .values({
        userId,
        articleId,
        readingProgress: readingProgress || 0,
        timeSpent: timeSpent || 0,
        isCompleted,
        lastReadAt: new Date(),
      })
      .returning();
  }
}

export async function updateLearningStats(userId: number) {
  // 获取用户的学习统计
  const [stats] = await db
    .select()
    .from(learningStats)
    .where(eq(learningStats.userId, userId));

  // 计算总数据
  const [progressData] = await db
    .select({
      totalArticles: sql<number>`count(distinct ${userProgress.articleId})`,
      totalTime: sql<number>`sum(${userProgress.timeSpent})`,
    })
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const [wordsData] = await db
    .select({
      totalWords: sql<number>`count(*)`,
    })
    .from(wordNotes)
    .where(eq(wordNotes.userId, userId));

  // 计算连续学习天数
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = stats?.currentStreak || 0;
  const lastStudyDate = stats?.lastStudyDate;

  if (lastStudyDate) {
    const lastStudyDay = new Date(lastStudyDate).toDateString();
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    if (lastStudyDay === todayString) {
      // 今天已经学习过，保持连续天数
    } else if (lastStudyDay === yesterdayString) {
      // 昨天学习过，连续天数+1
      currentStreak += 1;
    } else {
      // 中断了，重新开始
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const updateData = {
    totalArticlesRead: progressData.totalArticles || 0,
    totalWordsLearned: wordsData.totalWords || 0,
    totalTimeSpent: progressData.totalTime || 0,
    currentStreak,
    longestStreak: Math.max(currentStreak, stats?.longestStreak || 0),
    lastStudyDate: today,
    updatedAt: new Date(),
  };

  if (stats) {
    return await db
      .update(learningStats)
      .set(updateData)
      .where(eq(learningStats.userId, userId))
      .returning();
  } else {
    return await db
      .insert(learningStats)
      .values({
        userId,
        ...updateData,
        createdAt: new Date(),
      })
      .returning();
  }
}

export async function getLearningStats(userId: number) {
  const [stats] = await db
    .select()
    .from(learningStats)
    .where(eq(learningStats.userId, userId));
  
  return stats || null;
}