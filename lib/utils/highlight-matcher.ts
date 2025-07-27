import { WordNote } from "@/lib/db/schema";

export interface HighlightMatch {
  startPos: number;
  endPos: number;
  confidence: number; // 匹配置信度 (0-1)
  note: WordNote;
}

/**
 * 智能高亮文本匹配算法
 * 使用多级fallback策略确保高亮准确显示
 */
export class HighlightMatcher {
  /**
   * 在段落中查找高亮位置
   */
  static findHighlights(
    paragraph: string,
    notes: WordNote[]
  ): HighlightMatch[] {
    const matches: HighlightMatch[] = [];

    for (const note of notes) {
      const match = this.findSingleHighlight(paragraph, note);
      if (match) {
        matches.push(match);
      }
    }

    // 按位置排序并处理重叠
    return this.resolveOverlaps(matches);
  }

  /**
   * 查找单个高亮的位置
   */
  private static findSingleHighlight(
    paragraph: string,
    note: WordNote
  ): HighlightMatch | null {
    // 策略1: 使用上下文进行精确匹配
    if (note.selectedText && note.contextBefore && note.contextAfter) {
      const contextMatch = this.findByContext(paragraph, note);
      if (contextMatch) {
        return { ...contextMatch, note, confidence: 1.0 };
      }
    }

    // 策略2: 使用选择的文本进行匹配
    if (note.selectedText) {
      const textMatch = this.findBySelectedText(paragraph, note);
      if (textMatch) {
        return { ...textMatch, note, confidence: 0.8 };
      }
    }

    // 策略3: 使用charIndex和word进行传统匹配
    const indexMatch = this.findByCharIndex(paragraph, note);
    if (indexMatch) {
      return { ...indexMatch, note, confidence: 0.6 };
    }

    // 策略4: 模糊匹配word
    const fuzzyMatch = this.findByFuzzyMatch(paragraph, note);
    if (fuzzyMatch) {
      return { ...fuzzyMatch, note, confidence: 0.4 };
    }

    return null;
  }

  /**
   * 使用上下文匹配
   */
  private static findByContext(
    paragraph: string,
    note: WordNote
  ): { startPos: number; endPos: number } | null {
    if (!note.selectedText || !note.contextBefore || !note.contextAfter) {
      return null;
    }

    const searchPattern =
      note.contextBefore + note.selectedText + note.contextAfter;
    const index = paragraph.indexOf(searchPattern);

    if (index !== -1) {
      const startPos = index + note.contextBefore.length;
      const endPos = startPos + note.selectedText.length;
      return { startPos, endPos };
    }

    // 尝试部分上下文匹配
    const partialPattern = note.selectedText + note.contextAfter;
    const partialIndex = paragraph.indexOf(partialPattern);

    if (partialIndex !== -1) {
      return {
        startPos: partialIndex,
        endPos: partialIndex + note.selectedText.length,
      };
    }

    return null;
  }

  /**
   * 使用选择的文本匹配
   */
  private static findBySelectedText(
    paragraph: string,
    note: WordNote
  ): { startPos: number; endPos: number } | null {
    if (!note.selectedText) return null;

    const index = paragraph.indexOf(note.selectedText);
    if (index !== -1) {
      return {
        startPos: index,
        endPos: index + note.selectedText.length,
      };
    }

    // 尝试大小写不敏感匹配
    const lowerParagraph = paragraph.toLowerCase();
    const lowerText = note.selectedText.toLowerCase();
    const lowerIndex = lowerParagraph.indexOf(lowerText);

    if (lowerIndex !== -1) {
      return {
        startPos: lowerIndex,
        endPos: lowerIndex + note.selectedText.length,
      };
    }

    return null;
  }

  /**
   * 使用字符索引匹配
   */
  private static findByCharIndex(
    paragraph: string,
    note: WordNote
  ): { startPos: number; endPos: number } | null {
    if (note.charIndex == null || !note.word) return null;

    const startPos = note.charIndex;
    const endPos = startPos + note.word.length;

    // 检查位置是否有效
    if (startPos < 0 || endPos > paragraph.length) {
      return null;
    }

    // 检查文本是否匹配
    const actualText = paragraph.substring(startPos, endPos);
    if (actualText.toLowerCase() === note.word.toLowerCase()) {
      return { startPos, endPos };
    }

    return null;
  }

  /**
   * 模糊匹配
   */
  private static findByFuzzyMatch(
    paragraph: string,
    note: WordNote
  ): { startPos: number; endPos: number } | null {
    if (!note.word) return null;

    const lowerParagraph = paragraph.toLowerCase();
    const lowerWord = note.word.toLowerCase();

    // 查找所有可能的匹配位置
    const matches: { startPos: number; endPos: number }[] = [];
    let index = 0;

    while (index < lowerParagraph.length) {
      const foundIndex = lowerParagraph.indexOf(lowerWord, index);
      if (foundIndex === -1) break;

      matches.push({
        startPos: foundIndex,
        endPos: foundIndex + note.word.length,
      });

      index = foundIndex + 1;
    }

    // 如果只有一个匹配，直接返回
    if (matches.length === 1) {
      return matches[0];
    }

    // 如果有多个匹配，选择最接近原始charIndex的
    if (matches.length > 1 && note.charIndex != null) {
      return matches.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.startPos - note.charIndex!);
        const currentDiff = Math.abs(current.startPos - note.charIndex!);
        return currentDiff < closestDiff ? current : closest;
      });
    }

    return matches[0] || null;
  }

  /**
   * 解决重叠的高亮
   */
  private static resolveOverlaps(matches: HighlightMatch[]): HighlightMatch[] {
    if (matches.length <= 1) return matches;

    // 按位置排序
    matches.sort((a, b) => a.startPos - b.startPos);

    const resolved: HighlightMatch[] = [];
    let lastMatch: HighlightMatch | null = null;

    for (const match of matches) {
      if (!lastMatch) {
        resolved.push(match);
        lastMatch = match;
        continue;
      }

      // 检查是否重叠
      if (match.startPos < lastMatch.endPos) {
        // 重叠：选择置信度更高的
        if (match.confidence > lastMatch.confidence) {
          resolved[resolved.length - 1] = match;
          lastMatch = match;
        }
        // 否则跳过当前匹配
      } else {
        // 不重叠：直接添加
        resolved.push(match);
        lastMatch = match;
      }
    }

    return resolved;
  }

  /**
   * 提取文本上下文
   */
  static extractContext(
    paragraph: string,
    startPos: number,
    endPos: number,
    contextLength: number = 50
  ): {
    contextBefore: string;
    contextAfter: string;
  } {
    const beforeStart = Math.max(0, startPos - contextLength);
    const afterEnd = Math.min(paragraph.length, endPos + contextLength);

    return {
      contextBefore: paragraph.substring(beforeStart, startPos),
      contextAfter: paragraph.substring(endPos, afterEnd),
    };
  }
}
