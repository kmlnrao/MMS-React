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
  Users,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import sidebarLogo from "@/assets/suvarna_logo_sidebar.png";

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
          "flex items-center rounded-md mx-2 px-3 py-2.5 transition-all duration-200 group", 
          isActive 
            ? "bg-[#e3f2fd] text-[#1565c0] font-medium" 
            : "text-[#1565c0] hover:bg-[#e3f2fd] hover:bg-opacity-70"
        )}
      >
        <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-[#1976d2]" : "text-[#42a5f5]")} />
        <span>{text}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#1976d2]" />}
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <aside className={cn(
        "bg-white w-64 flex-shrink-0 transition-all duration-300 ease-in-out transform shadow-md border-r border-[#e3f2fd]",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="px-4 py-5 flex items-center border-b border-[#e3f2fd]">
            <div className="h-12 w-auto mr-3">
              <img 
                src={sidebarLogo} 
                alt="Suvarna Logo"
                className="h-full w-auto object-contain" 
                style={{ maxHeight: '40px' }}
              />
            </div>
            <div>
              <h1 className="text-[#1565c0] text-xl font-semibold leading-tight">MMS</h1>
              <p className="text-xs text-[#64b5f6]">Mortuary Management System</p>
            </div>
          </div>

          <div className="py-1.5 px-3 my-2 mx-3 bg-[#f5f9ff] rounded-md">
            <p className="text-xs text-[#1976d2] font-medium">
              {user ? `Logged in as: ${user.fullName}` : 'Not logged in'}
            </p>
            <p className="text-xs text-[#64b5f6]">
              {user?.role ? user.role.replace('_', ' ') : ''}
            </p>
          </div>
          
          <nav className="flex-grow py-4 overflow-y-auto">
            <div className="px-4 mb-2 text-xs text-[#90caf9] uppercase tracking-wider font-medium">Dashboard</div>
            <LinkItem href="/" icon={BarChart4} text="Dashboard" />
            
            <div className="px-4 mt-6 mb-2 text-xs text-[#90caf9] uppercase tracking-wider font-medium">Main Functions</div>
            <LinkItem href="/registration" icon={UserPlus} text="Registration" />
            <LinkItem href="/storage" icon={PackageCheck} text="Storage Management" />
            <LinkItem href="/postmortem" icon={FileCheck} text="Postmortem" />
            <LinkItem href="/release" icon={LogOut} text="Body Release" />
            <LinkItem href="/unclaimed" icon={AlertTriangle} text="Unclaimed Bodies" />
            
            <div className="px-4 mt-6 mb-2 text-xs text-[#90caf9] uppercase tracking-wider font-medium">Administration</div>
            <LinkItem href="/reports" icon={FileText} text="Reports" />
            {user && (user.role === "admin" || user.role === "mortuary_staff") && (
              <LinkItem href="/settings" icon={Settings} text="Settings" />
            )}
            {user && user.role === "admin" && (
              <LinkItem href="/users" icon={Users} text="User Management" />
            )}
          </nav>
          
          <div className="mt-auto px-3 py-4 border-t border-[#e3f2fd]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-[#ef5350] hover:text-[#f44336] hover:bg-[#ffebee] w-full rounded-md px-3 py-2 transition-colors duration-200"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign out from the system</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
