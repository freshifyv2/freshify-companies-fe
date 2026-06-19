/**
 * GET proxy → companies-be /v1/modules/companies/info
 *
 * Sprint 4 — Module Registry Settings (Phase B). Returns the 9 canonical
 * Module Registry fields plus available role keys + labels. Authenticated
 * read-only (BE allows any authenticated caller).
 */
import { NextResponse } from "next/server";
import { get } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function GET() {
  try {
    const token = requireToken();
    const out = await get("/v1/modules/companies/info", token);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
