
"use client";

import { Map, Satellite, Mountain, TrafficCone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function MapControls({
    mapTypeId,
    onMapTypeIdChange,
    showTraffic,
    onShowTrafficChange
}) {

    const mapTypes = [
        { id: "roadmap", label: "Roadmap", Icon: Map },
        { id: "satellite", label: "Satellite", Icon: Satellite },
        { id: "terrain", label: "Terrain", Icon: Mountain },
    ];
    
    const ActiveIcon = mapTypes.find(m => m.id === mapTypeId)?.Icon || Map;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <ActiveIcon className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Map Settings</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <div className="p-2">
                    <h3 className="font-medium text-sm">Map Settings</h3>
                    <p className="text-xs text-muted-foreground">Customize your map view.</p>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Map className="mr-2" />
                        <span>Map Type</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            {mapTypes.map(type => (
                                <DropdownMenuItem key={type.id} onClick={() => onMapTypeIdChange(type.id)}>
                                    <type.Icon className="mr-2" />
                                    <span>{type.label}</span>
                                    {mapTypeId === type.id && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />

                <div className="p-2">
                   <div className="flex items-center justify-between">
                       <Label htmlFor="traffic-switch" className="flex items-center gap-2 font-normal cursor-pointer">
                           <TrafficCone className="h-5 w-5" />
                           Live Traffic
                       </Label>
                       <Switch 
                           id="traffic-switch"
                           checked={showTraffic}
                           onCheckedChange={onShowTrafficChange}
                       />
                   </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
