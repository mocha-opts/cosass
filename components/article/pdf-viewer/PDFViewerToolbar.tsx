"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Download, Eye } from "lucide-react";
import { usePDFViewerStore } from "@/lib/stores/pdf-viewer-store";

interface PDFViewerToolbarProps {
  title?: string;
  onBack?: () => void;
  onShare?: () => void;
  onDownloadPDF: () => void;
}

const fontFamilies = [
  { value: "system-ui", label: "系统默认" },
  { value: "serif", label: "衬线字体" },
  { value: "sans-serif", label: "无衬线字体" },
  { value: "monospace", label: "等宽字体" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
];

const fontSizes = [10, 12, 14, 16, 18, 20, 22, 24];

const lineSpacingOptions = [
  { value: 1.0, label: "1.0" },
  { value: 1.2, label: "1.2" },
  { value: 1.5, label: "1.5" },
  { value: 1.8, label: "1.8" },
  { value: 2.0, label: "2.0" },
  { value: 2.5, label: "2.5" },
];

const highlightColors = [
  {
    name: "yellow",
    label: "黄色",
    class: "bg-yellow-200 dark:bg-yellow-800",
  },
  {
    name: "green",
    label: "绿色",
    class: "bg-green-200 dark:bg-green-800",
  },
  {
    name: "blue",
    label: "蓝色",
    class: "bg-blue-200 dark:bg-blue-800",
  },
  {
    name: "pink",
    label: "粉色",
    class: "bg-pink-200 dark:bg-pink-800",
  },
  {
    name: "purple",
    label: "紫色",
    class: "bg-purple-200 dark:bg-purple-800",
  },
  {
    name: "orange",
    label: "橙色",
    class: "bg-orange-200 dark:bg-orange-800",
  },
];

export default function PDFViewerToolbar({
  title,
  onBack,
  onShare,
  onDownloadPDF,
}: PDFViewerToolbarProps) {
  const {
    showPDF,
    isGenerating,
    selectedHighlightColor,
    articleFont,
    notesFont,
    lineSpacing,
    setShowPDF,
    setSelectedHighlightColor,
    setArticleFont,
    setNotesFont,
    setLineSpacing,
  } = usePDFViewerStore();

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 border-b shadow-sm">
      <div className="flex items-center justify-between">
        {/* 左侧操作按钮 */}
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
        </div>

        {/* 中间标题 */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || "文章阅读器"}
          </h1>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 文章字体设置 */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              文章字体
            </Badge>
            <select
              value={articleFont.family}
              onChange={(e) => setArticleFont({ family: e.target.value })}
              className="text-xs border rounded px-2 py-1"
              title="选择文章字体类型"
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <select
              value={articleFont.size}
              onChange={(e) => setArticleFont({ size: Number(e.target.value) })}
              className="text-xs border rounded px-2 py-1 w-16"
              title="选择文章字体大小"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <input
              type="color"
              value={articleFont.color}
              onChange={(e) => setArticleFont({ color: e.target.value })}
              className="w-6 h-6 border rounded cursor-pointer"
              title="文章字体颜色"
            />
            <select
              value={lineSpacing.article}
              onChange={(e) =>
                setLineSpacing({ article: Number(e.target.value) })
              }
              className="text-xs border rounded px-2 py-1 w-16"
              title="文章行距"
            >
              {lineSpacingOptions.map((spacing) => (
                <option key={spacing.value} value={spacing.value}>
                  {spacing.label}
                </option>
              ))}
            </select>
          </div>

          {/* 笔记字体设置 */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              笔记字体
            </Badge>
            <select
              value={notesFont.family}
              onChange={(e) => setNotesFont({ family: e.target.value })}
              className="text-xs border rounded px-2 py-1"
              title="选择笔记字体类型"
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
            <select
              value={notesFont.size}
              onChange={(e) => setNotesFont({ size: Number(e.target.value) })}
              className="text-xs border rounded px-2 py-1 w-16"
              title="选择笔记字体大小"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <input
              type="color"
              value={notesFont.color}
              onChange={(e) => setNotesFont({ color: e.target.value })}
              className="w-6 h-6 border rounded cursor-pointer"
              title="笔记字体颜色"
            />
            <select
              value={lineSpacing.notes}
              onChange={(e) =>
                setLineSpacing({ notes: Number(e.target.value) })
              }
              className="text-xs border rounded px-2 py-1 w-16"
              title="笔记行距"
            >
              {lineSpacingOptions.map((spacing) => (
                <option key={spacing.value} value={spacing.value}>
                  {spacing.label}
                </option>
              ))}
            </select>
          </div>

          {/* 高亮颜色选择器 */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              笔刷颜色
            </Badge>
            <div className="flex items-center gap-1">
              {highlightColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedHighlightColor(color.name)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    color.class
                  } ${
                    selectedHighlightColor === color.name
                      ? "border-gray-800 dark:border-gray-200 scale-110"
                      : "border-gray-300 dark:border-gray-600 hover:scale-105"
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPDF(!showPDF)}
            className={showPDF ? "bg-blue-50 border-blue-300" : ""}
          >
            <Eye className="w-4 h-4 mr-1" />
            {showPDF ? "隐藏" : "预览"} PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadPDF}
            disabled={isGenerating}
            className="hover:bg-green-50 hover:border-green-300"
          >
            <Download className="w-4 h-4 mr-1" />
            {isGenerating ? "生成中..." : "下载 PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
