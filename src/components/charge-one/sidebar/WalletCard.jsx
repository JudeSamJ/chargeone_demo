
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, PlusCircle } from 'lucide-react';

export default function WalletCard({ balance, onRecharge }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">
          ₹{balance.toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground">Available funds for charging sessions</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onRecharge}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Recharge Wallet
        </Button>
      </CardFooter>
    </Card>
  );
}
