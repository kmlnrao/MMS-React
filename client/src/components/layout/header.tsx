import { Bell, Menu, Search, Settings, LogOut, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User as UserType } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  toggleSidebar: () => void;
  user: Omit<UserType, "password"> | null;
}

export default function Header({ toggleSidebar, user }: HeaderProps) {
  const { logoutMutation } = useAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <header className="bg-white border-b border-[#e3f2fd] h-16 flex items-center px-6 shadow-sm">
      <button className="md:hidden mr-4" onClick={toggleSidebar}>
        <Menu className="w-6 h-6 text-[#1976d2]" />
      </button>
      
      <div className="h-10 w-auto mr-4 hidden md:block">
        <img 
          src="/logo.png" 
          alt="Suvarna Logo"
          className="h-full w-auto object-contain" 
          style={{ maxWidth: '40px' }}
        />
      </div>
      
      <div className="relative flex-grow max-w-md">
        <Input 
          type="text" 
          placeholder="Search patients, tasks, or records..." 
          className="bg-[#f5f9ff] pl-9 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1e88e5] border-[#e3f2fd]"
        />
        <Search className="w-4 h-4 text-[#64b5f6] absolute left-3 top-3" />
      </div>
      
      <div className="flex items-center ml-auto space-x-3">
        <Button variant="outline" size="icon" className="relative rounded-full h-9 w-9 border-[#e3f2fd] bg-white hover:bg-[#f5f9ff]">
          <Bell className="w-5 h-5 text-[#42a5f5]" />
          <span className="absolute top-0 right-0 bg-[#f44336] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium">3</span>
        </Button>
        
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full pl-2 pr-3 py-1 flex items-center border-[#e3f2fd] bg-white hover:bg-[#f5f9ff]">
                <Avatar className="w-7 h-7 mr-2 bg-[#1976d2] text-white border-2 border-[#e3f2fd]">
                  <AvatarFallback>{user ? getInitials(user.fullName) : 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#1976d2]">{user ? user.fullName.split(' ')[0] : 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-md border-[#e3f2fd] rounded-lg overflow-hidden w-56 mt-1">
              <DropdownMenuLabel className="text-[#1976d2] px-4 py-3">
                <div className="font-medium">{user ? user.fullName : 'User'}</div>
                <div className="text-xs text-[#64b5f6] mt-1">{user?.role || 'Guest'}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e3f2fd]" />
              
              <DropdownMenuItem className="py-2.5 cursor-pointer focus:bg-[#f5f9ff] focus:text-[#1565c0]">
                <UserCircle className="w-4 h-4 mr-2 text-[#42a5f5]" />
                <span>My Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="py-2.5 cursor-pointer focus:bg-[#f5f9ff] focus:text-[#1565c0]">
                <Settings className="w-4 h-4 mr-2 text-[#42a5f5]" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-[#e3f2fd]" />
              
              <DropdownMenuItem 
                onClick={() => logoutMutation.mutate()}
                className="py-2.5 cursor-pointer focus:bg-[#f5f9ff] focus:text-[#ef5350]"
              >
                <LogOut className="w-4 h-4 mr-2 text-[#ef5350]" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
