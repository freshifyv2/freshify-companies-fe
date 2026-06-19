/**
 * GET / PUT proxy → companies-be /v1/modules/companies/settings
 *
 * Sprint 4 — Module Registry Settings (Phase B). Operator-only mutation
 * (BE enforces).
 */
import { NextResponse } from "next/server";
import { get, put } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function GET() {
  try {
    const token = requireToken();
    const out = await get("/v1/modules/companies/settings", token);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const token = requireToken();
    const body = await req.json();
    const out = await put("/v1/modules/companies/settings", token, body);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
