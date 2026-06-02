"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { UploadCard } from "@/components/memories/upload-card";
import { MemoriesFeed } from "@/components/memories/feed";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "others", label: "Feed" },
  { key: "mine", label: "My posts" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function GalleryView({ email }: { email: string }) {
  const router = useRouter();
  const params = useSearchParams();

  // URL is the source of truth so the bottom tab bar can drive these too.
  const tab: Tab = params.get("view") === "mine" ? "mine" : "others";
  const uploadOpen = params.get("compose") === "1";

  const setParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [params, router],
  );

  const setTab = (t: Tab) => setParams({ view: t === "mine" ? "mine" : null });

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar: tabs + create button — sticks just below the top nav */}
      <div className="sticky top-16 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:mx-0 sm:rounded-2xl sm:border sm:px-3 sm:py-2 sm:shadow-sm">
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                tab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          className="rounded-full"
          onClick={() => setParams({ compose: "1" })}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create post</span>
        </Button>
      </div>

      <MemoriesFeed
        scope={tab}
        layout="feed"
        profile={tab === "mine" ? { email } : undefined}
      />

      <Modal
        open={uploadOpen}
        onClose={() => setParams({ compose: null })}
        title="Create a post"
      >
        <UploadCard bare onUploaded={() => setParams({ compose: null })} />
      </Modal>
    </div>
  );
}
