// components/WordHover.tsx
"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WordNote } from "@/lib/db/schema";

interface WordHoverProps {
  notes: WordNote[];
  activeNoteId: number | null;
  setActiveNoteId: (id: number | null) => void;
}

export default function WordHover({
  notes,
  activeNoteId,
  setActiveNoteId,
}: WordHoverProps) {
  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <Popover
      open={!!activeNote}
      onOpenChange={(open) => !open && setActiveNoteId(null)}
    >
      <PopoverTrigger asChild>
        <div className="fixed" />
      </PopoverTrigger>
      {activeNote && (
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <h4 className="font-medium">{activeNote.word}</h4>
            <p className="text-sm">{activeNote.meaning}</p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
