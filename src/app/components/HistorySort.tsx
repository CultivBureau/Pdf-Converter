"use client";

import React from "react";
import { useHistory } from "../contexts/HistoryContext";

export default function HistorySort() {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useHistory();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-7 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900">Sort By</h3>
      </div>
      
      <div className="space-y-5">
        {/* Sort Field */}
        <div>
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 mb-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Sort Field
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "date", label: "Date Created", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { value: "modified", label: "Last Modified", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { value: "name", label: "Name", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
              { value: "size", label: "Size", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  sortBy === option.value
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={option.icon} />
                  </svg>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 mb-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Order
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSortOrder("desc")}
              className={`flex-1 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                sortOrder === "desc"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
                Descending
              </span>
            </button>
            <button
              onClick={() => setSortOrder("asc")}
              className={`flex-1 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                sortOrder === "asc"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
                Ascending
              </span>
            </button>
          </div>
        </div>

        {/* Quick Sort Buttons */}
        <div className="pt-5 border-t-2 border-slate-200">
          <label className="flex items-center gap-2 text-sm font-black text-slate-800 mb-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Sort
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setSortBy("date");
                setSortOrder("desc");
              }}
              className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-xl text-xs font-bold hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 border border-emerald-200 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Newest First
              </span>
            </button>
            <button
              onClick={() => {
                setSortBy("date");
                setSortOrder("asc");
              }}
              className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 rounded-xl text-xs font-bold hover:from-orange-100 hover:to-red-100 transition-all duration-300 border border-orange-200 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Oldest First
              </span>
            </button>
            <button
              onClick={() => {
                setSortBy("name");
                setSortOrder("asc");
              }}
              className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-xl text-xs font-bold hover:from-violet-100 hover:to-purple-100 transition-all duration-300 border border-violet-200 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                A-Z
              </span>
            </button>
            <button
              onClick={() => {
                setSortBy("name");
                setSortOrder("desc");
              }}
              className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 rounded-xl text-xs font-bold hover:from-pink-100 hover:to-rose-100 transition-all duration-300 border border-pink-200 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                </svg>
                Z-A
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

