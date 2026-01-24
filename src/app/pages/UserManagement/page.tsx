"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import AdminRoute from "@/app/components/AdminRoute";
import LanguageToggle from "@/app/components/LanguageToggle";
import { register, getAllUsers, deleteUser, type User, type UserRole } from "@/app/services/AuthApi";
import { getAllCompanies, type Company } from "@/app/services/CompanyApi";
import { getRoleDisplayName, getRoleBadgeColor } from "@/app/utils/rbac";
import { format } from "date-fns";
import ErrorDialog from "@/app/components/ErrorDialog";
import { 
  ChevronDown, 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Lock, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  RefreshCw,
  Building,
  Crown,
  Star,
  User as UserIcon
} from "lucide-react";

export default function UserManagementPage() {
  return (
    <AdminRoute>
      <UserManagementContent />
    </AdminRoute>
  );
}

function UserManagementContent() {
  const { user: currentUser, isSuperAdmin, logout } = useAuth();
  const { t, isRTL, dir } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // Users list state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Companies list (for Super Admin)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Fetch companies for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      const loadCompanies = async () => {
        try {
          setLoadingCompanies(true);
          const companiesList = await getAllCompanies(0, 1000);
          setCompanies(companiesList);
        } catch (err) {
          console.error("Failed to load companies:", err);
        } finally {
          setLoadingCompanies(false);
        }
      };
      loadCompanies();
    }
  }, [isSuperAdmin]);

  // Fetch users on mount and when company filter changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setUsersError("");
      const response = await getAllUsers();
      // Filter users by company if filter is set (Super Admin only)
      let filteredUsers = response.users;
      if (isSuperAdmin && companyFilter) {
        filteredUsers = response.users.filter((u) => u.company_id === companyFilter);
      } else if (!isSuperAdmin) {
        // Company Admin only sees users in their company
        filteredUsers = response.users.filter((u) => u.company_id === currentUser?.company_id);
      }
      setUsers(filteredUsers);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch users";
      setUsersError(message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Validation
    if (password !== confirmPassword) {
      setFormError(t.userManagement.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      setFormError(t.userManagement.passwordTooShort);
      return;
    }

    setIsCreating(true);

    try {
      // Super Admin can assign company_id, Company Admin uses their own company
      const userCompanyId = isSuperAdmin ? companyId : currentUser?.company_id || null;
      const response = await register({ 
        name, 
        email, 
        password, 
        role,
        company_id: userCompanyId 
      });
      setFormSuccess(t.userManagement.userCreatedSuccessfully.replace('{email}', response.user.email));
      
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("user");
      setCompanyId(null);
      
      // Refresh users list
      fetchUsers();

      // Clear success message after 5 seconds
      setTimeout(() => setFormSuccess(""), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      // Check if error is about user limit
      if (message.toLowerCase().includes("user limit") || message.toLowerCase().includes("users limit") || message.toLowerCase().includes("maximum users")) {
        setShowLimitDialog(true);
      } else {
        setFormError(message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      setFormError(t.userManagement.cannotDeleteYourOwnAccount);
      return;
    }

    setIsDeleting(userId);
    try {
      await deleteUser(userId);
      setFormSuccess(t.userManagement.userDeletedSuccessfully);
      setDeleteConfirm(null);
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setFormError(message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" dir={dir}>
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
            
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex flex-col ${isRTL ? 'items-end' : 'items-start'}`}>
                    <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                    {currentUser && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(currentUser.role)}`}>
                        {getRoleDisplayName(currentUser.role)}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {showUserMenu && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10`}>
                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.home.welcomeTo}
                    </Link>
                    <Link
                      href="/pages/History"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.home.myDocuments}
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
        <div className="mb-8">
          <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-14 h-14 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h1 className="text-4xl font-bold text-black">{t.userManagement.title}</h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full shadow-md ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Shield className="w-3 h-3" />
                  {t.home.adminOnly}
                </span>
              </div>
              <p className="text-gray-700 mt-1 text-lg">{t.userManagement.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Global Messages */}
        {formSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700">{formSuccess}</p>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#C4B454] via-[#B8A040] to-[#A69035]"></div>
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              {t.userManagement.createNewUser}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className={`block text-sm font-bold text-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.userManagement.fullName}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-black placeholder:text-gray-400 font-medium"
                  placeholder="John Doe"
                  dir={dir}
                />
              </div>

              <div>
                <label htmlFor="email" className={`flex items-center gap-2 text-sm font-bold text-black mb-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Mail className="w-4 h-4" />
                  {t.userManagement.emailAddress}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#A4C639]/20 focus:border-[#A4C639] focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="user@example.com"
                  dir={dir}
                />
              </div>

              <div>
                <label htmlFor="password" className={`flex items-center gap-2 text-sm font-bold text-black mb-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Lock className="w-4 h-4" />
                  {t.userManagement.password}
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-black placeholder:text-gray-400 font-medium"
                  placeholder="••••••••"
                  dir={dir}
                />
                <p className={`mt-1.5 text-xs text-gray-700 flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Info className="w-3 h-3" />
                  {t.userManagement.atLeast6Characters}
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-bold text-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.userManagement.confirmPassword}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-black placeholder:text-gray-400 font-medium"
                  placeholder="••••••••"
                  dir={dir}
                />
              </div>

              <div>
                <label htmlFor="role" className={`flex items-center gap-2 text-sm font-bold text-black mb-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Shield className="w-4 h-4" />
                  {t.userManagement.userRole}
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-black font-medium cursor-pointer"
                  dir={dir}
                >
                  <option value="user">{t.userManagement.userRegularAccess}</option>
                  {isSuperAdmin && <option value="superadmin">{t.userManagement.superAdminFullAccess}</option>}
                  <option value="company_admin">{t.userManagement.companyAdminManagement}</option>
                </select>
                <p className="mt-1.5 text-xs text-black bg-[#C4B454]/10 px-3 py-2 rounded-lg border border-[#C4B454]/30">
                  {role === "superadmin" 
                    ? t.userManagement.superAdminHasFullAccess
                    : role === "company_admin"
                    ? t.userManagement.companyAdminCanManage
                    : t.userManagement.regularUsersStandardAccess}
                </p>
              </div>

              {/* Company Selection (Super Admin only) */}
              {isSuperAdmin && (
                <div>
                  <label htmlFor="company" className={`flex items-center gap-2 text-sm font-bold text-black mb-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                    <Building className="w-4 h-4" />
                    {t.userManagement.companyOptional}
                  </label>
                  <select
                    id="company"
                    value={companyId || ""}
                    onChange={(e) => setCompanyId(e.target.value || null)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] focus:bg-white transition-all duration-200 text-black font-medium cursor-pointer"
                    dir={dir}
                  >
                    <option value="">{t.userManagement.noCompany}</option>
                    {loadingCompanies ? (
                      <option disabled>{t.userManagement.loadingCompanies}</option>
                    ) : (
                      companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name} {!company.is_active && `(${t.userManagement.inactive})`}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="mt-1.5 text-xs text-black bg-[#C4B454]/10 px-3 py-2 rounded-lg border border-[#C4B454]/30">
                    {role === "superadmin" 
                      ? t.userManagement.leaveEmptyForSuperAdmin
                      : t.userManagement.selectCompanyToAssign}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
              >
                {isCreating ? (
                  <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.userManagement.creating}
                  </span>
                ) : (
                  <span className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <UserPlus className="w-5 h-5" />
                    {t.userManagement.createUser}
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#C4B454] via-[#B8A040] to-[#A69035]"></div>
            <div className={`flex items-center justify-between mb-6 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className={`text-2xl font-bold text-black flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span>
                  {isSuperAdmin ? t.userManagement.allUsers : t.userManagement.companyUsers} 
                  <span className="text-[#C4B454]"> ({users.length})</span>
                </span>
              </h2>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Company Filter (Super Admin only) */}
                {isSuperAdmin && (
                  <select
                    value={companyFilter || ""}
                    onChange={(e) => {
                      setCompanyFilter(e.target.value || null);
                      fetchUsers();
                    }}
                    className="px-4 py-2 text-sm bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#C4B454] transition-all duration-200 text-black font-medium cursor-pointer"
                    dir={dir}
                  >
                    <option value="">{t.userManagement.allCompanies}</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className={`flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.userManagement.refresh}
                </button>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-[#C4B454] animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-black font-medium">{t.userManagement.loadingUsers}</p>
                </div>
              </div>
            ) : usersError ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-sm text-red-600">{usersError}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-[#C4B454]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-[#C4B454]" />
                </div>
                <p className="text-black font-semibold text-lg">{t.userManagement.noUsersFound}</p>
                <p className="text-sm text-gray-700 mt-1">{t.userManagement.createFirstUser}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const confirmingDelete = deleteConfirm === user.id;
                  const deletingUser = isDeleting === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`p-5 border-2 rounded-2xl transition-all duration-200 ${
                        isCurrentUser
                          ? "border-[#C4B454] bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 shadow-md"
                          : "border-gray-200 hover:border-[#C4B454]/40 hover:shadow-md hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="font-bold text-black">{user.name}</h3>
                            {isCurrentUser && (
                              <span className="text-xs bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white px-2 py-0.5 rounded-full font-bold">
                                {t.userManagement.you}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </div>
                          <p className={`text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>{user.email}</p>
                          {user.company_id && (
                            <p className={`text-xs text-gray-700 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t.userManagement.company}: {companies.find(c => c.id === user.company_id)?.name || user.company_id}
                            </p>
                          )}
                          {!user.company_id && user.role === "superadmin" && (
                            <p className={`text-xs text-[#C4B454] mt-1 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t.userManagement.superAdminNoCompany}
                            </p>
                          )}
                          <p className={`text-xs text-gray-700 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t.userManagement.created}: {format(new Date(user.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          {confirmingDelete ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={deletingUser}
                                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingUser ? t.userManagement.deleting : t.userManagement.confirm}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deletingUser}
                                className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                              >
                                {t.userManagement.cancel}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              disabled={isCurrentUser || deletingUser}
                              className={`flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold ${isRTL ? 'flex-row-reverse' : ''}`}
                              title={isCurrentUser ? t.userManagement.cannotDeleteOwnAccount : t.userManagement.deleteUser}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t.userManagement.delete}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Limit Error Dialog */}
      <ErrorDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        title={t.userManagement.userLimitReached}
        message={t.userManagement.userLimitMessage}
        severity="warning"
      />
    </div>
  );
}

