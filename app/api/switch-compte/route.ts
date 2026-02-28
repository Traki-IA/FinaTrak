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
  console.log("[switch-compte] received:", JSON.stringify(body));

  if (typeof compteId !== "string" || compteId.length === 0) {
    console.error("[switch-compte] invalid compteId:", compteId, "type:", typeof compteId);
    return NextResponse.json(
      { error: `Identifiant invalide (reçu: ${JSON.stringify(compteId)})` },
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

  console.log("[switch-compte] cookie set to:", compteId);
  return response;
}
