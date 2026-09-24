"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers";

export default function Login() {
  const r = useRouter();
  const { user, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Redirect in useEffect, not during render
  useEffect(() => {
    if (!loading && user) r.replace("/dashboard");
  }, [user, loading, r]);

  // Don't render form until auth state is known
  if (loading) {
    return (
      <main className="container" style={{ maxWidth: 560, padding: "100px 0" }}>
        <div className="card">Loading…</div>
      </main>
    );
  }
  if (user) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const name = username.trim();
    if (name.length < 2 || name.length > 32) {
      setError("Username must be 2–32 characters.");
      return;
    }

    setBusy(true);

    // 1. Check username is free BEFORE creating an auth user
    const { data: existing, error: checkErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", name)
      .maybeSingle();

    if (checkErr) {
      setError(checkErr.message);
      setBusy(false);
      return;
    }
    if (existing) {
      setError("That username is taken.");
      setBusy(false);
      return;
    }

    // 2. Sign in anonymously
    const { data, error: signErr } = await supabase.auth.signInAnonymously();
    if (signErr || !data.user) {
      setError(signErr?.message ?? "Could not sign in.");
      setBusy(false);
      return;
    }

    // 3. Create profile (insert, not upsert — new user)
    const { error: pe } = await supabase.from("profiles").insert({
      id: data.user.id,
      username: name,
      display_name: name,
    });

    if (pe) {
      // Roll back: sign out so the user can retry with a different name
      await supabase.auth.signOut();
      setError(
        pe.code === "23505"
          ? "That username is taken."
          : pe.message
      );
      setBusy(false);
      return;
    }

    r.replace("/dashboard");
  }

  return (
    <main className="container" style={{ maxWidth: 560, padding: "100px 0" }}>
      <div className="card">
        <div className="badge badge-lime">HACKME ACCOUNT</div>
        <h1 style={{ fontSize: 42, margin: "18px 0 8px" }}>Enter HackMe</h1>
        <p className="muted">
          No email required for the MVP. Pick a username and start hosting or
          participating.
        </p>

        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mohin"
            maxLength={32}
            disabled={busy}
          />
          {error && (
            <p style={{ color: "#fda4af", fontSize: 13 }}>{error}</p>
          )}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 14 }}
            disabled={busy}
          >
            {busy ? "Entering…" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}