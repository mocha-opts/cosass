import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();

    if (!articleId) {
      return new Response("Article ID is required", { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/export/article/${articleId}`;

    console.log(`Generating PDF for article ${articleId} from URL: ${url}`);

    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      headless: true,
    });

    const page = await browser.newPage();

    // 设置视口大小
    await page.setViewport({ width: 1200, height: 800 });

    // 导航到导出页面
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 等待页面内容加载完成 - 增加等待时间并改进检测
    try {
      await page.waitForSelector("[data-paragraph-index]", { timeout: 15000 });
    } catch (error) {
      console.log(
        "Selector [data-paragraph-index] not found, trying alternative selectors..."
      );
      // 尝试其他选择器
      try {
        await page.waitForSelector(".space-y-6", { timeout: 10000 });
      } catch (error2) {
        console.log(
          "Alternative selector not found, waiting for any content..."
        );
        // 最后等待页面内容
        await page.waitForFunction(
          () => {
            return (
              document.body.textContent &&
              document.body.textContent.length > 100
            );
          },
          { timeout: 10000 }
        );
      }
    }

    // 设置媒体类型为 screen，确保高亮颜色正确显示
    await page.emulateMediaType("screen");

    // 添加打印样式，确保高亮和背景色都能正确打印
    await page.addStyleTag({
      content: `
        * { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          color-adjust: exact !important;
        }
        mark {
          background-color: inherit !important;
        }
        @media print {
          body { margin: 0; }
          .print-break { page-break-before: always; }
        }
      `,
    });

    // 生成 PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    });

    await browser.close();

    console.log(`PDF generated successfully for article ${articleId}`);

    return new Response(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="article-${articleId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({
        error: "PDF generation failed",
        details: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
