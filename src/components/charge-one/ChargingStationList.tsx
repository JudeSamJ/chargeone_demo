"use client";
import type { Station } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap, DollarSign, Plug, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChargingStationListProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
  selectedStationId?: number | null;
}

function StationCard({ station, onSelect, isSelected }: { station: Station, onSelect: () => void, isSelected: boolean }) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md hover:border-primary/50",
        isSelected ? "border-primary ring-2 ring-primary/50 shadow-lg" : "border-border",
        !station.isAvailable && "bg-muted/50 hover:shadow-none cursor-not-allowed opacity-70"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
            <h3 className="font-bold">{station.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {station.location} ({station.distance} km away)
            </p>
        </div>
        <Badge variant={station.isAvailable ? "secondary" : "destructive"} className="flex gap-1 items-center">
          {station.isAvailable ? <CheckCircle className="h-3 w-3 text-chart-2"/> : <XCircle className="h-3 w-3"/>}
          {station.isAvailable ? 'Available' : 'In Use'}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1" aria-label="Power rating">
                <Zap className="h-4 w-4 text-chart-4" />
                <span className="font-medium text-foreground">{station.power} kW</span>
            </div>
            <div className="flex items-center gap-1" aria-label="Price per kWh">
                <DollarSign className="h-4 w-4 text-chart-2" />
                <span className="font-medium text-foreground">${station.pricePerKwh.toFixed(2)}</span>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <Plug className="h-4 w-4 text-muted-foreground"/>
            <span className="text-xs font-mono">{station.connectors.join(', ')}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChargingStationList({ stations, onSelectStation, selectedStationId }: ChargingStationListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearby Stations</CardTitle>
        <CardDescription>Select a station to start charging</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          <div className="space-y-4">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onSelect={() => onSelectStation(station)}
                isSelected={selectedStationId === station.id}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
