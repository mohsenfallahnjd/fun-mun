import { ImageResponse } from "next/og";
import { AppIconImage } from "@/lib/app-icon";

const ALLOWED = new Set(["192", "512"]);

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await context.params;

  if (!ALLOWED.has(sizeParam)) {
    return new Response("Not found", { status: 404 });
  }

  const size = Number(sizeParam);

  return new ImageResponse(<AppIconImage size={size} />, {
    width: size,
    height: size,
  });
}
