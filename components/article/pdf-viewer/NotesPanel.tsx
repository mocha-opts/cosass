"use client";

import { Button } from "@/components/ui/button";
import { Volume2, Trash2, BookOpen } from "lucide-react";
import { WordNote } from "@/lib/db/schema";
import { usePDFViewerStore } from "@/lib/stores/pdf-viewer-store";

interface NotesPanelProps {
  notes: WordNote[];
  onNoteClick: (noteId: number) => void;
  onPlayTTS: (text: string) => void;
}

export function NotesPanel({ notes, onNoteClick, onPlayTTS }: NotesPanelProps) {
  const { notesFont, lineSpacing } = usePDFViewerStore();

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
    <div className="h-full">
      {/* 笔记标题 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
          <h3
            className="font-bold"
            style={{
              fontFamily: notesFont.family,
              fontSize: `${notesFont.size + 2}px`,
              color: notesFont.color,
            }}
          >
            单词笔记
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent ml-2" />
        </div>

        {notes.length > 0 && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>共 {notes.length} 个笔记</span>
          </div>
        )}
      </div>

      {/* 笔记列表 - 按段落分组 */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gray-400" />
            </div>
            <p
              className="text-gray-500"
              style={{
                fontFamily: notesFont.family,
                fontSize: `${notesFont.size - 1}px`,
              }}
            >
              暂无笔记
            </p>
            <p
              className="text-gray-400 mt-1"
              style={{
                fontFamily: notesFont.family,
                fontSize: `${notesFont.size - 2}px`,
              }}
            >
              选择文本添加笔记
            </p>
          </div>
        ) : (
          sortedParagraphs.map((paragraphIndex) => (
            <div key={paragraphIndex} className="space-y-2">
              {/* 段落标题 */}
              <div className="text-xs text-gray-400 font-medium px-2">
                第 {paragraphIndex + 1} 段
              </div>

              {/* 该段落的笔记 */}
              {notesByParagraph[paragraphIndex].map((note) => (
                <div
                  key={note.id}
                  id={`note-${note.id}`}
                  className="group p-3 rounded-lg transition-colors duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${getBackgroundColor(
                      note.highlightColor || "yellow"
                    )}15`,
                  }}
                >
                  {/* 笔记内容 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 单词 */}
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontFamily: notesFont.family,
                          fontSize: `${notesFont.size + 1}px`,
                          color: getBackgroundColor(
                            note.highlightColor || "yellow"
                          ),
                        }}
                      >
                        {note.word}
                      </div>

                      {/* 释义 */}
                      {note.meaning && (
                        <p
                          style={{
                            fontFamily: notesFont.family,
                            fontSize: `${notesFont.size - 1}px`,
                            lineHeight: lineSpacing.notes,
                            color: "#6b7280",
                          }}
                        >
                          {note.meaning}
                        </p>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPlayTTS(note.word)}
                        className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        title="朗读单词"
                      >
                        <Volume2 className="w-3 h-3 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                        title="删除笔记"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 获取背景颜色
function getBackgroundColor(color: string): string {
  const colorMap: Record<string, string> = {
    yellow: "#f59e0b",
    green: "#10b981",
    blue: "#3b82f6",
    pink: "#ec4899",
    purple: "#8b5cf6",
    orange: "#f97316",
  };
  return colorMap[color] || colorMap.yellow;
}
