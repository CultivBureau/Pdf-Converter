"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import CompanyAdminRoute from "@/app/components/CompanyAdminRoute";
import {
  getCompanySettings,
  updateCompanySettings,
  getCompanyUsage,
  getCompanyUsers,
  getCompanyPlan,
  uploadCompanyHeaderImage,
  uploadCompanyFooterImage,
  deleteCompanyHeaderImage,
  deleteCompanyFooterImage,
  addAirlineCompany,
  removeAirlineCompany,
  addIncludesAllOption,
  removeIncludesAllOption,
  type CompanySettings,
  type UsageSummary,
  type CompanyPlan,
} from "@/app/services/CompanySettingsApi";
import { format } from "date-fns";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function CompanySettingsPage() {
  return (
    <CompanyAdminRoute>
      <CompanySettingsContent />
    </CompanyAdminRoute>
  );
}

function CompanySettingsContent() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [plan, setPlan] = useState<CompanyPlan | null>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [editingName, setEditingName] = useState(false);
  const [formName, setFormName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Image upload state
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [footerImageFile, setFooterImageFile] = useState<File | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Usage filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Airline companies and includes all options state
  const [newAirlineCompany, setNewAirlineCompany] = useState("");
  const [newIncludesAllOption, setNewIncludesAllOption] = useState("");
  const [isManagingAirlineCompanies, setIsManagingAirlineCompanies] = useState(false);
  const [isManagingIncludesAll, setIsManagingIncludesAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [settingsData, usageData, planData, usersData] = await Promise.all([
        getCompanySettings(),
        getCompanyUsage(selectedMonth, selectedYear),
        getCompanyPlan(),
        getCompanyUsers(0, 100),
      ]);
      setSettings(settingsData);
      setUsage(usageData);
      setPlan(planData);
      setCompanyUsers(usersData.users || []);
      setFormName(settingsData.name);
      setHeaderImageFile(null);
      setFooterImageFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!formName.trim()) {
      setError("Company name is required");
      return;
    }

    setIsUpdating(true);
    setError("");
    try {
      const updated = await updateCompanySettings(formName.trim());
      setSettings(updated);
      setSuccess("Company name updated successfully");
      setEditingName(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update company name";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload JPG, PNG, GIF, or WEBP image.");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum size is 5MB.");
        return;
      }
      setHeaderImageFile(file);
    }
  };

  const handleFooterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Please upload JPG, PNG, GIF, or WEBP image.");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum size is 5MB.");
        return;
      }
      setFooterImageFile(file);
    }
  };

  const handleUploadHeaderImage = async () => {
    if (!headerImageFile) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      const updated = await uploadCompanyHeaderImage(headerImageFile);
      setSettings(updated);
      setSuccess("Header image uploaded successfully");
      setHeaderImageFile(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload header image";
      setError(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleUploadFooterImage = async () => {
    if (!footerImageFile) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      const updated = await uploadCompanyFooterImage(footerImageFile);
      setSettings(updated);
      setSuccess("Footer image uploaded successfully");
      setFooterImageFile(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload footer image";
      setError(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteHeaderImage = async () => {
    if (!confirm("Are you sure you want to delete the header image?")) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      const updated = await deleteCompanyHeaderImage();
      setSettings(updated);
      setSuccess("Header image deleted successfully");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete header image";
      setError(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteFooterImage = async () => {
    if (!confirm("Are you sure you want to delete the footer image?")) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      const updated = await deleteCompanyFooterImage();
      setSettings(updated);
      setSuccess("Footer image deleted successfully");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete footer image";
      setError(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleAddAirlineCompany = async () => {
    if (!newAirlineCompany.trim()) {
      setError("Airline company name is required");
      return;
    }

    setError("");
    try {
      const result = await addAirlineCompany(newAirlineCompany.trim());
      setSettings({ ...settings!, airline_companies: result.airline_companies });
      setNewAirlineCompany("");
      setSuccess("Airline company added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add airline company";
      setError(message);
    }
  };

  const handleRemoveAirlineCompany = async (index: number) => {
    if (!confirm("Are you sure you want to remove this airline company?")) return;

    setError("");
    try {
      const result = await removeAirlineCompany(index);
      setSettings({ ...settings!, airline_companies: result.airline_companies });
      setSuccess("Airline company removed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove airline company";
      setError(message);
    }
  };

  const handleAddIncludesAllOption = async () => {
    if (!newIncludesAllOption.trim()) {
      setError("Option text is required");
      return;
    }

    setError("");
    try {
      const result = await addIncludesAllOption(newIncludesAllOption.trim());
      setSettings({ ...settings!, includes_all_options: result.includes_all_options });
      setNewIncludesAllOption("");
      setSuccess("Includes all option added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add includes all option";
      setError(message);
    }
  };

  const handleRemoveIncludesAllOption = async (index: number) => {
    if (!confirm("Are you sure you want to remove this option?")) return;

    setError("");
    try {
      const result = await removeIncludesAllOption(index);
      setSettings({ ...settings!, includes_all_options: result.includes_all_options });
      setSuccess("Includes all option removed successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove includes all option";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
               src="/logo.png"
              alt="Buearau logo"
                width={140}
                height={50}
                className="object-contain cursor-pointer"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-black">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Home
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Company Settings
          </h1>
          <p className="text-gray-700 text-lg">Manage your company settings and view usage statistics</p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C4B454]"></div>
            <p className="mt-2 text-black font-medium">Loading settings...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Company Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Company Name
                  </label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] text-black font-medium"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isUpdating}
                        className="px-4 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setFormName(settings?.name || "");
                        }}
                        className="px-4 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-lg font-semibold text-black">{settings?.name}</span>
                      <button
                        onClick={() => setEditingName(true)}
                        className="px-3 py-2 text-sm bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Status
                  </label>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-medium ${
                        settings?.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {settings?.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Branding Images Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-black mb-4">Branding Images</h3>
                <p className="text-sm text-black mb-4">
                  Upload header and footer images that will appear on all PDF documents generated for your company.
                </p>

                {/* Header Image */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-black mb-2">
                    Header Image
                  </label>
                  <div className="mb-2 p-1.5 bg-[#C4B454]/10 border border-[#C4B454]/30 rounded text-xs max-h-16 overflow-y-auto">
                    <p className="text-black font-semibold text-xs leading-tight mb-0.5">📏 Recommended Size:</p>
                    <p className="text-black text-xs leading-tight">1200×200px or similar wide format (16:3 ratio) for best results</p>
                  </div>
                  {settings?.header_image ? (
                    <div className="space-y-2">
                      <img
                        src={settings.header_image.startsWith("http") ? settings.header_image : `${API_BASE_URL}${settings.header_image}`}
                        alt="Header"
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex gap-2">
                        <label className="flex-1 px-3 py-2 text-sm bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium text-center cursor-pointer">
                          Change
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleHeaderImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={handleDeleteHeaderImage}
                          disabled={isUploadingImages}
                          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                      {headerImageFile && (
                        <button
                          onClick={handleUploadHeaderImage}
                          disabled={isUploadingImages}
                          className="w-full px-4 py-2 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                        >
                          {isUploadingImages ? "Uploading..." : "Upload New Header Image"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C4B454] transition-colors text-center">
                        <span className="text-sm text-black">Click to upload header image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleHeaderImageChange}
                          className="hidden"
                        />
                      </label>
                      {headerImageFile && (
                        <button
                          onClick={handleUploadHeaderImage}
                          disabled={isUploadingImages}
                          className="w-full px-4 py-2 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                        >
                          {isUploadingImages ? "Uploading..." : "Upload Header Image"}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-black mt-1">JPG, PNG, GIF, or WEBP (Max 5MB)</p>
                </div>

                {/* Footer Image */}
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Footer Image
                  </label>
                  <div className="mb-2 p-1.5 bg-[#C4B454]/10 border border-[#C4B454]/30 rounded text-xs max-h-16 overflow-y-auto">
                    <p className="text-black font-semibold text-xs leading-tight mb-0.5">📏 Recommended Size:</p>
                    <p className="text-black text-xs leading-tight">1200×100px or similar wide format (12:1 ratio) for best results</p>
                  </div>
                  {settings?.footer_image ? (
                    <div className="space-y-2">
                      <img
                        src={settings.footer_image.startsWith("http") ? settings.footer_image : `${API_BASE_URL}${settings.footer_image}`}
                        alt="Footer"
                        className="w-full h-24 object-cover rounded-xl border-2 border-gray-200"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex gap-2">
                        <label className="flex-1 px-3 py-2 text-sm bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium text-center cursor-pointer">
                          Change
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFooterImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={handleDeleteFooterImage}
                          disabled={isUploadingImages}
                          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                      {footerImageFile && (
                        <button
                          onClick={handleUploadFooterImage}
                          disabled={isUploadingImages}
                          className="w-full px-4 py-2 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                        >
                          {isUploadingImages ? "Uploading..." : "Upload New Footer Image"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#C4B454] transition-colors text-center">
                        <span className="text-sm text-black">Click to upload footer image</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleFooterImageChange}
                          className="hidden"
                        />
                      </label>
                      {footerImageFile && (
                        <button
                          onClick={handleUploadFooterImage}
                          disabled={isUploadingImages}
                          className="w-full px-4 py-2 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50"
                        >
                          {isUploadingImages ? "Uploading..." : "Upload Footer Image"}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-black mt-1">JPG, PNG, GIF, or WEBP (Max 5MB)</p>
                </div>
              </div>

              {/* Airline Companies Management */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-black">Airline Companies</h3>
                  <button
                    onClick={() => setIsManagingAirlineCompanies(!isManagingAirlineCompanies)}
                    className="px-3 py-1.5 text-sm bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium"
                  >
                    {isManagingAirlineCompanies ? "Hide" : "Manage"}
                  </button>
                </div>
                <p className="text-sm text-black mb-4">
                  Manage airline companies that will appear in the dropdown when adding airplane sections.
                </p>
                {isManagingAirlineCompanies && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAirlineCompany}
                        onChange={(e) => setNewAirlineCompany(e.target.value)}
                        placeholder="Enter airline company name"
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C4B454]/20 focus:border-[#C4B454] text-black"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddAirlineCompany();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddAirlineCompany}
                        className="px-4 py-2 bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {settings?.airline_companies && settings.airline_companies.length > 0 ? (
                        settings.airline_companies.map((company, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <span className="text-black font-medium">{company}</span>
                            <button
                              onClick={() => handleRemoveAirlineCompany(index)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No airline companies added yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel Includes All Options Management */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-black">Hotel Includes All Options</h3>
                  <button
                    onClick={() => setIsManagingIncludesAll(!isManagingIncludesAll)}
                    className="px-3 py-1.5 text-sm bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium"
                  >
                    {isManagingIncludesAll ? "Hide" : "Manage"}
                  </button>
                </div>
                <p className="text-sm text-black mb-4">
                  Manage options that will appear in the dropdown when adding hotel sections. "Includes All" is the default option.
                </p>
                {isManagingIncludesAll && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newIncludesAllOption}
                        onChange={(e) => setNewIncludesAllOption(e.target.value)}
                        placeholder="Enter option text (e.g., Includes Breakfast)"
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#C4B454]/20 focus:border-[#C4B454] text-black"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddIncludesAllOption();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddIncludesAllOption}
                        className="px-4 py-2 bg-[#C4B454] text-white rounded-lg hover:bg-[#B8A040] font-medium"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {settings?.includes_all_options && settings.includes_all_options.length > 0 ? (
                        settings.includes_all_options.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <span className="text-black font-medium">{option}</span>
                            {index === 0 && option === "Includes All" ? (
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">Default</span>
                            ) : (
                              <button
                                onClick={() => handleRemoveIncludesAllOption(index)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No options added yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Information */}
            <div className="bg-white rounded-2xl text-black shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Current Plan
              </h2>

              {plan?.plan ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl border border-[#C4B454]/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-black">{plan.plan.name}</h3>
                      {plan.plan.is_trial && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          Trial
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#C4B454] mb-4">
                      ${plan.plan.price_monthly.toFixed(2)}<span className="text-sm text-black">/month</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-black">Uploads:</span>
                        <span className="font-semibold ml-2">
                          {plan.plan.limits.uploads_per_month === 0
                            ? "Unlimited"
                            : plan.plan.limits.uploads_per_month}
                        </span>
                      </div>
                      <div>
                        <span className="text-black">Users:</span>
                        <span className="font-bold ml-2 text-black">{plan.plan.limits.users_limit}</span>
                      </div>
                      <div>
                        <span className="text-black">Pages:</span>
                        <span className="font-semibold ml-2">
                          {plan.plan.limits.pages_per_month === 0
                            ? "Unlimited"
                            : plan.plan.limits.pages_per_month}
                        </span>
                      </div>
                      <div>
                        <span className="text-black">Exports:</span>
                        <span className="font-semibold ml-2">
                          {plan.plan.limits.pdf_exports === 0
                            ? "Unlimited"
                            : plan.plan.limits.pdf_exports}
                        </span>
                      </div>
                    </div>
                  </div>
                  {plan.plan_started_at && (
                    <div className="text-xs text-black">
                      Started: {format(new Date(plan.plan_started_at), "MMM d, yyyy")}
                    </div>
                  )}
                  {plan.plan_expires_at && (
                    <div className="text-xs text-black">
                      Expires: {format(new Date(plan.plan_expires_at), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No plan assigned</p>
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Usage Statistics
                </h2>
       
              </div>

              {usage && plan?.plan && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Uploads */}
                  <div className="p-4 bg-[#C4B454]/10 rounded-xl border border-[#C4B454]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-black font-semibold">Total Uploads</p>
                      {plan.plan.limits.uploads_per_month > 0 && (
                        <span className="text-xs font-bold text-[#C4B454] bg-white px-2 py-1 rounded">
                          {usage.total_uploads} / {plan.plan.limits.uploads_per_month}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#C4B454] mb-2">{usage.total_uploads}</p>
                    {plan.plan.limits.uploads_per_month > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className="bg-[#C4B454] h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.total_uploads / plan.plan.limits.uploads_per_month) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {plan.plan.limits.uploads_per_month - usage.total_uploads > 0
                            ? `${plan.plan.limits.uploads_per_month - usage.total_uploads} remaining`
                            : "Limit reached"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">Unlimited</p>
                    )}
                  </div>

                  {/* OCR Pages */}
                  <div className="p-4 bg-[#B8A040]/10 rounded-xl border border-[#B8A040]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-black font-semibold">OCR Pages</p>
                      {plan.plan.limits.pages_per_month > 0 && (
                        <span className="text-xs font-bold text-[#B8A040] bg-white px-2 py-1 rounded">
                          {usage.total_ocr_pages} / {plan.plan.limits.pages_per_month}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#B8A040] mb-2">{usage.total_ocr_pages}</p>
                    {plan.plan.limits.pages_per_month > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className="bg-[#B8A040] h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.total_ocr_pages / plan.plan.limits.pages_per_month) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {plan.plan.limits.pages_per_month - usage.total_ocr_pages > 0
                            ? `${plan.plan.limits.pages_per_month - usage.total_ocr_pages} remaining`
                            : "Limit reached"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">Unlimited</p>
                    )}
                  </div>

                  {/* PDF Exports */}
                  <div className="p-4 bg-[#A69035]/10 rounded-xl border border-[#A69035]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-black font-semibold">PDF Exports</p>
                      {plan.plan.limits.pdf_exports > 0 && (
                        <span className="text-xs font-bold text-[#A69035] bg-white px-2 py-1 rounded">
                          {usage.total_pdf_exports} / {plan.plan.limits.pdf_exports}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#A69035] mb-2">{usage.total_pdf_exports}</p>
                    {plan.plan.limits.pdf_exports > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className="bg-[#A69035] h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((usage.total_pdf_exports / plan.plan.limits.pdf_exports) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {plan.plan.limits.pdf_exports - usage.total_pdf_exports > 0
                            ? `${plan.plan.limits.pdf_exports - usage.total_pdf_exports} remaining`
                            : "Limit reached"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">Unlimited</p>
                    )}
                  </div>

                  {/* Users */}
                  <div className="p-4 bg-[#9B7E2A]/10 rounded-xl border border-[#9B7E2A]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-black font-semibold">Users</p>
                      {plan.plan.limits.users_limit > 0 && (
                        <span className="text-xs font-bold text-[#9B7E2A] bg-white px-2 py-1 rounded">
                          {companyUsers.length} / {plan.plan.limits.users_limit}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#9B7E2A] mb-2">{companyUsers.length}</p>
                    {plan.plan.limits.users_limit > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className="bg-[#9B7E2A] h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((companyUsers.length / plan.plan.limits.users_limit) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {plan.plan.limits.users_limit - companyUsers.length > 0
                            ? `${plan.plan.limits.users_limit - companyUsers.length} remaining`
                            : "Limit reached"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">Unlimited</p>
                    )}
                  </div>
                </div>
              )}
              
              {usage && !plan?.plan && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#C4B454]/10 rounded-xl border border-[#C4B454]/30">
                    <p className="text-sm text-black mb-1">Total Uploads</p>
                    <p className="text-2xl font-bold text-[#C4B454]">{usage.total_uploads}</p>
                    <p className="text-xs text-gray-600 mt-1">No plan limits</p>
                  </div>
                  <div className="p-4 bg-[#B8A040]/10 rounded-xl border border-[#B8A040]/30">
                    <p className="text-sm text-black mb-1">OCR Pages</p>
                    <p className="text-2xl font-bold text-[#B8A040]">{usage.total_ocr_pages}</p>
                    <p className="text-xs text-gray-600 mt-1">No plan limits</p>
                  </div>
                  <div className="p-4 bg-[#A69035]/10 rounded-xl border border-[#A69035]/30">
                    <p className="text-sm text-black mb-1">PDF Exports</p>
                    <p className="text-2xl font-bold text-[#A69035]">{usage.total_pdf_exports}</p>
                    <p className="text-xs text-gray-600 mt-1">No plan limits</p>
                  </div>
                  <div className="p-4 bg-[#9B7E2A]/10 rounded-xl border border-[#9B7E2A]/30">
                    <p className="text-sm text-black mb-1">Users</p>
                    <p className="text-2xl font-bold text-[#9B7E2A]">{companyUsers.length}</p>
                    <p className="text-xs text-gray-600 mt-1">No plan limits</p>
                  </div>
                </div>
              )}

              {usage && (
                <div className="mt-4 text-xs text-black">
                  Period: {format(new Date(usage.period_start), "MMM d")} - {format(new Date(usage.period_end), "MMM d, yyyy")}
                </div>
              )}
            </div>

            {/* Company Users */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 lg:col-span-2">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                Company Users ({companyUsers.length})
              </h2>

              {companyUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users in this company</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyUsers.map((companyUser) => (
                    <div
                      key={companyUser.id}
                      className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#C4B454]/40 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-semibold">
                          {companyUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-black">{companyUser.name}</p>
                          <p className="text-xs text-black">{companyUser.email}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-[#C4B454] text-white rounded-full font-bold">
                          {companyUser.role === "company_admin" ? "Company Admin" : companyUser.role === "user" ? "User" : companyUser.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

