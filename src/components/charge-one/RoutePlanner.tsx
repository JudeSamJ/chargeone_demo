"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Send, Loader2 } from 'lucide-react';

interface RoutePlannerProps {
    onPlanRoute: (destination: string) => void;
    isPlanning: boolean;
}

export default function RoutePlanner({ onPlanRoute, isPlanning }: RoutePlannerProps) {
    const [destination, setDestination] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onPlanRoute(destination);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Route Planner
                </CardTitle>
                <CardDescription>Enter a destination to plan your trip and find charging stations along the way.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent>
                    <Input 
                        placeholder="Enter your destination..." 
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        disabled={isPlanning}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isPlanning}>
                        {isPlanning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Planning...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Plan Route
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
