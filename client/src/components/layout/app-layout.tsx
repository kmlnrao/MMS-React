import React, { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { useAuth } from "@/hooks/use-auth";

// Function to get current year for copyright
const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

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

        {/* Footer with copyright */}
        <footer className="py-4 px-6 bg-white border-t border-neutral-medium text-center text-sm text-muted-foreground">
          <p>&copy; {getCurrentYear()} - Suvarna Technosoft Pvt Ltd all rights reserved.</p>
          <p>&#8902; All Images and Logos are Copyright of Respective Owners.</p>
        </footer>
      </div>
    </div>
  );
}
