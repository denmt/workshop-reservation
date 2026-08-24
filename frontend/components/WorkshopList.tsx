"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Command, CommandInput } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export type Workshop = {
  id: number;
  title: string;
  description?: string;
  starts_at?: string | null;
  date?: string | null;
  total_seats?: number;
  seats_remaining?: number;
  category?: string | null;
  facilitator?: string | null;
};

const CARD_BG = "#1e3a8a";
const CARD_FG = "#dbeafe";
const ITEMS_PER_PAGE = 6;

type Props = { workshops?: Workshop[] };

export default function WorkshopList({ workshops }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const safeWorkshops = useMemo(
    () => (Array.isArray(workshops) ? workshops : []),
    [workshops],
  );

  const categories = useMemo(() => {
    const cats = safeWorkshops.map((w) => w.category || "General");
    return Array.from(new Set(cats)).sort();
  }, [safeWorkshops]);

  const filtered = useMemo(() => {
    let result = safeWorkshops;
    if (category) {
      result = result.filter((w) => (w.category || "General") === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          (w.description || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [safeWorkshops, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  // Ensure page is within bounds when filtering reduces the number of pages
  const validPage = Math.min(page, totalPages);
  const currentWorkshops = filtered.slice(
    (validPage - 1) * ITEMS_PER_PAGE,
    validPage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change using a ref to detect filter changes without effect loops
  const prevFilters = React.useRef({ search, category });
  if (
    prevFilters.current.search !== search ||
    prevFilters.current.category !== category
  ) {
    prevFilters.current = { search, category };
    if (page !== 1) setPage(1);
  }

  if (safeWorkshops.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 text-center text-zinc-600">
        No workshops found.
      </div>
    );
  }

  return (
    <section className="px-6 pb-12 space-y-8">
      {/* Search and Filter Row */}
      <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-6">
        <div className="w-full md:max-w-sm">
          <Command
            className="rounded-lg border border-zinc-200 "
            shouldFilter={false}
          >
            <CommandInput
              placeholder="Search for a workshop...`"
              value={search}
              onValueChange={setSearch}
            />
          </Command>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={category === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(null)}
            className="rounded-full"
            style={
              category === null ? { background: CARD_BG, color: "white" } : {}
            }
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              variant={category === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c)}
              className="rounded-full"
              style={
                category === c ? { background: CARD_BG, color: "white" } : {}
              }
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Workshop Grid (3 in a row on lg) */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {currentWorkshops.length > 0 ? (
          currentWorkshops.map((w) => {
            const full = (w.seats_remaining ?? w.total_seats ?? 1) === 0;
            const raw = w.date || w.starts_at;
            const dateStr = raw
              ? new Date(raw).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) +
                " · " +
                new Date(raw).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null;

            return (
              <Link
                key={w.id}
                href={`/workshops/${w.id}`}
                className="block group"
              >
                <article className="h-full rounded-xl overflow-hidden shadow-sm border border-blue-900 transition-shadow group-hover:shadow-md flex flex-col">
                  <div
                    className="px-5 pt-4 pb-3 shrink-0"
                    style={{ background: CARD_BG }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: CARD_FG }}
                      >
                        {w.category || "General"}
                      </span>
                    </div>
                    <h3
                      className="mt-1.5 text-base font-bold leading-snug"
                      style={{ color: CARD_FG }}
                    >
                      {w.title}
                    </h3>
                  </div>

                  <div className="bg-white px-5 py-4 flex flex-col gap-3 flex-1">
                    {w.description && (
                      <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                        {w.description}
                      </p>
                    )}
                    <div className="flex items-end justify-between gap-4 mt-auto">
                      <div className="text-xs text-zinc-400 space-y-0.5">
                        {w.facilitator && (
                          <div className="font-medium text-zinc-500">
                            {w.facilitator}
                          </div>
                        )}
                        {dateStr && <div>{dateStr}</div>}
                        {full ? (
                          <div className="font-semibold text-red-500">
                            No seats available
                          </div>
                        ) : (
                          <div>
                            {w.seats_remaining ?? w.total_seats ?? "—"} seats
                            left
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 group-hover:underline underline-offset-4 shrink-0">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No workshops match your search.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    onClick={() => setPage(p)}
                    isActive={page === p}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
}
