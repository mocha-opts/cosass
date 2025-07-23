// pages/api/paragraph-translations.ts
import {
  getParagraphTranslation,
  saveParagraphTranslation,
  updateParagraphTranslation,
} from "@/lib/db/articles";

export async function POST(req: Request) {
  const { userId, articleId, paragraphIndex, translation } = await req.json();

  try {
    const existingTranslation = await getParagraphTranslation(
      userId,
      articleId,
      paragraphIndex
    );
    let newTranslation;
    if (existingTranslation) {
      newTranslation = await updateParagraphTranslation(
        userId,
        articleId,
        paragraphIndex,
        translation
      );
    } else {
      newTranslation = await saveParagraphTranslation(
        userId,
        articleId,
        paragraphIndex,
        translation
      );
    }

    return new Response(
      JSON.stringify({
        message: "Paragraph translation saved",
        translation: newTranslation,
      }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Failed to save paragraph translation" }),
      { status: 500 }
    );
  }
}
