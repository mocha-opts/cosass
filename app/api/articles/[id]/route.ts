// pages/api/articles/[id].ts
import {
  getArticleById,
  getWordNotes,
  getParagraphTranslations,
} from "@/lib/db/articles";
import { getUserProgress } from "@/lib/db/progress";
import { getUser } from "@/lib/db/queries";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // 等待
  const articleId = parseInt(id);
  console.log("articleId", articleId);

  try {
    const user = await getUser();
    if (!user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const article = await getArticleById(articleId);
    if (!article) {
      return new Response(JSON.stringify({ message: "Article not found" }), {
        status: 404,
      });
    }

    const [notes, translations, progress] = await Promise.all([
      getWordNotes(articleId, user.id),
      getParagraphTranslations(articleId, user.id),
      getUserProgress(articleId, user.id),
    ]);

    return new Response(
      JSON.stringify({
        article,
        wordNotes: notes,
        paragraphTranslations: translations,
        progress,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Failed to fetch article data" }),
      { status: 500 }
    );
  }
}
