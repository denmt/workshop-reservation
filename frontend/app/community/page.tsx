"use client";
import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import WorkshopList from "../../components/WorkshopList";

export default function CommunityPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/workshops");
        const data = await res.json();
        if (Array.isArray(data)) setWorkshops(data);
        else setWorkshops([]);
      } catch (err) {
        console.error("Failed to load workshops", err);
        setWorkshops([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      <NavBar />
      <main className="mx-auto max-w-4xl">
        <section className="px-6 py-8">
          <h1 className="text-2xl font-semibold">Community Workshops</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Explore all available community workshops below.
          </p>
        </section>
        {loading ? (
          <div className="px-6 py-8 text-center">Loading workshops…</div>
        ) : (
          <WorkshopList workshops={workshops} />
        )}
      </main>
    </div>
  );
}
