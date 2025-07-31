
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Milestone, Navigation, X } from 'lucide-react';

interface LiveJourneyData {
    distance: string;
    duration: string;
    endAddress: string;
}

interface LiveNavigationCardProps {
    data: LiveJourneyData;
    onClearRoute: () => void;
}

export default function LiveNavigationCard({ data, onClearRoute }: LiveNavigationCardProps) {
    return (
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Navigation className="h-6 w-6" />
                        Navigating
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80" onClick={onClearRoute}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">End Navigation</span>
                    </Button>
                </div>
                <CardDescription className="text-primary-foreground/80">
                    to {data.endAddress}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <Clock className="h-7 w-7" />
                    <div>
                        <p className="text-2xl font-bold">{data.duration}</p>
                        <p className="text-sm opacity-80">ETA</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Milestone className="h-7 w-7" />
                    <div>
                        <p className="text-2xl font-bold">{data.distance}</p>
                        <p className="text-sm opacity-80">Remaining</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
