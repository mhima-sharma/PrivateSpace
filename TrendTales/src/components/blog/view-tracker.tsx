"use client";

import * as React from "react";

/** Fires a one-time view ping per page load (dedupes via sessionStorage). */
export function ViewTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/blogs/${slug}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [slug]);

  return null;
}
