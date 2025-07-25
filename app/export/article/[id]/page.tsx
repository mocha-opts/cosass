import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/db/articles";
import { getWordNotes } from "@/lib/db/articles";
import { getParagraphTranslations } from "@/lib/db/articles";
import { getUser } from "@/lib/db/queries";
import PDFArticleViewer from "@/components/article/PDFArticleViewer";

interface ExportPageProps {
  params: {
    id: string;
  };
}

export default async function ExportPage({ params }: ExportPageProps) {
  const articleId = parseInt(params.id);

  if (isNaN(articleId)) {
    notFound();
  }

  try {
    const user = await getUser();
    if (!user) {
      notFound();
    }

    // 获取文章数据
    const article = await getArticleById(articleId);
    if (!article) {
      notFound();
    }

    // 获取笔记和翻译数据
    const [notes, translations] = await Promise.all([
      getWordNotes(articleId, user.id),
      getParagraphTranslations(articleId, user.id),
    ]);

    const contentArray = Array.isArray(article.content)
      ? article.content
      : typeof article.content === "string"
      ? JSON.parse(article.content)
      : [];

    return (
      <html lang="zh-CN">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{article.title || "文章导出"}</title>
          <style>{`
            /* 确保高亮颜色在打印时正确显示 */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* 隐藏不需要的元素 */
            .no-print { display: none !important; }

            /* 确保 mark 标签的高亮效果 */
            mark {
              background-color: inherit !important;
            }

            /* 打印样式 */
            @media print {
              body {
                margin: 0;
                padding: 20px;
                font-size: 12pt;
                line-height: 1.4;
              }
              .print-break { page-break-before: always; }
              .no-print { display: none !important; }
            }
          `}</style>
        </head>
        <body>
          <div className="export-container">
            <PDFArticleViewer
              content={contentArray}
              notes={notes}
              translations={translations}
              articleId={articleId}
              title={article.title}
              // 不传递 onBack 和 onShare，隐藏导航按钮
            />
          </div>
        </body>
      </html>
    );
  } catch (error) {
    console.error("Error loading article for export:", error);
    notFound();
  }
}
