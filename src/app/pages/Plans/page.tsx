"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { getAllPlans, createPlan, updatePlan, deletePlan, type Plan, type PlanCreate } from "@/app/services/PlanApi";
import { format } from "date-fns";
import LanguageToggle from "@/app/components/LanguageToggle";
import { 
  ChevronDown, 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Loader2, 
  Calendar,
  Check,
  X,
  Target,
  TrendingUp,
  Save,
  Sparkles
} from "lucide-react";

export default function PlansPage() {
  return <PlansContent />;
}

function PlansContent() {
  const { user, isSuperAdmin, logout } = useAuth();
  const { t, isRTL, dir } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState(0);
  const [formIsTrial, setFormIsTrial] = useState(false);
  const [formDurationDays, setFormDurationDays] = useState<number | null>(null);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formLimits, setFormLimits] = useState({
    uploads_per_month: 0,
    users_limit: 1,
    pages_per_month: 0,
    pdf_exports: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError("");
      const plansData = await getAllPlans(0, 1000);
      setPlans(plansData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch plans";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      setError("Plan name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const planData: PlanCreate = {
        name: formName.trim(),
        price_monthly: formPrice,
        is_trial: formIsTrial,
        duration_days: formDurationDays,
        is_active: formIsActive,
        limits: formLimits,
      };
      await createPlan(planData);
      setSuccess("Plan created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchPlans();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create plan";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPlan || !formName.trim()) {
      setError("Plan name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await updatePlan(editingPlan.id, {
        name: formName.trim(),
        price_monthly: formPrice,
        is_trial: formIsTrial,
        duration_days: formDurationDays,
        is_active: formIsActive,
        limits: formLimits,
      });
      setSuccess("Plan updated successfully");
      setEditingPlan(null);
      resetForm();
      fetchPlans();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update plan";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to deactivate this plan?")) return;

    try {
      await deletePlan(planId);
      setSuccess("Plan deactivated successfully");
      fetchPlans();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to deactivate plan";
      setError(message);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice(0);
    setFormIsTrial(false);
    setFormDurationDays(null);
    setFormIsActive(true);
    setFormLimits({
      uploads_per_month: 0,
      users_limit: 1,
      pages_per_month: 0,
      pdf_exports: 0,
    });
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPrice(plan.price_monthly);
    setFormIsTrial(plan.is_trial);
    setFormDurationDays(plan.duration_days);
    setFormIsActive(plan.is_active);
    setFormLimits(plan.limits);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingPlan(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50" dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className={`max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
             src="/logo.png"
              alt="Buearau logo"
                width={140}
                height={60}
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
                  className={`flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {showUserMenu && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10`}>
                    <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {t.home.welcomeTo}
                    </Link>
                    <button
                      onClick={logout}
                      className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-red-600 hover:bg-red-50`}
                    >
                      {t.common.logout}
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
        <div className={`mb-8 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-4xl font-bold text-black mb-2">
              {t.plans.title}
            </h1>
            <p className="text-gray-700 text-lg">
              {isSuperAdmin ? t.plans.subtitle : (isRTL ? 'عرض الخطط المتاحة' : 'View available plans')}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="w-5 h-5" />
              {t.plans.addPlan}
            </button>
          )}
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

        {/* Plans List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-[#C4B454] animate-spin mx-auto" />
            <p className="mt-2 text-black font-medium">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-[#C4B454]" />
            </div>
            <p className="text-black font-semibold text-lg mb-2">No plans found</p>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:shadow-xl shadow-lg transition-all transform hover:scale-105 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create First Plan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl p-8 border-2 hover:shadow-2xl transition-all ${
                  plan.is_active ? "border-[#C4B454]" : "border-gray-300 opacity-60"
                } ${plan.is_trial ? "border-[#C4B454] bg-gradient-to-br from-[#C4B454]/5 to-[#B8A040]/5" : ""}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                      {plan.is_trial && (
                        <span className="flex items-center gap-1 text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold border-2 border-yellow-300">
                          <Target className="w-3 h-3" />
                          Trial
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-3xl font-bold text-[#C4B454]">
                        ${plan.price_monthly.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-700 font-medium">/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-bold border-2 shadow-sm ${
                          plan.is_active
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {plan.is_active ? <><Check className="w-3 h-3" /> Active</> : <><X className="w-3 h-3" /> Inactive</>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                    <span className="text-black font-medium text-sm">Uploads/month:</span>
                    <span className="font-bold text-black text-base">
                      {plan.limits.uploads_per_month === 0 ? "∞ Unlimited" : plan.limits.uploads_per_month}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                    <span className="text-black font-medium text-sm">Users:</span>
                    <span className="font-bold text-black text-base">{plan.limits.users_limit}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                    <span className="text-black font-medium text-sm">Pages/month:</span>
                    <span className="font-bold text-black text-base">
                      {plan.limits.pages_per_month === 0 ? "∞ Unlimited" : plan.limits.pages_per_month}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                    <span className="text-black font-medium text-sm">PDF Exports:</span>
                    <span className="font-bold text-black text-base">
                      {plan.limits.pdf_exports === 0 ? "∞ Unlimited" : plan.limits.pdf_exports}
                    </span>
                  </div>
                  {plan.is_trial && plan.duration_days && (
                    <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                      <span className="text-black font-medium text-sm">Duration:</span>
                      <span className="font-bold text-black text-base">{plan.duration_days} days</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-black font-medium mb-6 bg-gray-100 p-3 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  Created: {format(new Date(plan.created_at), "MMM d, yyyy")}
                </div>

                {isSuperAdmin && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl hover:shadow-lg font-bold transition-all transform hover:scale-105"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-bold border-2 border-red-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal (Super Admin only) */}
      {isSuperAdmin && (showCreateModal || editingPlan) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8 border-2 border-[#C4B454]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-black">
                {editingPlan ? "Edit Plan" : "Create New Plan"}
              </h2>
            </div>

            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-bold text-black mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                  placeholder="Enter plan name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Duration Days (Trial)
                  </label>
                  <input
                    type="number"
                    value={formDurationDays || ""}
                    onChange={(e) => setFormDurationDays(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 bg-[#C4B454]/10 p-4 rounded-xl border border-[#C4B454]/30">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isTrial"
                    checked={formIsTrial}
                    onChange={(e) => setFormIsTrial(e.target.checked)}
                    className="w-5 h-5 text-[#C4B454] border-gray-300 rounded focus:ring-[#C4B454]"
                  />
                  <label htmlFor="isTrial" className="flex items-center gap-2 text-sm font-bold text-black">
                    <Target className="w-4 h-4" />
                    Is Trial Plan
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-5 h-5 text-[#C4B454] border-gray-300 rounded focus:ring-[#C4B454]"
                  />
                  <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-bold text-black">
                    <Check className="w-4 h-4" />
                    Active
                  </label>
                </div>
              </div>

              <div className="border-t-2 border-[#C4B454]/30 pt-6">
                <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Plan Limits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Uploads/Month (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={formLimits.uploads_per_month}
                      onChange={(e) =>
                        setFormLimits({ ...formLimits, uploads_per_month: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Users Limit
                    </label>
                    <input
                      type="number"
                      value={formLimits.users_limit}
                      onChange={(e) =>
                        setFormLimits({ ...formLimits, users_limit: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Pages/Month (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={formLimits.pages_per_month}
                      onChange={(e) =>
                        setFormLimits({ ...formLimits, pages_per_month: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      PDF Exports (0 = unlimited)
                    </label>
                    <input
                      type="number"
                      value={formLimits.pdf_exports}
                      onChange={(e) =>
                        setFormLimits({ ...formLimits, pdf_exports: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t-2 border-[#C4B454]/30">
                <button
                  onClick={closeModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200 border-2 border-gray-300 transition-all"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={editingPlan ? handleUpdate : handleCreate}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 shadow-lg transition-all transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : editingPlan ? (
                    <>
                      <Save className="w-5 h-5" />
                      Update Plan
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

