"use client";

import { Wallet, Car, Route, CalendarDays, BookUser } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

export default function SidebarNav({ activePanel, onPanelToggle, isGuest }) {
  const navItems = [
    { id: "wallet", label: "Wallet", Icon: Wallet, disabled: false },
    { id: "vehicle", label: "My Vehicle", Icon: Car, disabled: false },
    { id: "planner", label: "Route Planner", Icon: Route, disabled: false },
    {
      id: "bookings",
      label: "My Bookings",
      Icon: CalendarDays,
      disabled: isGuest,
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="absolute top-0 left-0 h-full w-16 bg-background border-r z-20 flex flex-col items-center py-4 gap-2">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === item.id ? "secondary" : "ghost"}
                size="icon"
                className="h-12 w-12 rounded-lg"
                onClick={() => onPanelToggle(item.id)}
                disabled={item.disabled}
                aria-label={item.label}
              >
                <item.Icon className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
