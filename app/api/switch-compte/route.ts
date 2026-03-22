import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

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

  // Vérifier que l'utilisateur est authentifié et propriétaire du compte
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: compte, error: compteError } = await supabase
    .from("comptes")
    .select("id")
    .eq("id", compteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (compteError || !compte) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_KEY, compteId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
