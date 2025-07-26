"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOutWithGoogle } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOutWithGoogle();
        } catch (error) {
            console.error("Error signing out with Google", error);
        }
    };

    if(loading) return <p>Loading...</p>;

    if(user) return null;

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
                    <Button onClick={handleLogin} className="w-full">
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
