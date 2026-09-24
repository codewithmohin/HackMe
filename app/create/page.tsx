"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/providers";
import { supabase } from "@/lib/supabase";
import { hackathonSchema, validateLifecycle } from "@/lib/validators";

const iso = (d: number) => new Date(d).toISOString().slice(0, 16);
const now = Date.now();

export default function Create() {
  const { user, loading } = useAuth();
  const r = useRouter();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    theme: "",
    category: "AI / Web",

    // Visible timeline fields
    registration_start: iso(now),
    registration_end: iso(now + 86400000),
    winner_announcement_at: iso(now + 8 * 86400000),

    // Backend lifecycle fields
    // These are hidden from the UI but kept for the existing database/validation.
    hacking_start: iso(now + 2 * 86400000),
    hacking_end: iso(now + 4 * 86400000),
    submission_deadline: iso(now + 5 * 86400000),
    judging_start: iso(now + 5 * 86400000 + 3600000),
    judging_end: iso(now + 7 * 86400000),

    max_team_size: 4,
    max_participants: 500,

    eligibility: "",

    rules:
      "Build an original project. Submit before the deadline. Follow the code of conduct.",

    prizes: [
      {
        title: "1st Place",
        position: 1,
        amount: 25000,
        description: "",
      },
      {
        title: "2nd Place",
        position: 2,
        amount: 15000,
        description: "",
      },
      {
        title: "3rd Place",
        position: 3,
        amount: 10000,
        description: "",
      },
    ],

    criteria: [
      {
        name: "Innovation",
        max_score: 10,
      },
      {
        name: "Impact",
        max_score: 10,
      },
      {
        name: "Technical",
        max_score: 10,
      },
      {
        name: "Presentation",
        max_score: 10,
      },
    ],
  });

  if (!loading && !user) {
    r.replace("/login");
    return null;
  }

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: 60 }}>
        Loading…
      </div>
    );
  }

  const set = (k: string, v: any) =>
    setForm((f: any) => ({
      ...f,
      [k]: v,
    }));

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError("");

    const parsed = hackathonSchema.safeParse(form);

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Check the form."
      );
      return;
    }

    const lifecycle = validateLifecycle(parsed.data);

    if (lifecycle) {
      setError(lifecycle);
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);

    const timeline_events = [
      [
        "REGISTRATION",
        "Registration",
        parsed.data.registration_start,
        parsed.data.registration_end,
      ],

      [
        "HACKING",
        "Hacking",
        parsed.data.hacking_start,
        parsed.data.hacking_end,
      ],

      [
        "SUBMISSION",
        "Submission Deadline",
        parsed.data.submission_deadline,
        parsed.data.submission_deadline,
      ],

      [
        "JUDGING",
        "Judging",
        parsed.data.judging_start,
        parsed.data.judging_end,
      ],

      [
        "WINNERS",
        "Winner Announcement",
        parsed.data.winner_announcement_at,
        parsed.data.winner_announcement_at,
      ],
    ].map(([type, title, start, end]) => ({
      type,
      title,
      start_at: start,
      end_at: end,
    }));

    const { data: h, error } = await supabase.rpc("create_hackathon", {
      p_payload: {
        ...parsed.data,
        eligibility: parsed.data.eligibility ?? null,
        prizes: parsed.data.prizes,
        criteria: parsed.data.criteria,
        timeline_events,
      },
    });

    if (error || !h) {
      setError(error?.message ?? "Could not create hackathon.");
      setBusy(false);
      return;
    }

    // Success
    r.push(`/host/${h.id}`);
  }

  return (
    <AppShell>
      <div
        className="container"
        style={{ maxWidth: 900 }}
      >
        <div className="badge badge-lime">
          CREATE HACKATHON
        </div>

        <h1
          style={{
            fontSize: 44,
            margin: "12px 0 6px",
          }}
        >
          Configure your event.
        </h1>

        <p className="muted">
          Build the complete lifecycle before you publish it.
        </p>

        <form
          onSubmit={submit}
          style={{
            marginTop: 28,
            display: "grid",
            gap: 18,
          }}
        >
          {/* BASIC INFORMATION */}
          <div className="card">
            <h2>Basic information</h2>

            <div
              className="grid-auto"
              style={{ marginTop: 18 }}
            >
              <div>
                <label className="label">
                  Hackathon name
                </label>

                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    set("name", e.target.value)
                  }
                  placeholder="AI For India"
                />
              </div>

              <div>
                <label className="label">
                  Theme
                </label>

                <input
                  className="input"
                  value={form.theme}
                  onChange={(e) =>
                    set("theme", e.target.value)
                  }
                  placeholder="Artificial Intelligence"
                />
              </div>

              <div>
                <label className="label">
                  Category
                </label>

                <input
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    set("category", e.target.value)
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label className="label">
                Description
              </label>

              <textarea
                className="textarea"
                value={form.description}
                onChange={(e) =>
                  set("description", e.target.value)
                }
                placeholder="What should participants build?"
              />
            </div>
          </div>

          {/* TIMELINE */}
          <div className="card">
            <h2>Timeline</h2>

            <div
              className="grid-auto"
              style={{ marginTop: 18 }}
            >
              {/* Registration opens */}
              <div>
                <label className="label">
                  Registration opens
                </label>

                <input
                  type="datetime-local"
                  className="input"
                  value={form.registration_start}
                  onChange={(e) =>
                    set(
                      "registration_start",
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Registration closes */}
              <div>
                <label className="label">
                  Registration closes
                </label>

                <input
                  type="datetime-local"
                  className="input"
                  value={form.registration_end}
                  onChange={(e) => {
                    const value = e.target.value;
                    const end = new Date(value);

                    if (Number.isNaN(end.getTime())) {
                      set("registration_end", value);
                      return;
                    }

                    const hackingStart =
                      end.getTime() + 86400000;
                    const hackingEnd =
                      end.getTime() + 3 * 86400000;
                    const submissionDeadline =
                      end.getTime() + 4 * 86400000;
                    const judgingStart =
                      end.getTime() +
                      4 * 86400000 +
                      3600000;
                    const judgingEnd =
                      end.getTime() + 6 * 86400000;

                    setForm((f: any) => {
                      const currentWinner = new Date(
                        f.winner_announcement_at
                      ).getTime();

                      const winnerAnnouncement =
                        Number.isNaN(currentWinner) ||
                        currentWinner <= judgingEnd
                          ? iso(judgingEnd + 86400000)
                          : f.winner_announcement_at;

                      return {
                        ...f,
                        registration_end: value,
                        hacking_start: iso(hackingStart),
                        hacking_end: iso(hackingEnd),
                        submission_deadline: iso(
                          submissionDeadline
                        ),
                        judging_start: iso(judgingStart),
                        judging_end: iso(judgingEnd),
                        winner_announcement_at:
                          winnerAnnouncement,
                      };
                    });
                  }}
                />
              </div>

              {/* Winner announcement */}
              <div>
                <label className="label">
                  Winner announcement
                </label>

                <input
                  type="datetime-local"
                  className="input"
                  value={form.winner_announcement_at}
                  onChange={(e) =>
                    set(
                      "winner_announcement_at",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* PARTICIPATION */}
          <div className="card">
            <h2>Participation</h2>

            <div
              className="grid-auto"
              style={{ marginTop: 18 }}
            >
              <div>
                <label className="label">
                  Maximum team size
                </label>

                <input
                  type="number"
                  className="input"
                  value={form.max_team_size}
                  onChange={(e) =>
                    set(
                      "max_team_size",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="label">
                  Maximum participants
                </label>

                <input
                  type="number"
                  className="input"
                  value={form.max_participants}
                  onChange={(e) =>
                    set(
                      "max_participants",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label className="label">
                Eligibility
              </label>

              <input
                className="input"
                value={form.eligibility}
                onChange={(e) =>
                  set(
                    "eligibility",
                    e.target.value
                  )
                }
                placeholder="Open to students"
              />
            </div>
          </div>

          {/* PRIZES */}
          <div className="card">
            <h2>Prizes</h2>

            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 18,
              }}
            >
              {form.prizes.map(
                (p: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 140px",
                      gap: 10,
                    }}
                  >
                    <input
                      className="input"
                      value={p.title}
                      onChange={(e) => {
                        const a = [
                          ...form.prizes,
                        ];

                        a[i] = {
                          ...p,
                          title: e.target.value,
                        };

                        set("prizes", a);
                      }}
                    />

                    <input
                      type="number"
                      className="input"
                      value={p.amount}
                      onChange={(e) => {
                        const a = [
                          ...form.prizes,
                        ];

                        a[i] = {
                          ...p,
                          amount: e.target.value,
                        };

                        set("prizes", a);
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* RULES & JUDGING */}
          <div className="card">
            <h2>Rules & judging</h2>

            <div style={{ marginTop: 18 }}>
              <label className="label">
                Rules
              </label>

              <textarea
                className="textarea"
                value={form.rules}
                onChange={(e) =>
                  set("rules", e.target.value)
                }
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label className="label">
                Judging criteria
              </label>

              {form.criteria.map(
                (c: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 120px",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <input
                      className="input"
                      value={c.name}
                      onChange={(e) => {
                        const a = [
                          ...form.criteria,
                        ];

                        a[i] = {
                          ...c,
                          name: e.target.value,
                        };

                        set("criteria", a);
                      }}
                    />

                    <input
                      type="number"
                      className="input"
                      value={c.max_score}
                      onChange={(e) => {
                        const a = [
                          ...form.criteria,
                        ];

                        a[i] = {
                          ...c,
                          max_score: Number(
                            e.target.value
                          ),
                        };

                        set("criteria", a);
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div
              className="card"
              style={{ color: "#fda4af" }}
            >
              {error}
            </div>
          )}

          {/* CREATE */}
          <button
            className="btn btn-primary"
            disabled={busy}
          >
            {busy
              ? "Creating…"
              : "Create Hackathon"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}