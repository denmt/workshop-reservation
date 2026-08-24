"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Workshop } from "./WorkshopList";

type Props = { workshops?: Workshop[] };

const CARD_BG = "#1e3a8a";
const CARD_FG = "#dbeafe";

function parseDate(d?: string | null) {
  if (!d) return null;
  const t = Date.parse(d);
  return isNaN(t) ? null : new Date(t);
}

function formatDateTime(d?: string | null) {
  const date = parseDate(d);
  if (!date) return null;
  return (
    date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

export default function UpcomingCarousel({ workshops }: Props) {
  const list = Array.isArray(workshops) ? workshops : [];

  const slides = useMemo(() => {
    const now = Date.now();
    const future = list
      .map((w) => ({ w, d: parseDate(w.date || w.starts_at) }))
      .filter((x) => x.d && x.d.getTime() >= now)
      .sort((a, b) => a.d!.getTime() - b.d!.getTime())
      .map((x) => x.w);
    return future.length > 0 ? future : list;
  }, [list]);

  if (slides.length === 0) {
    return <div className="py-8 text-center text-zinc-500">No upcoming workshops.</div>;
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-block h-5 w-1.5 rounded-sm" style={{ background: "#f5e642" }} aria-hidden />
        <h2 className="text-lg font-semibold uppercase tracking-tight text-zinc-800">Upcoming Workshops</h2>
      </div>

      <Carousel
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
        className="w-full px-10"
      >
        <CarouselContent>
          {slides.map((w) => {
            const dateTime = formatDateTime(w.date || w.starts_at);
            const full = (w.seats_remaining ?? w.total_seats ?? 1) === 0;

            return (
              <CarouselItem key={w.id}>
                <Link href={`/workshops/${w.id}`} className="block group">
                  <div className="rounded-xl overflow-hidden shadow-md border border-blue-900 transition-shadow group-hover:shadow-lg">
                    <div className="px-6 pt-5 pb-4" style={{ background: CARD_BG }}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: CARD_FG }}>
                          {w.category || "General"}
                        </span>
                        {w.facilitator && (
                          <span className="text-xs opacity-60 shrink-0" style={{ color: CARD_FG }}>
                            {w.facilitator}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-xl font-bold leading-snug" style={{ color: CARD_FG }}>
                        {w.title}
                      </h3>
                    </div>

                    <div className="bg-white px-6 py-4">
                      {w.description && (
                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{w.description}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="text-xs text-zinc-400 space-y-0.5">
                          {dateTime && <div>{dateTime}</div>}
                          {full ? (
                            <div className="font-semibold text-red-500">Fully booked</div>
                          ) : (
                            <div>{w.seats_remaining ?? w.total_seats ?? "—"} seats remaining</div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-zinc-700 group-hover:underline underline-offset-4 shrink-0">
                          View details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}