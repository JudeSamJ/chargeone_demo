import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

interface VehicleStatusCardProps {
  vehicle: Vehicle;
}

export default function VehicleStatusCard({ vehicle }: VehicleStatusCardProps) {
  const { make, model, batteryCapacity, currentCharge } = vehicle;

  const getBatteryInfo = (charge: number) => {
    if (charge > 75) {
      return { Icon: BatteryFull, color: 'text-chart-2' };
    }
    if (charge > 25) {
      return { Icon: BatteryMedium, color: 'text-chart-4' };
    }
    if (charge > 10) {
        return { Icon: BatteryLow, color: 'text-destructive' };
    }
    return { Icon: BatteryWarning, color: 'text-destructive animate-pulse' };
  };

  const { Icon, color } = getBatteryInfo(currentCharge);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Your Vehicle</CardTitle>
        <Car className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold font-headline">{make} {model}</div>
        <div className="flex items-center gap-3 mt-2">
          <Icon className={`h-8 w-8 ${color}`} />
          <div className="w-full">
            <div className="flex justify-between items-baseline">
                <span className="text-xl font-bold">{currentCharge}%</span>
                <p className="text-xs text-muted-foreground">
                    {((batteryCapacity * currentCharge) / 100).toFixed(1)} kWh available
                </p>
            </div>
            <Progress value={currentCharge} className="mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
