import Link from "next/link";
import {
  FileText,
  FolderTree,
  ShoppingBag,
  MousePointerClick,
  Eye,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { formatNumber } from "@/lib/utils";
import { PLATFORMS } from "@/lib/constants";
import {
  getDashboardStats,
  getMonthlyAnalytics,
  getMostViewedBlogs,
  getTopClickedProducts,
} from "@/services/analytics.service";

export const dynamic = "force-dynamic";

const STAT_META = [
  { key: "totalBlogs", label: "Total Blogs", icon: FileText, href: "/admin/blogs" },
  { key: "totalCategories", label: "Categories", icon: FolderTree, href: "/admin/categories" },
  { key: "totalProducts", label: "Products", icon: ShoppingBag, href: "/admin/products" },
  { key: "totalClicks", label: "Affiliate Clicks", icon: MousePointerClick, href: "/admin/products" },
  { key: "totalViews", label: "Total Views", icon: Eye, href: "/admin/blogs" },
  { key: "totalSubscribers", label: "Subscribers", icon: Mail, href: "/admin/subscribers" },
] as const;

export default async function AdminDashboardPage() {
  let stats;
  let monthly = [] as { month: string; clicks: number; views: number }[];
  let mostViewed: { id: string; title: string; slug: string; views: number }[] = [];
  let topProducts: { id: string; name: string; clicks: number; platform: string }[] = [];
  let errorMessage: string | null = null;

  try {
    [stats, monthly, mostViewed, topProducts] = await Promise.all([
      getDashboardStats(),
      getMonthlyAnalytics(6),
      getMostViewedBlogs(5),
      getTopClickedProducts(5),
    ]);
  } catch (error) {
    console.error(error);
    errorMessage =
      "Unable to load dashboard statistics because the database is unreachable. Please check DATABASE_URL and your database connection.";
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="An overview of your platform." />

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-destructive">
          <p className="font-semibold">Dashboard data unavailable</p>
          <p className="mt-2 text-sm text-destructive/80">{errorMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {STAT_META.map((s) => (
              <Link key={s.key} href={s.href} className="block rounded-xl transition hover:-translate-y-0.5 hover:border-primary hover:bg-muted/80">
                <Card className="h-full">
                  <CardContent className="flex flex-col gap-2 p-5">
                    <s.icon className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{formatNumber(stats[s.key])}</span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <AnalyticsCharts data={monthly} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Viewed Blogs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mostViewed.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                {mostViewed.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3">
                    <Link href={`/blog/${b.slug}`} target="_blank" className="line-clamp-1 text-sm font-medium hover:text-primary">
                      {b.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" /> {formatNumber(b.views)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
                {topProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1 text-sm font-medium">{p.name}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{PLATFORMS[p.platform].label}</Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MousePointerClick className="h-3.5 w-3.5" /> {formatNumber(p.clicks)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="mt-8">
        <AnalyticsCharts data={monthly} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Viewed Blogs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostViewed.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {mostViewed.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3">
                <Link href={`/blog/${b.slug}`} target="_blank" className="line-clamp-1 text-sm font-medium hover:text-primary">
                  {b.title}
                </Link>
                <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" /> {formatNumber(b.views)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <span className="line-clamp-1 text-sm font-medium">{p.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{PLATFORMS[p.platform].label}</Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MousePointerClick className="h-3.5 w-3.5" /> {formatNumber(p.clicks)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
