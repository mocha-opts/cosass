ALTER TABLE "word_notes" ADD COLUMN "selected_text" text;--> statement-breakpoint
ALTER TABLE "word_notes" ADD COLUMN "context_before" varchar(100);--> statement-breakpoint
ALTER TABLE "word_notes" ADD COLUMN "context_after" varchar(100);--> statement-breakpoint
ALTER TABLE "word_notes" ADD COLUMN "text_length" integer;