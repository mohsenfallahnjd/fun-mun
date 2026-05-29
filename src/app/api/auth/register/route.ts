import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and password (min 8 characters) required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const [created] = await db
      .insert(profiles)
      .values({
        email,
        passwordHash,
        name: name || email.split("@")[0],
      })
      .returning({ id: profiles.id, email: profiles.email, name: profiles.name });

    return NextResponse.json({ profile: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
