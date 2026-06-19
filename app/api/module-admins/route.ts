/**
 * GET / POST proxy → companies-be /v1/modules/companies/admins
 *
 * Sprint 4 — Module Registry Settings (Phase B). Operator-only mutation
 * (BE enforces).
 */
import { NextResponse } from "next/server";
import { get, post } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function GET() {
  try {
    const token = requireToken();
    const out = await get("/v1/modules/companies/admins", token);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = requireToken();
    const body = await req.json();
    const out = await post("/v1/modules/companies/admins", token, body);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
