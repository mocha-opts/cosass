// pages/api/word-notes.ts
import { saveWordNote } from "@/lib/db/articles";
import { getUser } from "@/lib/db/queries";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleId, word, meaning, paragraphIndex, charIndex } =
      await req.json();

    if (!articleId || !word || !meaning || paragraphIndex === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await saveWordNote({
      userId: user.id,
      articleId,
      word,
      meaning,
      paragraphIndex,
      charIndex,
    });
    return Response.json({ message: "Word note saved" }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to save word note" },
      { status: 500 }
    );
  }
}
