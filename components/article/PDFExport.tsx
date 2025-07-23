// components/PDFExport.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Loader2 } from "lucide-react";
import { Article, WordNote, ParagraphTranslation } from "@/lib/db/schema";

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 10,
  },
  englishText: {
    fontSize: 14,
    marginBottom: 5,
  },
  chineseText: {
    fontSize: 12,
    marginBottom: 10,
    color: "#666",
    fontStyle: "italic",
  },
  notesTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  noteItem: {
    marginBottom: 8,
  },
  originalText: {
    fontWeight: "bold",
  },
  translationText: {
    color: "#3366ff",
  },
});

function PdfDocument({
  article,
  notes,
  translations,
}: {
  article: Article;
  notes: WordNote[];
  translations: ParagraphTranslation[];
}) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>{article.title}</Text>

        {article.content.map((paragraph: string, index: number) => (
          <View key={index} style={styles.section}>
            <Text style={styles.englishText}>{paragraph}</Text>
            {translations.find((t) => t.paragraphIndex === index) && (
              <Text style={styles.chineseText}>
                {
                  translations.find((t) => t.paragraphIndex === index)
                    ?.translation
                }
              </Text>
            )}
          </View>
        ))}

        {notes.length > 0 && (
          <>
            <Text style={styles.notesTitle}>Word Notes</Text>
            {notes.map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.originalText}>{note.word}</Text>
                <Text style={styles.translationText}>{note.meaning}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

export function PdfExport({
  article,
  notes,
  translations,
}: {
  article: Article;
  notes: WordNote[];
  translations: ParagraphTranslation[];
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => setIsGenerating(true)}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <PDFDownloadLink
          document={
            <PdfDocument
              article={article}
              notes={notes}
              translations={translations}
            />
          }
          fileName={`${article.title}.pdf`}
          style={{ color: "inherit", textDecoration: "none" }}
          onClick={() => setTimeout(() => setIsGenerating(false), 1000)}
        >
          Export PDF
        </PDFDownloadLink>
      )}
    </Button>
  );
}
