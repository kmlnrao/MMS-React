import { Link, useLocation } from "wouter";
import { 
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
import logoImage from "@/assets/logo.png";

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
          "flex items-center px-4 py-3 transition-colors duration-200", 
          isActive 
            ? "bg-[rgba(30,136,229,0.25)] text-white border-l-4 border-[#e3f2fd]" 
            : "text-[#e3f2fd] hover:bg-[rgba(30,136,229,0.15)] hover:text-white"
        )}
      >
        <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-[#90caf9]")} />
        {text}
      </Link>
    );
  };

  return (
    <aside className={cn(
      "bg-[#1976d2] w-64 flex-shrink-0 transition-all duration-300 ease-in-out transform shadow-lg",
      open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex flex-col h-full">
        <div className="px-4 py-5 flex items-center border-b border-[rgba(255,255,255,0.2)]">
          <div style={{ width: '45px', height: '45px', position: 'relative', overflow: 'visible', marginRight: '12px' }}>
            <img 
              src={logoImage} 
              alt="Suvarna Logo"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block'
              }} 
            />
          </div>
          <h1 className="text-white text-xl font-medium">MMS</h1>
        </div>
        <nav className="flex-grow py-4 overflow-y-auto">
          <div className="px-4 mb-2 text-sm text-[#e3f2fd] uppercase tracking-wider font-medium">Dashboard</div>
          <LinkItem href="/" icon={BarChart4} text="Dashboard" />
          
          <div className="px-4 mt-6 mb-2 text-sm text-[#e3f2fd] uppercase tracking-wider font-medium">Main Functions</div>
          <LinkItem href="/registration" icon={UserPlus} text="Registration" />
          <LinkItem href="/storage" icon={PackageCheck} text="Storage Management" />
          <LinkItem href="/postmortem" icon={FileCheck} text="Postmortem" />
          <LinkItem href="/release" icon={LogOut} text="Body Release" />
          <LinkItem href="/unclaimed" icon={AlertTriangle} text="Unclaimed Bodies" />
          
          <div className="px-4 mt-6 mb-2 text-sm text-[#e3f2fd] uppercase tracking-wider font-medium">Administration</div>
          <LinkItem href="/reports" icon={FileText} text="Reports" />
          {user && (user.role === "admin" || user.role === "mortuary_staff") && (
            <LinkItem href="/settings" icon={Settings} text="Settings" />
          )}
          {user && user.role === "admin" && (
            <LinkItem href="/users" icon={Users} text="User Management" />
          )}
        </nav>
        <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.2)]">
          <button 
            onClick={handleLogout}
            className="flex items-center text-[#e3f2fd] hover:text-white transition-colors duration-200"
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
