import { create } from "zustand";

export interface FontSettings {
  family: string;
  size: number;
  color: string;
}

export interface LineSpacingSettings {
  article: number; // 文章行距
  notes: number; // 笔记行距
}

export interface PDFViewerState {
  // 显示状态
  showPDF: boolean;
  isGenerating: boolean;

  // 选择状态
  selectedText: string;
  selectedParagraph: number;
  selectedHighlightColor: string;

  // 弹窗状态
  popoverOpen: boolean;
  popoverPosition: { x: number; y: number };
  noteText: string;
  translationText: string;
  showTranslateButton: boolean;
  isAutoTranslating: boolean;

  // 字体设置
  articleFont: FontSettings;
  notesFont: FontSettings;

  // 行距设置
  lineSpacing: LineSpacingSettings;

  // 分页设置
  paragraphsPerPage: number;

  // Actions
  setShowPDF: (show: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setSelectedText: (text: string) => void;
  setSelectedParagraph: (paragraph: number) => void;
  setSelectedHighlightColor: (color: string) => void;
  setPopoverOpen: (open: boolean) => void;
  setPopoverPosition: (position: { x: number; y: number }) => void;
  setNoteText: (text: string) => void;
  setTranslationText: (text: string) => void;
  setShowTranslateButton: (show: boolean) => void;
  setIsAutoTranslating: (translating: boolean) => void;
  setArticleFont: (font: Partial<FontSettings>) => void;
  setNotesFont: (font: Partial<FontSettings>) => void;
  setLineSpacing: (spacing: Partial<LineSpacingSettings>) => void;
  setParagraphsPerPage: (count: number) => void;
  resetSelection: () => void;
}

export const usePDFViewerStore = create<PDFViewerState>((set) => ({
  // 初始状态
  showPDF: false,
  isGenerating: false,
  selectedText: "",
  selectedParagraph: 0,
  selectedHighlightColor: "yellow",
  popoverOpen: false,
  popoverPosition: { x: 0, y: 0 },
  noteText: "",
  translationText: "",
  showTranslateButton: false,
  isAutoTranslating: false,
  articleFont: {
    family: "system-ui",
    size: 14,
    color: "#374151",
  },
  notesFont: {
    family: "system-ui",
    size: 12,
    color: "#374151",
  },
  lineSpacing: {
    article: 1.5,
    notes: 1.2,
  },
  paragraphsPerPage: 4,

  // Actions
  setShowPDF: (show: boolean) => set({ showPDF: show }),
  setIsGenerating: (generating: boolean) => set({ isGenerating: generating }),
  setSelectedText: (text: string) => set({ selectedText: text }),
  setSelectedParagraph: (paragraph: number) =>
    set({ selectedParagraph: paragraph }),
  setSelectedHighlightColor: (color: string) =>
    set({ selectedHighlightColor: color }),
  setPopoverOpen: (open: boolean) => set({ popoverOpen: open }),
  setPopoverPosition: (position: { x: number; y: number }) =>
    set({ popoverPosition: position }),
  setNoteText: (text: string) => set({ noteText: text }),
  setTranslationText: (text: string) => set({ translationText: text }),
  setShowTranslateButton: (show: boolean) => set({ showTranslateButton: show }),
  setIsAutoTranslating: (translating: boolean) =>
    set({ isAutoTranslating: translating }),
  setArticleFont: (font: Partial<FontSettings>) =>
    set((state) => ({
      articleFont: { ...state.articleFont, ...font },
    })),
  setNotesFont: (font: Partial<FontSettings>) =>
    set((state) => ({
      notesFont: { ...state.notesFont, ...font },
    })),
  setLineSpacing: (spacing: Partial<LineSpacingSettings>) =>
    set((state) => ({
      lineSpacing: { ...state.lineSpacing, ...spacing },
    })),
  setParagraphsPerPage: (count: number) => set({ paragraphsPerPage: count }),
  resetSelection: () =>
    set({
      selectedText: "",
      noteText: "",
      translationText: "",
      popoverOpen: false,
      showTranslateButton: false,
      isAutoTranslating: false,
    }),
}));
