import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const COOKIE_KEY = "active_compte_id";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const compteId = body.compteId;

  if (!z.string().uuid().safeParse(compteId).success) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_KEY, compteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
