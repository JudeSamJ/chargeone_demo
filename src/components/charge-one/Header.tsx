
"use client";

import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOutWithGoogle } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { ThemeToggle } from './ThemeToggle';
import { SidebarTrigger } from '../ui/sidebar';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutWithGoogle();
      // Clear user-specific data
      localStorage.removeItem('userVehicle');
      router.push('/login');
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'G';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase() || 'G';
  }

  return (
    <header className="py-2 px-4 sm:px-6 lg:px-8 border-b bg-background">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-1">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground hidden md:inline-block">Press [⌘+B] to toggle</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
             user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                       <Avatar>
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" onClick={() => router.push('/login')}>
                    Sign In
                </Button>
              )
          )}
        </div>
      </div>
    </header>
  );
}
