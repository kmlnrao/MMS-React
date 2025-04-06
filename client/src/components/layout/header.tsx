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
    <header className="bg-white border-b border-neutral-medium h-16 flex items-center px-6">
      <button className="md:hidden mr-4" onClick={toggleSidebar}>
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="relative flex-grow max-w-md">
        <Input 
          type="text" 
          placeholder="Search..." 
          className="bg-neutral-light pl-9 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Search className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
      </div>
      
      <div className="flex items-center ml-auto">
        <Button variant="ghost" size="icon" className="relative mr-2">
          <Bell className="w-6 h-6 text-gray-600" />
          <span className="absolute top-1 right-1 bg-error text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">3</span>
        </Button>
        
        <div className="relative ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center hover:bg-neutral-light">
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarFallback>{user ? getInitials(user.fullName) : 'U'}</AvatarFallback>
                </Avatar>
                <span className="ml-1 mr-1 text-sm font-medium">{user ? user.fullName : 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
