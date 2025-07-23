// components/PlayTTSButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface PlayTTSButtonProps {
  text: string;
  className?: string;
}

export default function PlayTTSButton({
  text,
  className = "",
}: PlayTTSButtonProps) {
  const playTTS = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`w-8 h-8 ${className}`}
      onClick={playTTS}
    >
      <Volume2 className="w-4 h-4" />
    </Button>
  );
}
