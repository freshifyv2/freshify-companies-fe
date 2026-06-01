/**
 * PATCH proxy → companies-be /v1/admin/companies/:companyId
 * Operator-only mutation (BE enforces the operator check).
 */
import { NextResponse } from "next/server";
import { patch } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function PATCH(
  req: Request,
  { params }: { params: { companyId: string } },
) {
  try {
    const token = requireToken();
    const body = await req.json();
    const out = await patch(
      `/v1/admin/companies/${params.companyId}`,
      token,
      body,
    );
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
