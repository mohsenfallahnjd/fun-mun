import { NextResponse } from "next/server";
import { getVapidPublicKey, isVapidConfigured } from "@/lib/push";

export async function GET() {
  return NextResponse.json({
    configured: isVapidConfigured(),
    publicKey: getVapidPublicKey() ?? null,
  });
}
