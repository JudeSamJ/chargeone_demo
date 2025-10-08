
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Power, Plug } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function VehicleStatusCard({ vehicle }) {
  const { make, model, batteryCapacity, currentCharge, supportedChargers } = vehicle;

  const getBatteryInfo = (charge) => {
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
                    {((batteryCapacity * currentCharge) / 100).toFixed(1)} kWh
                </p>
            </div>
            <Progress value={currentCharge} className="mt-1" />
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{batteryCapacity} kWh</span>
                <span className="text-muted-foreground">Battery</span>
            </div>
            <div className="flex items-start gap-2">
                <Plug className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                    {supportedChargers && supportedChargers.length > 0 ? (
                        supportedChargers.map(charger => (
                            <Badge key={charger} variant="secondary">{charger}</Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground">No chargers specified</span>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
