"use client";

import { useState, useRef, useEffect, JSX } from "react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import Highlighter from "react-highlight-words";
import { motion } from "framer-motion";
import { BallSelector } from "./BallSelector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  MessageSquare,
  Loader2,
  PenLine,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  Share2,
} from "lucide-react";
import { WordNote, ParagraphTranslation } from "@/lib/db/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PdfExport } from "@/components/article/PDFExport";

interface ArticleViewerProps {
  content: string[];
  notes: WordNote[];
  translations: ParagraphTranslation[];
  articleId: number;
  progress?: any;
  title?: string; // 新增
  onBack?: () => void; // 新增
  onShare?: () => void; // 新增
  pdfExportProps?: any; // 新增
}

interface Page {
  paragraphs: Array<{
    index: number;
    content: string;
    translation?: ParagraphTranslation;
  }>;
  notes: WordNote[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
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
export default function ArticleViewer({
  content,
  notes,
  translations,
  articleId,
  progress,
  title,
  onBack,
  onShare,
  pdfExportProps,
}: ArticleViewerProps) {
  const [selectedText, setSelectedText] = useState("");
  const [selectedParagraph, setSelectedParagraph] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [noteText, setNoteText] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [startTime] = useState(Date.now());
  const [charIndex, setCharIndex] = useState(0);
  const [showTranslateButton, setShowTranslateButton] = useState(false);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedHighlightColor, setSelectedHighlightColor] =
    useState("yellow");

  // 新增状态：控制缩略图显示
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showFloatingBall, setShowFloatingBall] = useState(false); // 新增

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

  const getHighlightClass = (color: string) => {
    const colorConfig = highlightColors.find((c) => c.name === color);
    return colorConfig
      ? `bg-${color}-200/30 dark:bg-${color}-800/30`
      : "bg-yellow-200/30 dark:bg-yellow-800/30";
  };

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

  // 分页逻辑 - 自适应A4纸张内容
  useEffect(() => {
    // A4纸张的估算容量（考虑到布局、间距、字体大小等因素）
    const ESTIMATED_LINES_PER_PAGE = 35; // A4纸大约能容纳的行数
    const AVERAGE_CHARS_PER_LINE = 80; // 每行平均字符数
    const ESTIMATED_CHARS_PER_PAGE =
      ESTIMATED_LINES_PER_PAGE * AVERAGE_CHARS_PER_LINE;

    const newPages: Page[] = [];
    let currentPageParagraphs: Array<{
      index: number;
      content: string;
      translation?: ParagraphTranslation;
    }> = [];
    let currentPageCharCount = 0;
    let currentPageStartIndex = 0;

    content.forEach((paragraph, index) => {
      // 计算段落占用的估算行数（包括翻译）
      const translation = translations.find((t) => t.paragraphIndex === index);
      const paragraphLines = Math.ceil(
        paragraph.length / AVERAGE_CHARS_PER_LINE
      );
      const translationLines = translation
        ? Math.ceil(translation.translation.length / AVERAGE_CHARS_PER_LINE)
        : 0;
      const totalLines = paragraphLines + translationLines + 2; // +2 为段落间距

      const estimatedChars = totalLines * AVERAGE_CHARS_PER_LINE;

      // 如果添加当前段落会超过A4页面容量，且当前页面不为空，则创建新页面
      if (
        currentPageCharCount + estimatedChars > ESTIMATED_CHARS_PER_PAGE &&
        currentPageParagraphs.length > 0
      ) {
        // 获取当前页面相关的笔记
        const pageNotes = notes.filter((note) => {
          const paragraphIndex = note.paragraphIndex;
          return (
            paragraphIndex >= currentPageStartIndex && paragraphIndex < index
          );
        });

        newPages.push({
          paragraphs: currentPageParagraphs,
          notes: pageNotes,
        });

        // 重置当前页面
        currentPageParagraphs = [];
        currentPageCharCount = 0;
        currentPageStartIndex = index;
      }

      // 添加当前段落到当前页面
      currentPageParagraphs.push({
        index,
        content: paragraph,
        translation: translations.find((t) => t.paragraphIndex === index),
      });
      currentPageCharCount += estimatedChars;
    });

    // 添加最后一页（如果有内容）
    if (currentPageParagraphs.length > 0) {
      const pageNotes = notes.filter((note) => {
        const paragraphIndex = note.paragraphIndex;
        return paragraphIndex >= currentPageStartIndex;
      });

      newPages.push({
        paragraphs: currentPageParagraphs,
        notes: pageNotes,
      });
    }

    setPages(newPages);
  }, [content, notes, translations]);

  // 自动保存进度
  useEffect(() => {
    const saveProgress = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const totalPages = pages.length;
      const progressPercent =
        totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          readingProgress: progressPercent,
          timeSpent,
          isCompleted: progressPercent >= 100,
        }),
      });
    };

    const interval = setInterval(saveProgress, 30000);
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveProgress();
    };
  }, [articleId, currentPage, pages.length, startTime]);

  const contentRef = useRef<HTMLDivElement>(null);

  const calculateCharIndex = (range: Range, paragraphIndex: number): number => {
    try {
      const paragraphElement = document.querySelector(
        `[data-paragraph-index="${paragraphIndex}"]`
      );
      if (!paragraphElement) return 0;

      const rangeFromStart = document.createRange();
      rangeFromStart.setStart(paragraphElement, 0);
      rangeFromStart.setEnd(range.startContainer, range.startOffset);
      const textBeforeSelection = rangeFromStart.toString();
      return textBeforeSelection.length;
    } catch (error) {
      console.error("Failed to calculate char index:", error);
      return 0;
    }
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
      await saveNotes({
        articleId,
        word: selectedText,
        meaning: translationText,
        paragraphIndex: selectedParagraph,
        charIndex,
        highlightColor: selectedHighlightColor, // 保存选中的颜色
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

  const getHighlightWords = (paragraphIndex: number) => {
    return notes
      .filter((note) => note.paragraphIndex === paragraphIndex)
      .map((note) => ({
        word: note.word,
        color: note.highlightColor || "yellow",
      }));
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
      return <span style={{ userSelect: "text" }}>{paragraph}</span>;
    }

    const sortedNotes = paragraphNotes.sort(
      (a, b) => a.charIndex - b.charIndex
    );

    const elements: JSX.Element[] = [];
    let lastIndex = 0;

    sortedNotes.forEach((note) => {
      const startPos = note.charIndex;
      const endPos = startPos + note.word.length;

      if (startPos > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`} style={{ userSelect: "text" }}>
            {paragraph.substring(lastIndex, startPos)}
          </span>
        );
      }

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

    if (lastIndex < paragraph.length) {
      elements.push(
        <span key={`text-${lastIndex}`} style={{ userSelect: "text" }}>
          {paragraph.substring(lastIndex)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  if (pages.length === 0) {
    return <div>Loading...</div>;
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="space-y-8 min-h-screen">
      {/* 工具栏：进度条和分页控制 + 操作按钮 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          {/* 左侧操作按钮 */}
          <div className="flex items-center gap-2 mr-6">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> 返回
              </Button>
            )}
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-1" /> 分享
              </Button>
            )}
            {pdfExportProps && <PdfExport {...pdfExportProps} />}
          </div>
          {/* 原有分页与颜色选择等内容 */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">页面:</span>
            <div className="flex items-center gap-2">
              {/* 缩略图切换按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={showThumbnails ? "bg-blue-50 border-blue-300" : ""}
              >
                <BookOpen className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                {currentPage + 1} / {pages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(pages.length - 1, currentPage + 1))
                }
                disabled={currentPage === pages.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 颜色选择器 */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">笔刷颜色:</span>
            <div className="flex items-center gap-2">
              {highlightColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedHighlightColor(color.name)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
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

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">阅读进度:</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-32">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(
                    ((currentPage + 1) / pages.length) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {Math.round(((currentPage + 1) / pages.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* A4纸张式布局 */}
      <div className="max-w-none mx-auto flex gap-6">
        {/* 左侧缩略图面板 */}
        {showThumbnails && (
          <div>
            <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 p-3 pb-2 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-medium">页面</span>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {pages.map((page, index) => (
                    <motion.div
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg `}
                      onClick={() => setCurrentPage(index)}
                    >
                      <div
                        className={`w-full h-36 bg-white dark:bg-gray-800 border rounded-lg p-2 overflow-hidden ${
                          currentPage === index
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {/* 缩略图内容预览 */}
                        <div className="space-y-1 mb-2">
                          {page.paragraphs
                            .slice(0, 4)
                            .map((paragraph, pIndex) => (
                              <div
                                key={pIndex}
                                className={`h-1.5 rounded ${
                                  currentPage === index
                                    ? "bg-blue-200 dark:bg-blue-700"
                                    : "bg-gray-200 dark:bg-gray-600"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (paragraph.content.length / 120) * 100 + 20
                                  )}%`,
                                }}
                              />
                            ))}
                          {page.paragraphs.length > 4 && (
                            <div className="text-xs text-gray-400 text-center pt-1">
                              +{page.paragraphs.length - 4}
                            </div>
                          )}
                        </div>

                        {/* 页面信息 */}
                        <div className="text-center">
                          <div
                            className={`text-xs font-medium ${
                              currentPage === index
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            第 {index + 1} 页
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {page.paragraphs.length} 段
                          </div>
                          {page.notes.length > 0 && (
                            <div className="text-xs text-orange-500 mt-1">
                              {page.notes.length} 笔记
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* 主要内容区域 */}
        <div
          ref={contentRef}
          className="bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 mx-auto"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "15mm",
          }}
        >
          {/* 左侧：标题+内容，纵向排列 */}
          <div className="flex flex-col col-span-1" style={{ gridColumn: 1 }}>
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
                {title}
              </h1>
            )}
            <div className="space-y-6">
              {currentPageData.paragraphs.map((paragraph, index) => (
                <div className="space-y-4">
                  {/* 英文段落 */}
                  <div
                    data-paragraph-index={paragraph.index}
                    className="text-base leading-relaxed text-gray-800 dark:text-gray-200 select-text cursor-text font-medium"
                  >
                    <CustomHighlighter
                      paragraph={paragraph.content}
                      paragraphIndex={paragraph.index}
                    />
                  </div>

                  {/* 中文翻译 */}
                  {paragraph.translation && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border-l-4 border-blue-400">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {paragraph.translation.translation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* 右侧单词笔记 */}
          <div className="border-l border-gray-200 dark:border-gray-600 pl-4">
            <div className="sticky top-0">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium text-sm">单词笔记</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {currentPageData.notes.length}
                </Badge>
              </div>

              {currentPageData.notes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">本页暂无笔记</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPageData.notes
                    .sort((a, b) => {
                      // 优先按段落排序，其次按字符位置排序
                      if (a.paragraphIndex !== b.paragraphIndex) {
                        return a.paragraphIndex - b.paragraphIndex;
                      }
                      return a.charIndex - b.charIndex;
                    })
                    .map((note) => (
                      <div
                        key={note.id}
                        id={`note-${note.id}`}
                        className="group border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                getHighlightClass(
                                  note.highlightColor || "yellow"
                                ).split(" ")[0]
                              }`}
                              title={`高亮颜色: ${
                                highlightColors.find(
                                  (c) =>
                                    c.name === (note.highlightColor || "yellow")
                                )?.label
                              }`}
                            />
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                              第 {note.paragraphIndex + 1} 段
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playTTS(note.word)}
                              className="h-6 w-6 p-0"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="font-medium text-blue-600 dark:text-blue-400 mb-1 text-sm">
                          {note.word}
                        </div>

                        {note.meaning && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                            {note.meaning}
                          </p>
                        )}

                        <div className="text-xs text-gray-400">
                          {new Date(note.createdAt!).toLocaleDateString(
                            "zh-CN",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 悬浮小球组件 */}
      <BallSelector
        containerRef={contentRef}
        onBallClick={({ text, rect, range, paragraphIndex }) => {
          setSelectedText(text);
          setPopoverPosition({ x: rect.right + 12, y: rect.top - 32 });
          setPopoverOpen(true);
          setSelectedParagraph(paragraphIndex ?? 0);
        }}
      />

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
    </div>
  );
}
