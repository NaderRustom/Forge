"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Link
            href="/project"
            className="text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            &larr; Back to projects
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Profile
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-500">Name</label>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {session?.user?.name || "—"}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Email</label>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {session?.user?.email || "—"}
                </p>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <Button
            variant="danger"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
