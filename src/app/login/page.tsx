"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            router.push('/');
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    if (loading || user) {
        return <div className="flex items-center justify-center min-h-screen bg-background"><p>Loading...</p></div>;
    }

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
                    <Button className="w-full" onClick={handleLogin}>
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
