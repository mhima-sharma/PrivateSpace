"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { updateProfile, type ProfileDTO } from "@/lib/profile-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

const BIO_MAX = 300;

export function EditProfileModal({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileDTO;
}) {
  const qc = useQueryClient();
  const [name, setName] = React.useState(profile.name ?? "");
  const [bio, setBio] = React.useState(profile.bio ?? "");
  const [error, setError] = React.useState<string | null>(null);

  // Re-sync the form whenever a fresh profile is opened.
  React.useEffect(() => {
    if (open) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      setError(null);
    }
  }, [open, profile.name, profile.bio]);

  const save = useMutation({
    mutationFn: () => updateProfile({ name: name.trim(), bio: bio.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", profile.id] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            maxLength={80}
            placeholder="Your name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-bio">Bio</Label>
          <textarea
            id="profile-bio"
            value={bio}
            maxLength={BIO_MAX}
            rows={4}
            placeholder="Write something about yourself…"
            onChange={(e) => setBio(e.target.value)}
            className="flex w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className="self-end text-xs text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </span>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
