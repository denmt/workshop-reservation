"use client";
import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import WorkshopList from "../components/WorkshopList";
import UpcomingCarousel from "../components/UpcomingCarousel";

export default function Home() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/workshops");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          setWorkshops(data);
        } else {
          console.error("Unexpected /api/workshops response:", data);
          setWorkshops([]);
        }
      } catch (err) {
        console.error("Failed to load workshops", err);
        setError(
          "Could not connect to the backend. Make sure the backend server is running on port 4000.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-zinc-900">
      <NavBar />
      <Hero />
      <section className="relative z-20 bg-white pb-6 pt-4">
        <div className="mx-auto max-w-4xl px-6">
          <UpcomingCarousel workshops={workshops} />
        </div>
      </section>
      <main className="relative z-20 mx-auto max-w-4xl bg-white">
        {loading ? (
          <div className="px-6 py-8 text-center text-zinc-500">
            Loading workshops…
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-500">{error}</div>
        ) : (
          <WorkshopList workshops={workshops} />
        )}
      </main>
    </div>
  );
}
