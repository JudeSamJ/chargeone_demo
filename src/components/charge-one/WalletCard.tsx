import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

interface WalletCardProps {
  balance: number;
}

export default function WalletCard({ balance }: WalletCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">
          ${balance.toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground">Available funds for charging sessions</p>
      </CardContent>
    </Card>
  );
}
