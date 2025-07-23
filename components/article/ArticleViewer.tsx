"use client";

import { useState, useRef, useEffect } from "react";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import Highlighter from "react-highlight-words";

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
  Highlighter as HighlighterIcon,
} from "lucide-react";
import { WordNote, ParagraphTranslation } from "@/lib/db/schema";

interface ArticleViewerProps {
  content: string[];
  notes: WordNote[];
  translations: ParagraphTranslation[];
  articleId: number;
  progress?: any; // 添加进度属性
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
}: ArticleViewerProps) {
  const [selectedText, setSelectedText] = useState("");
  const [selectedParagraph, setSelectedParagraph] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [noteText, setNoteText] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [startTime] = useState(Date.now());
  const [charIndex, setCharIndex] = useState(0);

  const [readingProgress, setReadingProgress] = useState(
    progress?.readingProgress || 0
  );
  const progressRef = useRef<NodeJS.Timeout>(null);

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

  // 自动保存进度
  useEffect(() => {
    const saveProgress = () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          readingProgress,
          timeSpent,
          isCompleted: readingProgress >= 100,
        }),
      });
    };

    // 每30秒保存一次进度
    progressRef.current = setInterval(saveProgress, 30000);

    // 页面卸载时保存进度
    const handleBeforeUnload = () => {
      saveProgress();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveProgress(); // 组件卸载时保存
    };
  }, [articleId, readingProgress, startTime]);

  // 滚动时更新阅读进度
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min(
        Math.round((scrollTop / docHeight) * 100),
        100
      );

      if (scrollPercent > readingProgress) {
        setReadingProgress(scrollPercent);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingProgress]);

  const handleTextSelection = (paragraphIndex: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 计算字符索引
    const charIndex = calculateCharIndex(range, paragraphIndex);

    setSelectedText(selectedText);
    setSelectedParagraph(paragraphIndex);
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setPopoverOpen(true);
    // 存储字符索引以便保存笔记时使用
    setCharIndex(charIndex);
    // Auto translate
    handleAutoTranslate(selectedText);
  };

  const calculateCharIndex = (range: Range, paragraphIndex: number): number => {
    try {
      // 获取段落容器元素
      const paragraphElement = document.querySelector(
        `[data-paragraph-index="${paragraphIndex}"]`
      );

      if (!paragraphElement) return 0;

      // 创建一个新的范围，从段落开始到选择开始
      const rangeFromStart = document.createRange();
      rangeFromStart.setStart(paragraphElement, 0);
      rangeFromStart.setEnd(range.startContainer, range.startOffset);

      // 获取从段落开始到选择开始的文本长度
      const textBeforeSelection = rangeFromStart.toString();
      return textBeforeSelection.length;
    } catch (error) {
      console.error("Failed to calculate char index:", error);
      return 0;
    }
  };
  const handleAutoTranslate = async (text: string) => {
    try {
      const result = await translate({ text });
      setTranslationText(result?.translation || "");
    } catch (error) {
      console.error("Translation failed:", error);
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
        charIndex, // 需要确定字符索引的逻辑
      });

      // Refresh notes
      mutate(`/api/articles/${articleId}`);

      // Reset form
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
      .map((note) => note.word);
  };

  return (
    <div className="space-y-8">
      {/* 进度条 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-4 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">阅读进度:</span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{readingProgress}%</span>
        </div>
      </div>

      {/* 文章内容 */}
      {content.map((paragraph, index) => {
        const translation = translations.find(
          (t) => t.paragraphIndex === index
        );

        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              {/* English Paragraph */}
              <div className="mb-4">
                <div className="flex items-start gap-3 mb-2">
                  <Badge variant="outline" className="text-xs">
                    段落 {index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playTTS(paragraph)}
                    className="h-6 w-6 p-0"
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                </div>
                <div
                  data-paragraph-index={index} // 添加段落索引属性
                  className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 select-text cursor-text"
                  onMouseUp={() => handleTextSelection(index)}
                >
                  <Highlighter
                    searchWords={getHighlightWords(index)}
                    textToHighlight={paragraph}
                    highlightClassName="bg-yellow-200 dark:bg-yellow-800 px-1 rounded cursor-pointer"
                    unhighlightClassName=""
                    autoEscape={true}
                  />
                </div>
              </div>

              {/* Chinese Translation */}
              {translation && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      翻译
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {translation.translation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

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
        <PopoverContent className="w-80" align="center">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">选中文本</h4>
              <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {selectedText}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">翻译</label>
              <div className="relative">
                <Input
                  value={translationText}
                  onChange={(e) => setTranslationText(e.target.value)}
                  placeholder="自动翻译中..."
                  className="pr-8"
                />
                {isTranslating && (
                  <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin" />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">笔记 (可选)</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="添加个人笔记..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                disabled={!selectedText || !translationText || isSavingNote}
                className="flex-1"
              >
                {isSavingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <HighlighterIcon className="w-4 h-4 mr-2" />
                    保存笔记
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setPopoverOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
