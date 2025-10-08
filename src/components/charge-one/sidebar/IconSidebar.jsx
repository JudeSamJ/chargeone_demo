
"use client";

import { Home, CalendarDays, Wallet, Car, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NavItem = ({ icon: Icon, label, isActive, onClick }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          className="h-12 w-12"
          onClick={onClick}
        >
          <Icon className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function IconSidebar({ activeContent, setActiveContent, isGuest }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bookings', icon: CalendarDays, label: 'My Bookings', disabled: isGuest },
    { id: 'wallet', icon: Wallet, label: 'Wallet', disabled: isGuest },
    { id: 'vehicle', icon: Car, label: 'My Vehicle' },
  ];

  return (
    <div className="flex h-full flex-col items-center gap-4 border-r bg-background p-2">
      <div className="flex h-16 items-center justify-center">
        {/* Placeholder for Logo if needed */}
      </div>
      <nav className="flex flex-col items-center gap-4">
        {navItems.map(item =>
          !item.disabled && (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeContent === item.id}
              onClick={() => setActiveContent(item.id)}
            />
          )
        )}
      </nav>
    </div>
  );
}

    
    