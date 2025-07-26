"use client";

import { Bolt } from 'lucide-react';

export default function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-card">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
            <Bolt className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-headline">ChargeOne</h1>
        </div>
      </div>
    </header>
  );
}
