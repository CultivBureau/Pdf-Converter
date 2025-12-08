"use client";

import React, { useState } from "react";
import { useHistory } from "../contexts/HistoryContext";

export default function HistoryFilters() {
  const { filterType, setFilterType } = useHistory();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-7 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900">Filters</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 font-bold rounded-xl transition-all duration-300 border border-purple-200"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={() => setFilterType("all")}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            filterType === "all"
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            All Documents
          </span>
        </button>
        <button
          onClick={() => setFilterType("recent")}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            filterType === "recent"
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent
          </span>
        </button>
        <button
          onClick={() => setFilterType("favorites")}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            filterType === "favorites"
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <svg className="w-4 h-4" fill={filterType === "favorites" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Favorites
        </button>
        <button
          onClick={() => setFilterType("shared")}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            filterType === "shared"
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Shared
          </span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-6 border-t-2 border-slate-200 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {(["all", "week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    dateRange === range
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105 border border-slate-200"
                  }`}
                >
                  {range === "all" ? "All Time" : range === "week" ? "Last Week" : range === "month" ? "Last Month" : "Last Year"}
                </button>
              ))}
            </div>
          </div>

          {/* File Type (placeholder for future) */}
          <div>
            <label className="block text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              File Type
            </label>
            <div className="flex gap-3">
              <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 hover:scale-105 transition-all duration-300 border border-slate-200">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </span>
              </button>
              <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 hover:scale-105 transition-all duration-300 border border-slate-200">
                All Types
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

