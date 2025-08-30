
"use client";

import { Bolt, LogOut, LocateFixed } from 'lucide-react';
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
import { ThemeToggle } from './ThemeToggle';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import MapControls from './MapControls';


interface HeaderProps {
    mapTypeId: string;
    onMapTypeIdChange: (id: string) => void;
    showTraffic: boolean;
    onShowTrafficChange: (show: boolean) => void;
    onRecenter: () => void;
}

export default function Header({ mapTypeId, onMapTypeIdChange, showTraffic, onShowTrafficChange, onRecenter }: HeaderProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
        await signOutWithGoogle();
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
        <header className="absolute top-4 left-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2 border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <Bolt className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-bold text-primary font-headline">ChargeOne</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={onRecenter}>
                        <LocateFixed className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Recenter Map</span>
                    </Button>
                    <MapControls 
                        mapTypeId={mapTypeId}
                        onMapTypeIdChange={onMapTypeIdChange}
                        showTraffic={showTraffic}
                        onShowTrafficChange={onShowTrafficChange}
                    />
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
            </div>
        </header>
    );
}
