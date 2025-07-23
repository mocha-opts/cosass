"use client";
import ArticleViewer from "@/components/article/ArticleViewer";
import WordNotePanel from "@/components/article/WordNotePanel";
import { PdfExport } from "@/components/article/PDFExport";
import useSWR from "swr";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// app/dashboard/articles/[id]/page.tsx

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const articleId = parseInt(id);
  const { data: articleData, error: articleError } = useSWR(
    !!articleId ? "/api/articles/" + articleId : null,
    fetcher
  );

  if (articleError) return <div>Failed to load</div>;
  if (!articleData) return <div>Loading...</div>;
  const { wordNotes, paragraphTranslations, article } = articleData || {};
  console.log("articleData", articleData, articleId);

  if (!article) return <div>Article not found</div>;

  // 兼容旧数据的处理
  const contentArray = Array.isArray(article.content)
    ? article.content
    : typeof article.content === "string"
    ? JSON.parse(article.content)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {article.title}
            </h1>
          </div>
          <PdfExport
            article={article}
            notes={wordNotes || []}
            translations={paragraphTranslations || []}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2">
            <ArticleViewer
              content={contentArray}
              notes={wordNotes || []}
              translations={paragraphTranslations || []}
              articleId={article.id}
            />
          </div>

          {/* Word Notes Panel */}
          <div className="lg:col-span-1">
            <WordNotePanel notes={wordNotes || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
