"use client";

import { JSX } from "react";
import { WordNote } from "@/lib/db/schema";
import { usePDFViewerStore } from "@/lib/stores/pdf-viewer-store";
import { HighlightMatcher } from "@/lib/utils/highlight-matcher";

interface CustomHighlighterProps {
  paragraph: string;
  paragraphIndex: number;
  notes: WordNote[];
  onNoteClick: (noteId: number) => void;
}

// 高亮颜色映射
const highlightColors: Record<string, string> = {
  yellow: "#fef3c7",
  green: "#d1fae5",
  blue: "#dbeafe",
  pink: "#fce7f3",
  purple: "#e9d5ff",
  orange: "#fed7aa",
};

export function CustomHighlighter({
  paragraph,
  paragraphIndex,
  notes,
  onNoteClick,
}: CustomHighlighterProps) {
  const { articleFont, lineSpacing } = usePDFViewerStore();

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

  // 使用智能匹配算法查找高亮位置
  const matches = HighlightMatcher.findHighlights(paragraph, paragraphNotes);

  if (matches.length === 0) {
    // 如果没有找到任何匹配，返回普通文本
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

  const elements: JSX.Element[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const { startPos, endPos, note, confidence } = match;

    // 添加高亮前的普通文本
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

    // 获取高亮颜色
    const highlightColor =
      highlightColors[note.highlightColor || "yellow"] ||
      highlightColors.yellow;

    // 根据置信度调整透明度
    const opacity = Math.max(0.3, confidence);

    // 添加高亮文本
    elements.push(
      <mark
        key={`highlight-${note.id}-${index}`}
        style={{
          backgroundColor: highlightColor,
          opacity: opacity,
          border: "none",
          padding: "2px 1px",
          margin: "0",
          borderRadius: "3px",
          cursor: "pointer",
          userSelect: "text",
          boxShadow: confidence > 0.7 ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "none",
          fontFamily: articleFont.family,
          fontSize: `${articleFont.size}px`,
          color: articleFont.color,
          lineHeight: lineSpacing.article,
        }}
        className={`transition-all duration-200 hover:opacity-80 hover:shadow-md ${
          confidence < 0.6 ? "border border-dashed border-gray-400" : ""
        }`}
        onClick={() => onNoteClick(note.id)}
        title={`点击定位笔记: ${note.meaning} (匹配度: ${Math.round(
          confidence * 100
        )}%)`}
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
}
