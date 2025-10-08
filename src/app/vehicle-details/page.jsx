"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { vehicles } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Car, BatteryFull, Save, Camera, Loader2 } from "lucide-react";
import CameraCaptureDialog from "@/components/charge-one/camera/CameraCaptureDialog";
import { identifyVehicle } from "@/ai/flows/identifyVehicle";
import { useToast } from "@/hooks/use-toast";

export default function VehicleDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);
  const [charge, setCharge] = useState(80);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleVehicleChange = (value) => {
    const [make, model] = value.split("|");
    const vehicle = vehicles.find((v) => v.make === make && v.model === model);
    setSelectedVehicle(vehicle || null);
  };

  const handlePhotoCapture = async (dataUri) => {
    setIsCameraOpen(false);
    setIsIdentifying(true);
    try {
      const result = await identifyVehicle({ photoDataUri: dataUri });

      const identifiedVehicle = vehicles.find(
        (v) =>
          v.make.toLowerCase() === result.make.toLowerCase() &&
          v.model.toLowerCase() === result.model.toLowerCase()
      );

      if (identifiedVehicle) {
        setSelectedVehicle(identifiedVehicle);
        toast({
          title: "Vehicle Identified!",
          description: `We've selected the ${result.make} ${result.model}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Vehicle Not Supported",
          description: `Identified ${result.make} ${result.model}, but it's not in our list of supported vehicles. Please select manually.`,
        });
      }
    } catch (error) {
      console.error("Vehicle identification failed:", error);
      toast({
        variant: "destructive",
        title: "Identification Failed",
        description:
          "Could not identify the vehicle from the photo. Please try again or select it manually.",
      });
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSave = () => {
    if (selectedVehicle) {
      const vehicleToSave = { ...selectedVehicle, currentCharge: charge };
      localStorage.setItem("userVehicle", JSON.stringify(vehicleToSave));
      router.push("/");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  const selectedVehicleValue = selectedVehicle
    ? `${selectedVehicle.make}|${selectedVehicle.model}`
    : "";

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-6 w-6" />
              Your Vehicle
            </CardTitle>
            <CardDescription>
              Select your vehicle and set its current charge to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-select">Vehicle Model</Label>
                <Select
                  onValueChange={handleVehicleChange}
                  value={selectedVehicleValue}
                >
                  <SelectTrigger id="vehicle-select" disabled={isIdentifying}>
                    <SelectValue placeholder="Select your vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem
                        key={`${v.make}-${v.model}`}
                        value={`${v.make}|${v.model}`}
                      >
                        {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCameraOpen(true)}
                disabled={isIdentifying}
              >
                {isIdentifying ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Identifying Vehicle...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2" />
                    Scan with Camera
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <Label htmlFor="charge-slider">Current Charge</Label>
                <span className="text-2xl font-bold text-primary">
                  {charge}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <BatteryFull className="h-8 w-8 text-muted-foreground" />
                <Slider
                  id="charge-slider"
                  value={[charge]}
                  onValueChange={(value) => setCharge(value[0])}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!selectedVehicle || isIdentifying}
            >
              <Save className="mr-2" />
              Save and Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
      <CameraCaptureDialog
        isOpen={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handlePhotoCapture}
        identifyVehicle={identifyVehicle}
      />
    </>
  );
}
