/**
 * DELETE proxy → companies-be /v1/modules/companies/admins/:userId
 *
 * Sprint 4 — Module Registry Settings (Phase B). Operator-only mutation
 * (BE enforces). Idempotent — returns { removed: boolean }.
 */
import { NextResponse } from "next/server";
import { del } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const token = requireToken();
    const out = await del(
      `/v1/modules/companies/admins/${encodeURIComponent(params.userId)}`,
      token,
    );
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
