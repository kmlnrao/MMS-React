import { Link, useLocation } from "wouter";
import { 
  Building,
  BarChart4, 
  UserPlus, 
  PackageCheck, 
  FileCheck, 
  LogOut, 
  Settings, 
  AlertTriangle, 
  FileText, 
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  open: boolean;
  user: Omit<User, "password"> | null;
}

export default function Sidebar({ open, user }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const LinkItem = ({ href, icon: Icon, text }: { href: string; icon: React.ElementType; text: string }) => {
    const isActive = location === href;
    
    return (
      <Link 
        href={href} 
        className={cn(
          "flex items-center px-4 py-3 hover:bg-secondary-light", 
          isActive ? "bg-secondary text-white" : "text-neutral-light hover:text-white"
        )}
      >
        <Icon className="w-5 h-5 mr-3" />
        {text}
      </Link>
    );
  };

  return (
    <aside className={cn(
      "bg-primary w-64 flex-shrink-0 transition-all duration-300 ease-in-out transform",
      open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex flex-col h-full">
        <div className="px-4 py-5 flex items-center border-b border-secondary">
          <Building className="w-8 h-8 text-white mr-2" />
          <h1 className="text-white text-xl font-medium">MMS</h1>
        </div>
        <nav className="flex-grow py-4 overflow-y-auto">
          <div className="px-4 mb-2 text-sm text-neutral-medium uppercase tracking-wider">Dashboard</div>
          <LinkItem href="/" icon={BarChart4} text="Dashboard" />
          
          <div className="px-4 mt-6 mb-2 text-sm text-neutral-medium uppercase tracking-wider">Main Functions</div>
          <LinkItem href="/registration" icon={UserPlus} text="Registration" />
          <LinkItem href="/storage" icon={PackageCheck} text="Storage Management" />
          <LinkItem href="/postmortem" icon={FileCheck} text="Postmortem" />
          <LinkItem href="/release" icon={LogOut} text="Body Release" />
          <LinkItem href="/unclaimed" icon={AlertTriangle} text="Unclaimed Bodies" />
          
          <div className="px-4 mt-6 mb-2 text-sm text-neutral-medium uppercase tracking-wider">Administration</div>
          <LinkItem href="/reports" icon={FileText} text="Reports" />
          {user && (user.role === "admin" || user.role === "mortuary_staff") && (
            <LinkItem href="/settings" icon={Settings} text="Settings" />
          )}
          {user && user.role === "admin" && (
            <LinkItem href="/users" icon={Users} text="User Management" />
          )}
        </nav>
        <div className="px-4 py-4 border-t border-secondary">
          <button 
            onClick={handleLogout}
            className="flex items-center text-neutral-light hover:text-white"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}
