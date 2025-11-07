import { NextRequest, NextResponse } from "next/server";
import { getRun } from "workflow/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Workflow ID is required" },
      { status: 400 },
    );
  }

  try {
    const run = getRun<string>(id);
    const stream = run.getReadable();

    const encoder = new TextEncoder();
    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            const data = `data: ${JSON.stringify(value)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error("Error reading workflow stream:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error getting workflow:", error);
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
}
