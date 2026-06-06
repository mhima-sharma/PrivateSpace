import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Affiliate click tracker + redirect.
 * GET /go/:id?b=<blogId>  ->  records a click and 302-redirects to the
 * product's affiliate URL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const blogId = req.nextUrl.searchParams.get("b") ?? undefined;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, affiliateUrl: true },
  });

  if (!product) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Best-effort tracking; never block the redirect on it.
  try {
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { clicks: { increment: 1 } } }),
      prisma.affiliateClick.create({
        data: {
          productId: id,
          blogId: blogId ?? null,
          referrer: req.headers.get("referer") ?? null,
          userAgent: req.headers.get("user-agent") ?? null,
        },
      }),
    ]);
  } catch {
    // swallow — analytics shouldn't break the user's journey
  }

  return NextResponse.redirect(product.affiliateUrl);
}
