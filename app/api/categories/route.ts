import { getCategories } from "@/lib/db/articles"; // 假设已有

export async function GET(req: Request) {
  const categories = await getCategories();

  return new Response(JSON.stringify(categories), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
