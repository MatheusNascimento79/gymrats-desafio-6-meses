import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import type { AuthUser } from "@/lib/types";

const sessionCookie = "gymrats_session";
const setupCookie = "gymrats_setup";
const sessionDays = 30;

type ParticipantAuthRow = {
  gymrats_id: string;
  full_name: string;
  role: string;
  password_hash: string | null;
  password_salt: string | null;
};

export function isSuperAdminName(fullName: string) {
  return fullName.trim().toLowerCase() === "matheus nascimento";
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(participant: Pick<ParticipantAuthRow, "gymrats_id" | "full_name" | "role">) {
  const supabase = getSupabaseAdmin();
  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();

  await supabase!.from("auth_sessions").insert({
    token,
    participant_gymrats_id: participant.gymrats_id,
    expires_at: expiresAt
  });

  cookies().set(sessionCookie, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDays * 24 * 60 * 60
  });
}

export function createSetupSession() {
  cookies().set(setupCookie, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60
  });
}

export function clearAuthCookies() {
  cookies().delete(sessionCookie);
  cookies().delete(setupCookie);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    return {
      gymratsId: "local-admin",
      fullName: "Matheus Nascimento",
      role: "owner",
      isSuperAdmin: true
    };
  }

  const setup = cookies().get(setupCookie)?.value;
  if (setup === "1") {
    return {
      gymratsId: "setup-admin",
      fullName: "Matheus Nascimento",
      role: "owner",
      isSuperAdmin: true
    };
  }

  const rawToken = cookies().get(sessionCookie)?.value;
  if (!rawToken) {
    return null;
  }

  const supabase = getSupabaseAdmin()!;
  const token = hashToken(rawToken);
  const { data, error } = await supabase
    .from("auth_sessions")
    .select("expires_at, participants!inner(gymrats_id, full_name, role)")
    .eq("token", token)
    .single();

  if (error || !data || new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  const participant = Array.isArray(data.participants) ? data.participants[0] : data.participants;

  return {
    gymratsId: participant.gymrats_id,
    fullName: participant.full_name,
    role: participant.role,
    isSuperAdmin: isSuperAdminName(participant.full_name)
  };
}
