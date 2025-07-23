import { getUser } from "@/lib/db/queries";
import { updateUserProgress, updateLearningStats } from "@/lib/db/progress";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { articleId, readingProgress, timeSpent, isCompleted } = body;

    // 更新文章进度
    await updateUserProgress({
      userId: user.id,
      articleId,
      readingProgress,
      timeSpent,
      isCompleted,
    });

    // 更新学习统计
    await updateLearningStats(user.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to update progress:", error);
    return Response.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
