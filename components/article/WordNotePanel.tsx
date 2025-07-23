"use client";

import { WordNote } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, MessageSquare } from "lucide-react";

interface WordNotePanelProps {
  notes: WordNote[];
}

export default function WordNotePanel({ notes }: WordNotePanelProps) {
  if (!notes || notes.length === 0) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            单词笔记
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>选择文本添加笔记</p>
            <p className="text-sm mt-1">在左侧文章中选中单词或句子</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group notes by paragraph
  const notesByParagraph = notes.reduce((acc, note) => {
    const key = note.paragraphIndex;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {} as Record<number, WordNote[]>);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          单词笔记
          <Badge variant="secondary" className="ml-auto">
            {notes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-4">
            {Object.entries(notesByParagraph)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([paragraphIndex, paragraphNotes]) => (
                <div key={paragraphIndex} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      段落 {parseInt(paragraphIndex) + 1}
                    </Badge>
                  </div>

                  {paragraphNotes.map((note) => (
                    <Card
                      key={note.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {note.word}
                            </span>
                          </div>

                          {note.meaning && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">翻译：</span>
                              {note.meaning}
                            </p>
                          )}

                          {note.meaning && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">笔记：</span>
                              {note.meaning}
                            </p>
                          )}

                          <div className="text-xs text-gray-400 pt-1">
                            {new Date(note.createdAt!).toLocaleDateString(
                              "zh-CN"
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
