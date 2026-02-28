import { NextRequest, NextResponse } from "next/server";

const COOKIE_KEY = "active_compte_id";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    console.error("[switch-compte] JSON parse error");
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const compteId = body.compteId;

  if (typeof compteId !== "string" || compteId.length === 0) {
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
