"use client";

import React from "react";
import { useHistory } from "../contexts/HistoryContext";

export default function HistorySort() {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useHistory();

  const isNewestFirst = sortBy === "date" && sortOrder === "desc";
  const isOldestFirst = sortBy === "date" && sortOrder === "asc";

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-7 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900">Sort</h3>
          <p className="text-sm font-medium text-gray-600 mt-0.5">Sort documents by date</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => {
            setSortBy("date");
            setSortOrder("desc");
          }}
          className={`flex-1 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
            isNewestFirst
              ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-lg shadow-[#C4B454]/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            Newest First
          </span>
        </button>
        <button
          onClick={() => {
            setSortBy("date");
            setSortOrder("asc");
          }}
          className={`flex-1 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
            isOldestFirst
              ? "bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white shadow-lg shadow-orange-500/30 scale-105"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
            Oldest First
          </span>
        </button>
      </div>
    </div>
  );
}

