import { and, eq, sql } from "drizzle-orm";
import {
  articles,
  learningStats,
  paragraphTranslations,
  userProgress,
  wordNotes,
} from "./schema";
import { db } from "./drizzle";

export async function getArticleById(id: number) {
  const result = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });
  return result;
}

// 保存段落翻译
export const saveParagraphTranslation = async (
  userId: number,
  articleId: number,
  paragraphIndex: number,
  translation: string
) => {
  return await db.insert(paragraphTranslations).values({
    userId,
    articleId,
    paragraphIndex,
    translation,
  });
};

export async function updateParagraphTranslation(
  userId: number,
  articleId: number,
  paragraphIndex: number,
  translation: string
) {
  return await db
    .update(paragraphTranslations)
    .set({
      translation,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paragraphTranslations.userId, userId),
        eq(paragraphTranslations.articleId, articleId),
        eq(paragraphTranslations.paragraphIndex, paragraphIndex)
      )
    );
}

export async function getParagraphTranslation(
  userId: number,
  articleId: number,
  paragraphIndex: number
) {
  return await db.query.paragraphTranslations.findFirst({
    where: and(
      eq(paragraphTranslations.userId, userId),
      eq(paragraphTranslations.articleId, articleId),
      eq(paragraphTranslations.paragraphIndex, paragraphIndex)
    ),
  });
}

export async function getParagraphTranslations(
  articleId: number,
  userId: number
) {
  const results = await db
    .select()
    .from(paragraphTranslations)
    .where(
      and(
        eq(paragraphTranslations.articleId, articleId),
        eq(paragraphTranslations.userId, userId)
      )
    );

  return results; // 每段对应 translation, paragraphIndex
}
export async function getWordNotes(articleId: number, userId: number) {
  return await db.query.wordNotes.findMany({
    where: (w) => eq(w.articleId, articleId) && eq(w.userId, userId),
  });
}

export async function saveWordNote({
  articleId,
  userId,
  word,
  meaning,
  paragraphIndex,
  charIndex,
}: {
  articleId: number;
  userId: number;
  word: string;
  meaning: string;
  paragraphIndex: number;
  charIndex: number;
}) {
  try {
    console.log("=== saveWordNote function called ===");
    console.log("Parameters:", {
      articleId,
      userId,
      word,
      meaning,
      paragraphIndex,
      charIndex,
    });

    const result = await db
      .insert(wordNotes)
      .values({
        articleId,
        userId,
        word,
        meaning,
        paragraphIndex,
        charIndex,
      })
      .returning();

    console.log("Insert result:", result);
    return result[0];
  } catch (error) {
    console.error("Database insert error:", error);
    throw error;
  }
}

export async function getCategories() {
  return await db.query.categories.findMany();
}

export async function getArticlesByCategoryId(categoryId: number) {
  console.log("Fetching articles for category:", categoryId); // 打印查询的 categoryId

  return await db.query.articles.findMany({
    where: eq(articles.categoryId, categoryId),
  });
}
