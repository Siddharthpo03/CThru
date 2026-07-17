import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import RecentReviews from "../components/dashboard/RecentReviews";
import { apiRequest } from "../services/api";
import { Search, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";

export default function AllReviews() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const data = await apiRequest("/reviews");
        setReviews(data.reviews || []);
        setFilteredReviews(data.reviews || []);
      } catch (error) {
        toast.error("Error connecting to data layer: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  useEffect(() => {
    let result = reviews;
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(query) ||
          r.language?.toLowerCase().includes(query),
      );
    }

    if (selectedLang !== "All") {
      result = result.filter((r) => r.language === selectedLang);
    }

    setFilteredReviews(result);
  }, [searchQuery, selectedLang, reviews]);

  const explicitLanguages = [
    "All",
    ...new Set(reviews.map((r) => r.language).filter(Boolean)),
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Historical Reports Archive
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Browse, inspect metrics, or extract clean structural builds across
            all historic evaluations.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by report title parameters..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-sm rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-zinc-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 text-sm py-2.5 px-3 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition text-zinc-700 dark:text-zinc-300"
            >
              {explicitLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reuse RecentReviews directly as our structured data renderer */}
        <RecentReviews reviews={filteredReviews} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
