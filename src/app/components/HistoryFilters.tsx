"use client";

import React from "react";
import { useHistory } from "../contexts/HistoryContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function HistoryFilters() {
  const { filterType, setFilterType, searchQuery, setSearchQuery } = useHistory();
  const { t, isRTL, dir } = useLanguage();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-7 border-2 border-slate-200 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900">{t.history.filters}</h3>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{t.history.filterByNameOrFavorites}</p>
        </div>
      </div>

      {/* Name Search */}
      <div className="mb-6">
        <label htmlFor="name-filter" className={`block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <svg className="w-5 h-5 text-[#C4B454]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {t.history.filterByName}
        </label>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl blur-xl"></div>
          <div className="relative">
            <input
              type="text"
              id="name-filter"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.history.searchByDocumentName}
              className={`w-full ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4 bg-gradient-to-br from-gray-50 to-[#C4B454]/5 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-gray-900 font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md`}
              dir={dir}
            />
            <div className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 transform -translate-y-1/2`}>
              <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Favorites Filter */}
      <div>
        <label className={`block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {t.history.showFavoritesOnly}
        </label>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setFilterType("all")}
            className={`flex-1 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterType === "all"
                ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-lg shadow-[#C4B454]/30 scale-105"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
            }`}
          >
            <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.history.allDocuments}
            </span>
          </button>
          <button
            onClick={() => setFilterType("favorites")}
            className={`flex-1 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterType === "favorites"
                ? "bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-lg shadow-[#C4B454]/30 scale-105"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105 border-2 border-slate-200"
            }`}
          >
            <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5" fill={filterType === "favorites" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {t.history.favoritesOnly}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

