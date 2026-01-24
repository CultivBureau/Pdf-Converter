"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import SuperAdminRoute from "@/app/components/SuperAdminRoute";
import LanguageToggle from "@/app/components/LanguageToggle";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Calendar,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  assignPlan,
  activateCompany,
  uploadCompanyHeaderImage,
  uploadCompanyFooterImage,
  deleteCompanyHeaderImage,
  deleteCompanyFooterImage,
  type Company,
} from "@/app/services/CompanyApi";
import { getAllPlans, type Plan } from "@/app/services/PlanApi";
import { format } from "date-fns";
import DeleteConfirmationModal from "@/app/components/DeleteConfirmationModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function CompaniesPage() {
  return (
    <SuperAdminRoute>
      <CompaniesContent />
    </SuperAdminRoute>
  );
}

function CompaniesContent() {
  const { user, logout } = useAuth();
  const { t, isRTL, dir } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formName, setFormName] = useState("");
  const [formPlanId, setFormPlanId] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image upload state
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [footerImageFile, setFooterImageFile] = useState<File | null>(null);
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);
  const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    companyId: string | null;
    type: "deactivate" | "header" | "footer";
    companyName?: string;
  }>({
    isOpen: false,
    companyId: null,
    type: "deactivate",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [companiesData, plansData] = await Promise.all([
        getAllCompanies(0, 1000),
        getAllPlans(0, 1000, true),
      ]);
      setCompanies(companiesData);
      setPlans(plansData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      setError("Company name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      // Create company first
      const newCompany = await createCompany({
        name: formName.trim(),
        plan_id: formPlanId || null,
        is_active: formIsActive,
      });
      
      // Upload images if provided
      if (headerImageFile || footerImageFile) {
        setIsUploadingImages(true);
        try {
          if (headerImageFile) {
            await uploadCompanyHeaderImage(newCompany.id, headerImageFile);
          }
          if (footerImageFile) {
            await uploadCompanyFooterImage(newCompany.id, footerImageFile);
          }
        } catch (imgErr) {
          console.error("Error uploading images:", imgErr);
          setError("Company created but failed to upload images. You can upload them later.");
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      setSuccess("Company created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create company";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCompany || !formName.trim()) {
      setError("Company name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      // Update company basic info
      await updateCompany(editingCompany.id, {
        name: formName.trim(),
        plan_id: formPlanId || null,
        is_active: formIsActive,
      });
      
      // Upload images if new files are selected
      if (headerImageFile || footerImageFile) {
        setIsUploadingImages(true);
        try {
          if (headerImageFile) {
            await uploadCompanyHeaderImage(editingCompany.id, headerImageFile);
          }
          if (footerImageFile) {
            await uploadCompanyFooterImage(editingCompany.id, footerImageFile);
          }
        } catch (imgErr) {
          console.error("Error uploading images:", imgErr);
          setError("Company updated but failed to upload images. You can upload them later.");
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      setSuccess("Company updated successfully");
      setEditingCompany(null);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update company";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (companyId: string, companyName?: string) => {
    setDeleteModal({
      isOpen: true,
      companyId,
      type: "deactivate",
      companyName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.companyId) return;

    setIsUploadingImages(deleteModal.type !== "deactivate");
    setError("");
    
    try {
      if (deleteModal.type === "deactivate") {
        await deleteCompany(deleteModal.companyId);
        setSuccess("Company deactivated successfully");
      } else if (deleteModal.type === "header") {
        await deleteCompanyHeaderImage(deleteModal.companyId);
        setSuccess("Header image deleted successfully");
        setHeaderImagePreview(null);
      } else if (deleteModal.type === "footer") {
        await deleteCompanyFooterImage(deleteModal.companyId);
        setSuccess("Footer image deleted successfully");
        setFooterImagePreview(null);
      }
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
      setDeleteModal({ isOpen: false, companyId: null, type: "deactivate" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operation failed";
      setError(message);
      setDeleteModal({ isOpen: false, companyId: null, type: "deactivate" });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleActivate = async (companyId: string) => {
    try {
      await activateCompany(companyId);
      setSuccess("Company activated successfully");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to activate company";
      setError(message);
    }
  };

  const handleAssignPlan = async (companyId: string, planId: string) => {
    try {
      await assignPlan(companyId, planId);
      setSuccess("Plan assigned successfully");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign plan";
      setError(message);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPlanId(null);
    setFormIsActive(true);
    setHeaderImageFile(null);
    setFooterImageFile(null);
    setHeaderImagePreview(null);
    setFooterImagePreview(null);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormName(company.name);
    setFormPlanId(company.plan_id || null);
    setFormIsActive(company.is_active);
    // Construct full URL for images if they exist
    const headerUrl = company.header_image
      ? company.header_image.startsWith("http")
        ? company.header_image
        : `${API_BASE_URL}${company.header_image}`
      : null;
    const footerUrl = company.footer_image
      ? company.footer_image.startsWith("http")
        ? company.footer_image
        : `${API_BASE_URL}${company.footer_image}`
      : null;
    setHeaderImagePreview(headerUrl);
    setFooterImagePreview(footerUrl);
    setHeaderImageFile(null);
    setFooterImageFile(null);
  };

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeaderImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setFooterImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadHeaderImage = async (companyId: string) => {
    if (!headerImageFile) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      await uploadCompanyHeaderImage(companyId, headerImageFile);
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

  const handleUploadFooterImage = async (companyId: string) => {
    if (!footerImageFile) return;
    
    setIsUploadingImages(true);
    setError("");
    try {
      await uploadCompanyFooterImage(companyId, footerImageFile);
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

  const handleDeleteHeaderImage = (companyId: string) => {
    setDeleteModal({
      isOpen: true,
      companyId,
      type: "header",
    });
  };

  const handleDeleteFooterImage = (companyId: string) => {
    setDeleteModal({
      isOpen: true,
      companyId,
      type: "footer",
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCompany(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className={`max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language Toggle */}
            <LanguageToggle variant="compact" />
            
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl hover:from-[#C4B454]/20 hover:to-[#B8A040]/20 border border-[#C4B454]/20 transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-shadow">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-[#B8A040] group-hover:text-[#C4B454] transition-colors" />
                </button>
                {showUserMenu && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 overflow-hidden`}>
                    <Link 
                      href="/" 
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-[#C4B454]/10 hover:to-[#B8A040]/10 transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Sparkles className="w-4 h-4 text-[#B8A040] group-hover:text-[#C4B454] transition-colors" />
                      <span className="font-medium">{t.home.welcomeTo}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">{t.common.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6  py-8">
        {/* Page Header */}
        <div className={`mb-8 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#C4B454] to-[#B8A040] bg-clip-text text-transparent mb-2">
              {t.companies.title}
            </h1>
            <p className={`text-gray-600 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Building2 className="w-4 h-4 text-[#B8A040]" />
              {t.companies.subtitle}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:from-[#B8A040] hover:to-[#A69035] hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Plus className="w-5 h-5" />
            {t.companies.addCompany}
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">{success}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Companies List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-10 h-10 text-[#B8A040] animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-[#B8A040]" />
            </div>
            <p className="text-gray-600 font-medium mb-4">No companies found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Create First Company
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => {
              const plan = plans.find((p) => p.id === company.plan_id);
              return (
                <div
                  key={company.id}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border-2 ${
                    company.is_active ? "border-green-200 hover:border-green-300" : "border-gray-200 opacity-70"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-md">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${
                          company.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {company.is_active ? (
                          <>
                            <Check className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Plan Info */}
                  {plan && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl border border-[#C4B454]/20">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Plan</p>
                      <p className="text-sm font-bold text-[#B8A040]">{plan.name}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3.5 h-3.5 text-[#B8A040]" />
                    <span>Created {format(new Date(company.created_at), "MMM d, yyyy")}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => openEditModal(company)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold transition-all hover:shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    {company.is_active ? (
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold transition-all hover:shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(company.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-green-50 text-green-700 rounded-xl hover:bg-green-100 font-semibold transition-all hover:shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        Activate
                      </button>
                    )}
                  </div>

                  {/* Plan Selector */}
                  {plans.length > 0 && (
                    <div className="relative">
                      <select
                        value={company.plan_id || ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignPlan(company.id, e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2.5 text-black text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#B8A040] transition-all font-medium appearance-none cursor-pointer hover:border-[#C4B454]"
                      >
                        <option value="">No Plan</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCompany) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#C4B454] to-[#B8A040] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {editingCompany ? "Edit Company" : "Create Company"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#B8A040] transition-all text-black placeholder:text-gray-400"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Plan (Optional)
                </label>
                <div className="relative">
                  <select
                    value={formPlanId || ""}
                    onChange={(e) => setFormPlanId(e.target.value || null)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#B8A040] transition-all appearance-none cursor-pointer text-black"
                  >
                    <option value="">No Plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 text-[#B8A040] border-gray-300 rounded focus:ring-[#C4B454] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Active Company
                </label>
              </div>

              {/* Header Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#B8A040]" />
                  Header Image (Optional)
                </label>
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-900 font-semibold text-xs mb-1">📏 Recommended Size:</p>
                  <p className="text-blue-700 text-xs">1200×200px or similar wide format (16:3 ratio)</p>
                </div>
                {headerImagePreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img
                        src={headerImagePreview}
                        alt="Header preview"
                        className="w-full h-36 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold cursor-pointer transition-all hover:shadow-md">
                        <Upload className="w-4 h-4" />
                        Change
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleHeaderImageChange}
                          className="hidden"
                        />
                      </label>
                      {editingCompany && (
                        <button
                          onClick={() => handleDeleteHeaderImage(editingCompany.id)}
                          disabled={isUploadingImages}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold disabled:opacity-50 transition-all hover:shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="block w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#B8A040] hover:bg-[#C4B454]/5 transition-all text-center group">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#B8A040] mx-auto mb-2 transition-colors" />
                    <span className="text-sm text-gray-600 group-hover:text-[#B8A040] font-medium transition-colors">Click to upload header image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleHeaderImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  JPG, PNG, GIF, or WEBP (Max 5MB)
                </p>
              </div>

              {/* Footer Image Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#B8A040]" />
                  Footer Image (Optional)
                </label>
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-900 font-semibold text-xs mb-1">📏 Recommended Size:</p>
                  <p className="text-blue-700 text-xs">1200×100px or similar wide format (12:1 ratio)</p>
                </div>
                {footerImagePreview ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                      <img
                        src={footerImagePreview}
                        alt="Footer preview"
                        className="w-full h-28 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 font-semibold cursor-pointer transition-all hover:shadow-md">
                        <Upload className="w-4 h-4" />
                        Change
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleFooterImageChange}
                          className="hidden"
                        />
                      </label>
                      {editingCompany && (
                        <button
                          onClick={() => handleDeleteFooterImage(editingCompany.id)}
                          disabled={isUploadingImages}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold disabled:opacity-50 transition-all hover:shadow-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="block w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#B8A040] hover:bg-[#C4B454]/5 transition-all text-center group">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#B8A040] mx-auto mb-2 transition-colors" />
                    <span className="text-sm text-gray-600 group-hover:text-[#B8A040] font-medium transition-colors">Click to upload footer image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFooterImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  JPG, PNG, GIF, or WEBP (Max 5MB)
                </p>
              </div>

              {/* Upload buttons for editing mode */}
              {editingCompany && (headerImageFile || footerImageFile) && (
                <div className="flex gap-2">
                  {headerImageFile && (
                    <button
                      onClick={() => handleUploadHeaderImage(editingCompany.id)}
                      disabled={isUploadingImages}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                    >
                      {isUploadingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Header
                        </>
                      )}
                    </button>
                  )}
                  {footerImageFile && (
                    <button
                      onClick={() => handleUploadFooterImage(editingCompany.id)}
                      disabled={isUploadingImages}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                    >
                      {isUploadingImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Footer
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all hover:shadow-md"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={editingCompany ? handleUpdate : handleCreate}
                  disabled={isSubmitting || isUploadingImages}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:from-[#B8A040] hover:to-[#A69035] hover:shadow-xl disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  {isSubmitting || isUploadingImages ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : editingCompany ? (
                    <>
                      <Check className="w-5 h-5" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, companyId: null, type: "deactivate" })}
        onConfirm={confirmDelete}
        title={
          deleteModal.type === "deactivate"
            ? "Deactivate Company"
            : deleteModal.type === "header"
            ? "Delete Header Image"
            : "Delete Footer Image"
        }
        message={
          deleteModal.type === "deactivate"
            ? `Are you sure you want to deactivate "${deleteModal.companyName || "this company"}"? The company will be inactive but not deleted.`
            : deleteModal.type === "header"
            ? "Are you sure you want to delete the header image? This action cannot be undone."
            : "Are you sure you want to delete the footer image? This action cannot be undone."
        }
        confirmButtonText={deleteModal.type === "deactivate" ? "Deactivate" : "Delete"}
        confirmButtonColor={deleteModal.type === "deactivate" ? "orange" : "red"}
      />
    </div>
  );
}

