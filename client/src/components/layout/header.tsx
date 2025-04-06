import { Bell, Menu, Search, User } from "lucide-react";
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
import suvarnaLogo from "@/assets/suvarna_logo_new.png";

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
    <header className="bg-white border-b border-[#bbdefb] h-16 flex items-center px-6 shadow-sm">
      <button className="md:hidden mr-4" onClick={toggleSidebar}>
        <Menu className="w-6 h-6 text-[#1976d2]" />
      </button>
      
      <div className="h-10 w-auto mr-4 hidden md:block">
        <img 
          src={suvarnaLogo} 
          alt="Suvarna Logo"
          className="h-full w-auto" 
          style={{ 
            maxWidth: '50px',
            objectFit: 'contain',
            imageRendering: 'crisp-edges'
          }}
        />
      </div>
      
      <div className="relative flex-grow max-w-md">
        <Input 
          type="text" 
          placeholder="Search..." 
          className="bg-white pl-9 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#1e88e5] border-[#bbdefb]"
        />
        <Search className="w-5 h-5 text-[#1976d2] absolute left-3 top-2.5" />
      </div>
      
      <div className="flex items-center ml-auto">
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="w-6 h-6 text-[#1976d2]" />
          <span className="absolute top-1 right-1 bg-[#f44336] text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">3</span>
        </Button>
        
        <div className="relative ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center hover:bg-[rgba(30,136,229,0.1)]">
                <Avatar className="w-8 h-8 mr-2 bg-[#1e88e5] text-white">
                  <AvatarFallback>{user ? getInitials(user.fullName) : 'U'}</AvatarFallback>
                </Avatar>
                <span className="ml-1 mr-1 text-sm font-medium">{user ? user.fullName : 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg border-[#bbdefb]">
              <DropdownMenuLabel className="text-[#1976d2]">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e3f2fd]" />
              <DropdownMenuItem className="hover:bg-[#e3f2fd] hover:text-[#1565c0]">Profile</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#e3f2fd] hover:text-[#1565c0]">Settings</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e3f2fd]" />
              <DropdownMenuItem 
                onClick={() => logoutMutation.mutate()}
                className="hover:bg-[#e3f2fd] hover:text-[#1565c0]"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
