"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to ChargeOne</CardTitle>
                    <CardDescription>
                        Please sign in to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full">
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
