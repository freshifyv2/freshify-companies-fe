import { NextResponse } from "next/server";
import { post } from "@/lib/api";
import { requireToken } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const token = requireToken();
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }
    const body = await req.json();
    const out = await post(`/v1/companies/${companyId}/members`, token, body);
    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
