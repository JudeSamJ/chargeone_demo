"use client";

import { Bolt, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { signOutWithGoogle } from '@/lib/auth';

export default function Header() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOutWithGoogle();
  };

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-card">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
            <Bolt className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-headline">ChargeOne</h1>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user.displayName}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
