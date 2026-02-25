import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [] });
}

export async function POST(req: Request) {
  const body = await req.json();

  // TODO: save to DB
  console.log(body);

  return NextResponse.json({ success: true });
}