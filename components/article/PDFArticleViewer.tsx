"use client";

import { useState, useRef, useEffect, JSX } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  pdf,
  Font,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Share2,
  Eye,
  Volume2,
  MessageSquare,
  Loader2,
  PenLine,
  Trash2,
} from "lucide-react";
import { WordNote, ParagraphTranslation } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import { BallSelector } from "./BallSelector";
import { usePDFViewerStore } from "@/lib/stores/pdf-viewer-store";
import { NotesPanel } from "./pdf-viewer/NotesPanel";
import { HighlightMatcher } from "@/lib/utils/highlight-matcher";

Font.register({
  family: "Noto Sans SC Regular",
  src: "/static/fonts/Noto_Sans_SC/static/NotoSansSC-Regular.ttf",
});

Font.register({
  family: "Noto Sans SC Medium",
  src: "/static/fonts/Noto_Sans_SC/static/NotoSansSC-Medium.ttf",
});

// 定义 PDF 样式
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  contentSection: {
    flex: 2,
    marginRight: 20,
  },
  notesSection: {
    flex: 1,
    borderLeft: "1px solid #e5e7eb",
    paddingLeft: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1f2937",
    fontFamily: "Noto Sans SC Medium",
  },
  section: {
    marginBottom: 15,
  },
  englishText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 1.5,
    color: "#374151",
    textAlign: "justify",
    fontFamily: "Noto Sans SC Regular",
  },
  chineseText: {
    fontSize: 12,
    marginBottom: 12,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 1.4,
    textAlign: "justify",
    fontFamily: "Noto Sans SC Regular",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 16,
    marginTop: 25,
    marginBottom: 15,
    fontWeight: "bold",
    color: "#1f2937",
    fontFamily: "Noto Sans SC Medium",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 5,
  },
  noteItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  originalText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#2563eb",
    marginBottom: 4,
    fontFamily: "Noto Sans SC Medium",
  },
  translationText: {
    fontSize: 11,
    color: "#374151",
    marginBottom: 2,
    fontFamily: "Noto Sans SC Regular",
  },
  noteDate: {
    fontSize: 10,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  paragraphTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#1f2937",
    fontFamily: "Noto Sans SC Medium",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
    fontFamily: "Noto Sans SC Regular",
  },
});

const sendRequest = async (url: string, { arg }: { arg: any }) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

interface PDFArticleViewerProps {
  content: string[];
  notes: WordNote[];
  translations: ParagraphTranslation[];
  articleId: number;
  progress?: any;
  title?: string;
  onBack?: () => void;
  onShare?: () => void;
}

// PDF 文档组件
function ArticlePDFDocument({
  title,
  content,
  notes,
  translations,
}: {
  title?: string;
  content: string[];
  notes: WordNote[];
  translations: ParagraphTranslation[];
}) {
  // 按段落分组笔记
  const notesByParagraph = notes.reduce((acc, note) => {
    const paragraphIndex = note.paragraphIndex;
    if (!acc[paragraphIndex]) {
      acc[paragraphIndex] = [];
    }
    acc[paragraphIndex].push(note);
    return acc;
  }, {} as Record<number, WordNote[]>);

  // 按段落索引排序
  const sortedParagraphs = Object.keys(notesByParagraph)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 左侧内容区域 */}
        <View style={styles.contentSection}>
          {/* 标题 */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* 文章内容 */}
          {content.map((paragraph, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.englishText}>{paragraph}</Text>
              {translations.find((t) => t.paragraphIndex === index) && (
                <Text style={styles.chineseText}>
                  {
                    translations.find((t) => t.paragraphIndex === index)
                      ?.translation
                  }
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* 右侧笔记区域 */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>单词笔记</Text>
          {notes.length === 0 ? (
            <Text
              style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}
            >
              暂无笔记
            </Text>
          ) : (
            sortedParagraphs.map((paragraphIndex) => (
              <View key={paragraphIndex} style={{ marginBottom: 12 }}>
                {/* 段落分组标题 */}
                <Text style={styles.paragraphTitle}>
                  第 {paragraphIndex + 1} 段
                </Text>

                {/* 该段落的笔记 */}
                {notesByParagraph[paragraphIndex].map((note) => (
                  <View key={note.id} style={styles.noteItem}>
                    <Text style={styles.originalText}>{note.word}</Text>
                    <Text style={styles.translationText}>{note.meaning}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* 页码 */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export default function PDFArticleViewer({
  content,
  notes,
  translations,
  articleId,
  progress,
  title,
  onBack,
  onShare,
}: PDFArticleViewerProps) {
  const {
    showPDF,
    setShowPDF,
    articleFont,
    notesFont,
    lineSpacing,
    setArticleFont,
    setNotesFont,
    setLineSpacing,
    isGenerating,
    setIsGenerating,
    selectedHighlightColor,
    setSelectedHighlightColor,
    popoverOpen,
    setPopoverOpen,
    popoverPosition,
    setPopoverPosition,
    selectedText,
    setSelectedText,
    selectedParagraph,
    setSelectedParagraph,
    noteText,
    setNoteText,
    translationText,
    setTranslationText,
    showTranslateButton,
    setShowTranslateButton,
    isAutoTranslating,
    setIsAutoTranslating,
  } = usePDFViewerStore();

  const contentRef = useRef<HTMLDivElement>(null);

  // 高亮颜色选项
  const highlightColors = [
    {
      name: "yellow",
      label: "黄色",
      class: "bg-yellow-200 dark:bg-yellow-800",
      border: "border-yellow-300",
    },
    {
      name: "green",
      label: "绿色",
      class: "bg-green-200 dark:bg-green-800",
      border: "border-green-300",
    },
    {
      name: "blue",
      label: "蓝色",
      class: "bg-blue-200 dark:bg-blue-800",
      border: "border-blue-300",
    },
    {
      name: "pink",
      label: "粉色",
      class: "bg-pink-200 dark:bg-pink-800",
      border: "border-pink-300",
    },
    {
      name: "purple",
      label: "紫色",
      class: "bg-purple-200 dark:bg-purple-800",
      border: "border-purple-300",
    },
    {
      name: "orange",
      label: "橙色",
      class: "bg-orange-200 dark:bg-orange-800",
      border: "border-orange-300",
    },
  ];

  const {
    trigger: translate,
    data: translationData,
    error: translationError,
    isMutating: isTranslating,
  } = useSWRMutation("/api/translation", sendRequest);

  const {
    trigger: saveNotes,
    error: saveNotesError,
    isMutating: isSavingNote,
  } = useSWRMutation("/api/word-notes/save", sendRequest);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <ArticlePDFDocument
          title={title}
          content={content}
          notes={notes}
          translations={translations}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "article"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateCharIndex = (range: Range, paragraphIndex: number): number => {
    try {
      const paragraphElement = document.querySelector(
        `[data-paragraph-index="${paragraphIndex}"]`
      );
      if (!paragraphElement) {
        console.warn(`Paragraph element not found for index ${paragraphIndex}`);
        return 0;
      }

      // 创建一个从段落开始到选择开始的范围
      const rangeFromStart = document.createRange();
      rangeFromStart.setStart(paragraphElement, 0);
      rangeFromStart.setEnd(range.startContainer, range.startOffset);

      // 获取选择位置之前的文本
      const textBeforeSelection = rangeFromStart.toString();
      const charIndex = textBeforeSelection.length;

      console.log(
        `Calculated char index: ${charIndex} for word at position ${range.startOffset}`
      );
      return charIndex;
    } catch (error) {
      console.error("Failed to calculate char index:", error);
      return 0;
    }
  };

  const extractSelectionContext = (range: Range, paragraphIndex: number) => {
    try {
      const paragraphElement = document.querySelector(
        `[data-paragraph-index="${paragraphIndex}"]`
      );
      if (!paragraphElement) {
        return {
          selectedText: "",
          contextBefore: "",
          contextAfter: "",
          textLength: 0,
        };
      }

      const paragraphText = paragraphElement.textContent || "";
      const selectedText = range.toString();
      const charIndex = calculateCharIndex(range, paragraphIndex);

      // 使用HighlightMatcher提取上下文
      const { contextBefore, contextAfter } = HighlightMatcher.extractContext(
        paragraphText,
        charIndex,
        charIndex + selectedText.length,
        50 // 上下文长度
      );

      return {
        selectedText,
        contextBefore,
        contextAfter,
        textLength: selectedText.length,
      };
    } catch (error) {
      console.error("Failed to extract selection context:", error);
      return {
        selectedText: "",
        contextBefore: "",
        contextAfter: "",
        textLength: 0,
      };
    }
  };

  // BallSelector 回调函数
  const handleBallClick = ({
    text,
    rect,
    range,
    paragraphIndex,
  }: {
    text: string;
    rect: DOMRect;
    range: Range;
    paragraphIndex?: number;
  }) => {
    setSelectedText(text);
    setSelectedParagraph(paragraphIndex ?? 0);
    setPopoverPosition({
      x: rect.right + 12,
      y: rect.top - 32,
    });
    setPopoverOpen(true);
    setShowTranslateButton(true);
    setTranslationText("");
  };

  const handleTranslateClick = async () => {
    if (!selectedText) return;
    setIsAutoTranslating(true);
    setShowTranslateButton(false);

    try {
      const result = await translate({ text: selectedText });
      setTranslationText(result?.translation || "");
    } catch (error) {
      console.error("Translation failed:", error);
      setTranslationText("翻译失败，请重试");
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedText || !translationText) return;

    try {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);

      if (!range) {
        console.error("No selection range found");
        return;
      }

      // 获取上下文信息
      const contextInfo = extractSelectionContext(range, selectedParagraph);
      const charIndex = calculateCharIndex(range, selectedParagraph);

      await saveNotes({
        articleId,
        word: selectedText,
        meaning: translationText,
        paragraphIndex: selectedParagraph,
        charIndex,
        highlightColor: selectedHighlightColor,
        selectedText: contextInfo.selectedText,
        contextBefore: contextInfo.contextBefore,
        contextAfter: contextInfo.contextAfter,
        textLength: contextInfo.textLength,
      });

      mutate(`/api/articles/${articleId}`);
      setSelectedText("");
      setNoteText("");
      setTranslationText("");
      setPopoverOpen(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const playTTS = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // 定位到对应笔记
  const scrollToNote = (noteId: number) => {
    const noteElement = document.getElementById(`note-${noteId}`);
    if (noteElement) {
      noteElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // 添加高亮效果
      noteElement.classList.add("ring-2", "ring-blue-400", "ring-opacity-75");
      setTimeout(() => {
        noteElement.classList.remove(
          "ring-2",
          "ring-blue-400",
          "ring-opacity-75"
        );
      }, 2000);
    }
  };

  // 自定义高亮组件
  const CustomHighlighter = ({
    paragraph,
    paragraphIndex,
  }: {
    paragraph: string;
    paragraphIndex: number;
  }) => {
    const paragraphNotes = notes.filter(
      (note) => note.paragraphIndex === paragraphIndex
    );

    if (paragraphNotes.length === 0) {
      return (
        <span
          style={{
            userSelect: "text",
            fontFamily: articleFont.family,
            fontSize: `${articleFont.size}px`,
            color: articleFont.color,
            lineHeight: lineSpacing.article,
          }}
        >
          {paragraph}
        </span>
      );
    }

    // 按字符位置排序，确保正确的渲染顺序
    const sortedNotes = paragraphNotes.sort(
      (a, b) => (a.charIndex || 0) - (b.charIndex || 0)
    );

    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedNotes.forEach((note) => {
      const startPos = note.charIndex || 0;
      const endPos = startPos + (note.word?.length || 0);

      // 确保位置有效
      if (startPos < 0 || endPos > paragraph.length || startPos >= endPos) {
        return;
      }

      // 添加开始位置之前的文本
      if (startPos > lastIndex) {
        elements.push(
          <span
            key={`text-${lastIndex}`}
            style={{
              userSelect: "text",
              fontFamily: articleFont.family,
              fontSize: `${articleFont.size}px`,
              color: articleFont.color,
              lineHeight: lineSpacing.article,
            }}
          >
            {paragraph.substring(lastIndex, startPos)}
          </span>
        );
      }

      // 添加高亮文本
      elements.push(
        <mark
          key={`highlight-${note.id}`}
          style={{
            backgroundColor: `var(--highlight-${
              note.highlightColor || "yellow"
            })`,
            border: "none",
            padding: "0",
            margin: "0",
            borderRadius: "2px",
            cursor: "pointer",
            userSelect: "text",
            fontFamily: articleFont.family,
            fontSize: `${articleFont.size}px`,
            color: articleFont.color,
            lineHeight: lineSpacing.article,
          }}
          className="transition-opacity hover:opacity-75"
          onClick={() => scrollToNote(note.id)}
          title={`点击定位笔记: ${note.meaning}`}
        >
          {paragraph.substring(startPos, endPos)}
        </mark>
      );

      lastIndex = endPos;
    });

    // 添加剩余文本
    if (lastIndex < paragraph.length) {
      elements.push(
        <span
          key={`text-${lastIndex}`}
          style={{
            userSelect: "text",
            fontFamily: articleFont.family,
            fontSize: `${articleFont.size}px`,
            color: articleFont.color,
            lineHeight: lineSpacing.article,
          }}
        >
          {paragraph.substring(lastIndex)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* 工具栏 */}
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
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-1" />
                分享
              </Button>
            )}
          </div>

          {/* 中间标题 */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || "文章阅读器"}
            </h1>
          </div>

          {/* 右侧控制区域 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 文章字体设置 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                文章字体
              </Badge>
              <select
                value={articleFont.family}
                onChange={(e) => setArticleFont({ family: e.target.value })}
                className="text-xs border rounded px-2 py-1 min-w-[80px]"
                title="选择文章字体类型"
              >
                <option value="system-ui">系统默认</option>
                <option value="serif">衬线字体</option>
                <option value="sans-serif">无衬线字体</option>
                <option value="monospace">等宽字体</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
              </select>
              <select
                value={articleFont.size}
                onChange={(e) =>
                  setArticleFont({ size: Number(e.target.value) })
                }
                className="text-xs border rounded px-2 py-1 w-16"
                title="选择文章字体大小"
              >
                {[10, 12, 14, 16, 18, 20, 22, 24].map((size) => (
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
                {[1.0, 1.2, 1.5, 1.8, 2.0, 2.5].map((spacing) => (
                  <option key={spacing} value={spacing}>
                    {spacing}
                  </option>
                ))}
              </select>
            </div>

            {/* 笔记字体设置 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                笔记字体
              </Badge>
              <select
                value={notesFont.family}
                onChange={(e) => setNotesFont({ family: e.target.value })}
                className="text-xs border rounded px-2 py-1 min-w-[80px]"
                title="选择笔记字体类型"
              >
                <option value="system-ui">系统默认</option>
                <option value="serif">衬线字体</option>
                <option value="sans-serif">无衬线字体</option>
                <option value="monospace">等宽字体</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
              </select>
              <select
                value={notesFont.size}
                onChange={(e) => setNotesFont({ size: Number(e.target.value) })}
                className="text-xs border rounded px-2 py-1 w-16"
                title="选择笔记字体大小"
              >
                {[10, 12, 14, 16, 18, 20, 22, 24].map((size) => (
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
                {[1.0, 1.2, 1.5, 1.8, 2.0, 2.5].map((spacing) => (
                  <option key={spacing} value={spacing}>
                    {spacing}
                  </option>
                ))}
              </select>
            </div>

            {/* 高亮颜色选择器 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
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

            {/* PDF和下载按钮 */}
            <div className="flex items-center gap-2">
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
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="hover:bg-green-50 hover:border-green-300"
              >
                <Download className="w-4 h-4 mr-1" />
                {isGenerating ? "生成中..." : "下载 PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-none mx-auto flex gap-6">
        {/* 左侧文章内容 */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-6">
              {showPDF ? (
                <div className="h-[800px] border border-gray-200 rounded-lg overflow-hidden">
                  <PDFViewer width="100%" height="100%">
                    <ArticlePDFDocument
                      title={title}
                      content={content}
                      notes={notes}
                      translations={translations}
                    />
                  </PDFViewer>
                </div>
              ) : (
                <div ref={contentRef} className="space-y-6">
                  {title && (
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
                      {title}
                    </h1>
                  )}

                  <div className="space-y-6">
                    {content.map((paragraph, index) => (
                      <div key={index} className="space-y-4">
                        {/* 英文段落 */}
                        <div
                          data-paragraph-index={index}
                          className="select-text cursor-text"
                          style={{
                            fontFamily: articleFont.family,
                            fontSize: `${articleFont.size}px`,
                            color: articleFont.color,
                            lineHeight: lineSpacing.article,
                          }}
                        >
                          <CustomHighlighter
                            paragraph={paragraph}
                            paragraphIndex={index}
                          />
                        </div>

                        {/* 中文翻译 */}
                        {translations.find(
                          (t) => t.paragraphIndex === index
                        ) && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 border-blue-400">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {
                                translations.find(
                                  (t) => t.paragraphIndex === index
                                )?.translation
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧笔记面板 */}
        <div className="w-80 flex-shrink-0">
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-3">
              <NotesPanel
                notes={notes}
                onNoteClick={scrollToNote}
                onPlayTTS={playTTS}
              />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Selection Popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            style={{
              position: "fixed",
              left: popoverPosition.x,
              top: popoverPosition.y,
              pointerEvents: "none",
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          id="popover-content"
          className="w-80 p-0 border-0 shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm"
          align="center"
        >
          <div className="p-4 space-y-4">
            <div className="relative">
              <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">
                选中文本
              </h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  "{selectedText}"
                </p>
              </div>
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                高亮颜色
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {highlightColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedHighlightColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                翻译
              </label>

              {showTranslateButton && (
                <div className="text-center py-4">
                  <Button
                    onClick={handleTranslateClick}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    点击翻译 "
                    {selectedText.length > 20
                      ? selectedText.substring(0, 20) + "..."
                      : selectedText}
                    "
                  </Button>
                </div>
              )}

              {isAutoTranslating && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">翻译中...</span>
                  </div>
                </div>
              )}

              {translationText && (
                <Input
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  placeholder="翻译结果"
                  className="border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-400/20"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                笔记 <span className="text-gray-400">(可选)</span>
              </label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="添加个人笔记..."
                rows={3}
                className="border-gray-200 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveNote}
                disabled={!selectedText || !translationText || isSavingNote}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {isSavingNote ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <PenLine className="w-4 h-4 mr-2" />
                    保存笔记
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPopoverOpen(false)}
                className="border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* BallSelector 组件 */}
      {!showPDF && (
        <BallSelector containerRef={contentRef} onBallClick={handleBallClick} />
      )}
    </div>
  );
}
