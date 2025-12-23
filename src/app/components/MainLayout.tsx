"use client";

import React from "react";
import AsideBar from "./AsideBar";
import { useAuth } from "../contexts/AuthContext";
import { usePathname } from "next/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  // Pages where we don't want to show the sidebar
  const noSidebarPages = ["/pages/Login", "/pages/Register"];
  const shouldShowSidebar = user && !noSidebarPages.includes(pathname || "");

  return (
    <div className="flex min-h-screen">
      {shouldShowSidebar && <AsideBar />}
      <main className={`flex-1 ${shouldShowSidebar ? "" : "w-full"}`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
