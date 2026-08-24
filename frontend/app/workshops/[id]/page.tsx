"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Workshop } from "@/components/WorkshopList";

const CARD_BG = "#1e3a8a";
const CARD_FG = "#dbeafe";

function formatDateTime(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return (
    date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [workshop, setWorkshop] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formState, setFormState] = useState("idle");
  const [formMsg, setFormMsg] = useState(null);

  useEffect(() => {
    if (!id) return;
    setFetching(true);
    setFetchError(null);
    fetch(`/api/workshops/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Error " + r.status);
        return r.json();
      })
      .then((data) => setWorkshop(data))
      .catch((e) => setFetchError(e?.message ?? "Failed to load"))
      .finally(() => setFetching(false));
  }, [id]);

  function handleOpenChange(val) {
    setOpen(val);
    if (!val) {
      setName("");
      setEmail("");
      setPaymentFile(null);
      setFormState("idle");
      setFormMsg(null);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!workshop) return;
    setFormState("loading");
    setFormMsg(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop_id: workshop.id, name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormState("error");
        setFormMsg(data.error ?? "Something went wrong.");
      } else {
        setFormState("success");
        setFormMsg(
          "You are registered! A spot has been reserved for " + email + ".",
        );
        setWorkshop((prev) =>
          prev && typeof prev.seats_remaining === "number"
            ? { ...prev, seats_remaining: prev.seats_remaining - 1 }
            : prev,
        );
      }
    } catch {
      setFormState("error");
      setFormMsg("Could not connect to the server.");
    }
  }

  const dateTime = formatDateTime(workshop?.date || workshop?.starts_at);
  const full = workshop
    ? (workshop.seats_remaining ?? workshop.total_seats ?? 1) === 0
    : false;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {fetching && (
        <div className="flex items-center justify-center py-24 text-zinc-400">
          Loading...
        </div>
      )}
      {fetchError && (
        <div className="mx-auto max-w-2xl px-6 py-16 text-center text-red-500">
          {fetchError}
        </div>
      )}
      {!fetching && !fetchError && workshop && (
        <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            &larr; Back
          </button>

          {/* Gradient image placeholder banner */}
          <div
            className="w-full rounded-xl overflow-hidden relative"
            style={{
              minHeight: "240px",
              background:
                "linear-gradient(135deg,#0f2060 0%,#1e3a8a 55%,#2563eb 100%)",
            }}
          >
            <div
              className="absolute -top-10 -right-10 h-52 w-52 rounded-full"
              style={{ background: "rgba(96,165,250,0.12)" }}
            />
            <div
              className="absolute -bottom-14 -left-14 h-60 w-60 rounded-full"
              style={{ background: "rgba(147,197,253,0.10)" }}
            />
            <div className="absolute top-4 left-4">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#bfdbfe",
                }}
              >
                {workshop.category || "General"}
              </span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="rounded-full p-4"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#93c5fd"
                  strokeWidth="1.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p
                className="text-sm font-semibold tracking-wide"
                style={{ color: "#bfdbfe" }}
              >
                Workshop Photo
              </p>
              <p
                className="text-xs"
                style={{ color: "rgba(147,197,253,0.55)" }}
              >
                Image will be added by the organizer
              </p>
            </div>
          </div>

          {/* Detail card */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <div className="px-8 pt-7 pb-6" style={{ background: CARD_BG }}>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: CARD_FG }}
              >
                {workshop.category || "General"}
              </span>
              <h1
                className="mt-2 text-3xl font-bold leading-tight"
                style={{ color: CARD_FG }}
              >
                {workshop.title}
              </h1>
              {workshop.facilitator && (
                <p
                  className="mt-2 text-sm opacity-70"
                  style={{ color: CARD_FG }}
                >
                  Facilitated by {workshop.facilitator}
                </p>
              )}
            </div>
            <div className="bg-white px-8 py-6 space-y-5">
              {workshop.description && (
                <p className="text-zinc-600 leading-relaxed">
                  {workshop.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 text-sm">
                {dateTime && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">
                      Date &amp; Time
                    </div>
                    <div className="font-medium text-zinc-700">{dateTime}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    Seats
                  </div>
                  {full ? (
                    <div className="font-semibold text-red-500">
                      Fully Booked
                    </div>
                  ) : (
                    <div className="font-medium text-zinc-700">
                      {workshop.seats_remaining} / {workshop.total_seats}{" "}
                      remaining
                    </div>
                  )}
                </div>
              </div>

              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <button
                    disabled={full}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 px-4"
                    style={{
                      background: full ? "#e4e4e7" : CARD_BG,
                      color: full ? "#71717a" : "#fff",
                    }}
                  >
                    {full ? "Fully Booked - Registration Closed" : "Register"}
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register for Workshop</DialogTitle>
                    <DialogDescription>
                      {workshop.title} &mdash; {dateTime ?? "Date TBA"}
                    </DialogDescription>
                  </DialogHeader>

                  {formState === "success" ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-5 py-4 text-green-700 text-sm mt-2">
                      {formMsg}
                    </div>
                  ) : (
                    <form
                      onSubmit={handleRegister}
                      className="space-y-4 mt-2 overflow-hidden w-full"
                    >
                      <div>
                        <label
                          className="block text-sm font-medium text-zinc-700 mb-1"
                          htmlFor="dlg-name"
                        >
                          Full Name
                        </label>
                        <input
                          id="dlg-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          disabled={formState === "loading"}
                          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium text-zinc-700 mb-1"
                          htmlFor="dlg-email"
                        >
                          Email Address
                        </label>
                        <input
                          id="dlg-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={formState === "loading"}
                          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Proof of Payment{" "}
                          <span className="font-normal text-xs text-zinc-400">
                            (receipt or screenshot)
                          </span>
                        </label>
                        <div
                          onClick={() =>
                            formState !== "loading" &&
                            fileInputRef.current?.click()
                          }
                          className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 shrink-0 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <div className="relative flex-1 h-5 min-w-0">
                            <span
                              className={
                                "absolute inset-0 truncate " +
                                (paymentFile
                                  ? "font-medium text-zinc-700"
                                  : "text-zinc-400")
                              }
                            >
                              {paymentFile
                                ? paymentFile.name
                                : "Click to attach a file"}
                            </span>
                          </div>
                          {paymentFile && (
                            <button
                              type="button"
                              aria-label="Remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                              className="shrink-0 text-lg leading-none text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) =>
                            setPaymentFile(e.target.files?.[0] ?? null)
                          }
                          disabled={formState === "loading"}
                        />
                        <p className="mt-1 text-xs text-zinc-400">
                          Accepted: JPG, PNG, or PDF &mdash; max 5 MB
                        </p>
                      </div>

                      {formState === "error" && formMsg && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
                          {formMsg}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={formState === "loading"}
                        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: CARD_BG }}
                      >
                        {formState === "loading"
                          ? "Reserving your spot..."
                          : "Confirm Registration"}
                      </button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
