import { NextResponse } from "next/server";
import { incrementBlogViews } from "@/services/blog.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    await incrementBlogViews(slug);
  } catch {
    // non-fatal
  }
  return NextResponse.json({ ok: true });
}
