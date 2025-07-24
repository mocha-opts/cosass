"use client";

import { WordNote } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, MessageSquare, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WordNotePanelProps {
  notes: WordNote[];
}

export default function WordNotePanel({ notes }: WordNotePanelProps) {
  const playTTS = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // 按段落和字符位置排序笔记 - 创建新数组避免修改原数组
  const sortedNotes = [...notes].sort((a, b) => {
    console.log(
      `Comparing: P${a.paragraphIndex}C${a.charIndex}(${a.word}) vs P${b.paragraphIndex}C${b.charIndex}(${b.word})`
    );
    if (a.paragraphIndex !== b.paragraphIndex) {
      return a.paragraphIndex - b.paragraphIndex;
    }
    return a.charIndex - b.charIndex;
  });

  console.log(
    "Original notes:",
    notes.map((n) => `P${n.paragraphIndex}C${n.charIndex}(${n.word})`)
  );
  console.log(
    "Sorted notes:",
    sortedNotes.map((n) => `P${n.paragraphIndex}C${n.charIndex}(${n.word})`)
  );

  if (!notes || notes.length === 0) {
    return (
      <Card className="sticky top-4 bg-white dark:bg-gray-800 border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>单词笔记</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无笔记</p>
            <p className="text-xs text-gray-400 mt-1">选择文本添加笔记</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 bg-white dark:bg-gray-800 border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>单词笔记</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {notes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                id={`note-${note.id}`}
                className="group border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
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

                {/* 单词 */}
                <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                  {note.word}
                </div>

                {/* 翻译 */}
                {note.meaning && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {note.meaning}
                  </p>
                )}

                {/* 时间 */}
                <div className="text-xs text-gray-400">
                  {new Date(note.createdAt!).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
