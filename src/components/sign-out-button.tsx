"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function SignOutButton() {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function confirmSignOut() {
    setBusy(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <LogOut />
        <span className="hidden sm:inline">Sign out</span>
      </Button>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Sign out"
        className="max-w-sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Are you sure you want to sign out?
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll need to sign in again to access your private space.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSignOut}
              disabled={busy}
            >
              {busy && <Loader2 className="animate-spin" />}
              Sign out
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
