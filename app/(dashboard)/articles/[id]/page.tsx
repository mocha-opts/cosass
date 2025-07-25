"use client";
import PDFArticleViewer from "@/components/article/PDFArticleViewer";
import useSWR from "swr";
import { use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const articleId = parseInt(id);
  const { data: articleData, error: articleError } = useSWR(
    !!articleId ? "/api/articles/" + articleId : null,
    fetcher
  );

  // 分享功能
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("已复制文章链接！");
  };

  if (articleError) return <div>Failed to load</div>;
  if (!articleData)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载文章中...</p>
        </div>
      </div>
    );

  const { wordNotes, paragraphTranslations, article } = articleData || {};

  if (!article) return <div>Article not found</div>;

  const contentArray = Array.isArray(article.content)
    ? article.content
    : typeof article.content === "string"
    ? JSON.parse(article.content)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-6">
        {/* 主要内容区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PDFArticleViewer
            content={contentArray}
            notes={wordNotes || []}
            translations={paragraphTranslations || []}
            articleId={article.id}
            title={article.title}
            onBack={() => router.push("/articles")}
            onShare={handleShare}
          />
        </motion.div>
      </div>
    </div>
  );
}
