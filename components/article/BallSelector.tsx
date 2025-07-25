import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PenLine } from "lucide-react";

interface BallSelectorProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onBallClick: (info: {
    text: string;
    rect: DOMRect;
    range: Range;
    paragraphIndex?: number;
  }) => void;
}

export function BallSelector({ containerRef, onBallClick }: BallSelectorProps) {
  const [ball, setBall] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    rect: DOMRect;
    range: Range;
    paragraphIndex?: number;
  } | null>(null);

  useEffect(() => {
    function updateBall() {
      const selection = window.getSelection();
      if (
        !selection ||
        selection.rangeCount === 0 ||
        selection.isCollapsed ||
        !containerRef.current
      ) {
        setBall(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setBall(null);
        return;
      }
      const text = selection.toString().trim();
      if (!text) {
        setBall(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      let paragraphIndex: number | undefined = undefined;
      if (
        range.startContainer &&
        (range.startContainer as Element).parentElement
      ) {
        const parentEl = (range.startContainer as Element).parentElement;
        if (parentEl) {
          const el = parentEl.closest("[data-paragraph-index]");
          if (el) {
            paragraphIndex = Number(el.getAttribute("data-paragraph-index"));
          }
        }
      }
      setBall({
        visible: true,
        x: rect.right + 12,
        y: rect.top - 32,
        text,
        rect,
        range,
        paragraphIndex,
      });
    }
    document.addEventListener("selectionchange", updateBall);
    return () => {
      document.removeEventListener("selectionchange", updateBall);
    };
  }, [containerRef]);

  if (!ball || !ball.visible) return null;

  return createPortal(
    <button
      style={{
        position: "fixed",
        left: ball.x,
        top: ball.y,
        zIndex: 9999,
        transform: "translate(-50%, -100%)",
        pointerEvents: "auto",
        background: "linear-gradient(135deg, #6366f1 60%, #38bdf8 100%)",
        boxShadow:
          "0 2px 12px 0 rgba(56, 189, 248, 0.18), 0 0 0 2px rgba(99,102,241,0.10)",
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2px solid white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onBallClick(ball)}
      title="添加笔记或翻译"
    >
      <PenLine style={{ width: 20, height: 20, color: "white" }} />
    </button>,
    document.body
  );
}
