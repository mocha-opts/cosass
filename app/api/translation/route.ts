// app/api/translate/route.ts

import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return Response.json({ error: "Missing text" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "你是一个翻译助手，将英文翻译成中文，返回简洁自然的翻译，不加解释。",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const translation = completion.choices[0].message.content?.trim();

    if (!translation) {
      return Response.json({ error: "Translation failed" }, { status: 500 });
    }

    return Response.json({ translation });
  } catch (error) {
    console.error("Translation API error:", error);
    return Response.json(
      {
        error: "Translation service unavailable",
        translation: "翻译服务暂时不可用",
      },
      { status: 500 }
    );
  }
}
