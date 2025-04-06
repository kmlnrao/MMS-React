import React, { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} user={user} />
      
      {/* Main content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} user={user} />
        
        {/* Content area */}
        <main className="flex-grow overflow-y-auto p-6 bg-neutral-light">
          {children}
        </main>
      </div>
    </div>
  );
}
