"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            // If user is logged in, check if they have a vehicle saved
            const storedVehicle = localStorage.getItem('userVehicle');
            if (storedVehicle) {
                router.push('/');
            } else {
                router.push('/vehicle-details');
            }
        }
    }, [user, loading, router]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            // The useEffect will handle redirection
        } catch (error) {
            console.error("Login failed", error);
        }
    };
    
    const handleGuest = () => {
        router.push('/?guest=true');
    }

    if (loading || user) {
        return <div className="flex items-center justify-center min-h-screen bg-background"><p>Loading...</p></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to ChargeOne</CardTitle>
                    <CardDescription>
                        Please sign in to continue or proceed as a guest.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button className="w-full" onClick={handleLogin}>
                        Sign in with Google
                    </Button>
                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 bg-card text-muted-foreground">
                                Or
                            </span>
                        </div>
                    </div>
                    <Button className="w-full" variant="secondary" onClick={handleGuest}>
                        Continue as Guest
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
