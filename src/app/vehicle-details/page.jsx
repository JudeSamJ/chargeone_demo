
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { recognizeVehicle } from "@/ai/flows/recognizeVehicle";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Car, BatteryFull, Save, Camera, ScanLine, X, Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getVehicleBrands, getVehicleModels } from "@/lib/enode";

export default function VehicleDetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();

    // State for Enode data
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [brandsLoading, setBrandsLoading] = useState(true);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [charge, setCharge] = useState(80);

    const [isScanning, setIsScanning] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Fetch vehicle brands on component mount
    useEffect(() => {
        async function fetchBrands() {
            setBrandsLoading(true);
            try {
                const fetchedBrands = await getVehicleBrands();
                setBrands(fetchedBrands);
            } catch (error) {
                console.error("Failed to fetch vehicle brands:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load vehicle brands.",
                });
            } finally {
                setBrandsLoading(false);
            }
        }
        fetchBrands();
    }, [toast]);
    
    // Fetch models when a brand is selected
    useEffect(() => {
        if (!selectedBrand) {
            setModels([]);
            setSelectedModel(null);
            return;
        }

        async function fetchModels() {
            setModelsLoading(true);
            setSelectedModel(null);
            try {
                const fetchedModels = await getVehicleModels(selectedBrand.id);
                setModels(fetchedModels);
                // Select the first model by default if available
                if (fetchedModels.length > 0) {
                    setSelectedModel(fetchedModels[0]);
                }
            } catch (error) {
                console.error("Failed to fetch vehicle models:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load vehicle models for the selected brand.",
                });
            } finally {
                setModelsLoading(false);
            }
        }
        fetchModels();

    }, [selectedBrand, toast]);


    useEffect(() => {
        const getCameraPermission = async () => {
          if (!isScanning) {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            return;
          }

          if (streamRef.current || !navigator.mediaDevices) return;

          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            setHasCameraPermission(true);
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings.',
            });
          }
        };

        getCameraPermission();
        
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [isScanning, toast]);

    useEffect(() => {
        if (isScanning && hasCameraPermission && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isScanning, hasCameraPermission]);

    
    const handleBrandChange = (brandId) => {
        const brand = brands.find(b => b.id === brandId);
        setSelectedBrand(brand || null);
    }
    
    const handleModelChange = (modelId) => {
        const model = models.find(m => m.id === modelId);
        setSelectedModel(model || null);
    }

    const handleScanClick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        setIsRecognizing(true);
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const dataUri = canvas.toDataURL('image/jpeg');

        try {
            const result = await recognizeVehicle({ photoDataUri: dataUri });
            const foundBrand = brands.find(b => b.name.toLowerCase() === result.make.toLowerCase());

            if (foundBrand) {
                setSelectedBrand(foundBrand);
                // Now wait for models to load and then find the model
                const vehicleModels = await getVehicleModels(foundBrand.id);
                const foundModel = vehicleModels.find(m => m.name.toLowerCase() === result.model.toLowerCase());

                if(foundModel) {
                    setModels(vehicleModels);
                    setSelectedModel(foundModel);
                    toast({
                        title: "Vehicle Recognized!",
                        description: `Set to ${foundBrand.name} ${foundModel.name}. You can adjust if needed.`,
                    });
                } else {
                     toast({
                        variant: "destructive",
                        title: "Model Not Found",
                        description: `Could not find model "${result.model}" for ${result.make}.`,
                    });
                }
            } else {
                 toast({
                    variant: "destructive",
                    title: "Brand Not Found",
                    description: `Could not find brand "${result.make}" in our database.`,
                });
            }
        } catch (error) {
            console.error("Vehicle recognition failed:", error);
            toast({
                variant: "destructive",
                title: "Scan Failed",
                description: "Could not recognize the vehicle. Please try again.",
            });
        } finally {
            setIsRecognizing(false);
            setIsScanning(false);
        }
    };

    const handleResetScan = () => {
        setIsScanning(false);
        setHasCameraPermission(null);
    };
    
    const handleSave = () => {
        if (selectedBrand && selectedModel) {
            const vehicleToSave = { 
                make: selectedBrand.name,
                model: selectedModel.name,
                batteryCapacity: selectedModel.batteryCapacity,
                currentCharge: charge,
                supportedChargers: selectedModel.supportedChargers,
            };
            localStorage.setItem('userVehicle', JSON.stringify(vehicleToSave));
            router.push('/');
        }
    }

    if (isUserLoading || !user) {
        return <div className="flex items-center justify-center min-h-screen bg-background"><p>Loading...</p></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Car className="h-6 w-6" />
                        Your Vehicle
                    </CardTitle>
                    <CardDescription>
                        Select your vehicle and set its current charge, or scan it with your camera.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
                        <video ref={videoRef} className={`w-full h-full object-cover ${!isScanning && 'hidden'}`} autoPlay muted playsInline />
                         {isScanning && isRecognizing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-background">
                                <Loader className="animate-spin h-10 w-10" />
                                <p className="mt-2">Recognizing vehicle...</p>
                            </div>
                         )}
                         {!isScanning && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Button variant="outline" className="w-auto" onClick={() => setIsScanning(true)}>
                                    <Camera className="mr-2" />
                                    Scan Vehicle with Camera
                                </Button>
                            </div>
                         )}
                     </div>
                     {isScanning && hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser settings to use this feature.
                            </AlertDescription>
                         </Alert>
                       )}
                    {isScanning && (
                       <div className="flex gap-2">
                           <Button className="w-full" onClick={handleScanClick} disabled={isRecognizing || !hasCameraPermission}>
                               <ScanLine className="mr-2" />
                               {isRecognizing ? 'Scanning...' : 'Scan'}
                           </Button>
                           <Button variant="outline" onClick={handleResetScan} disabled={isRecognizing}>
                               <X className="mr-2" />
                               Cancel
                           </Button>
                       </div>
                    )}


                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand-select">Brand</Label>
                            <Select 
                                onValueChange={handleBrandChange} 
                                value={selectedBrand ? selectedBrand.id : ''}
                                disabled={isRecognizing || brandsLoading}
                            >
                                <SelectTrigger id="brand-select">
                                    <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select brand"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map(b => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="model-select">Model</Label>
                            <Select 
                                onValueChange={handleModelChange} 
                                value={selectedModel ? selectedModel.id : ''}
                                disabled={!selectedBrand || modelsLoading || isRecognizing}
                            >
                                <SelectTrigger id="model-select">
                                    <SelectValue placeholder={
                                        !selectedBrand ? "Select a brand first" : 
                                        modelsLoading ? "Loading models..." : "Select model"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                           <Label htmlFor="charge-slider">Current Charge</Label>
                           <span className="text-2xl font-bold text-primary">{charge}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <BatteryFull className="h-8 w-8 text-muted-foreground" />
                            <Slider
                                id="charge-slider"
                                value={[charge]}
                                onValueChange={(value) => setCharge(value[0])}
                                max={100}
                                step={1}
                                disabled={isRecognizing}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSave} disabled={!selectedModel || isRecognizing}>
                        <Save className="mr-2" />
                        Save and Continue
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
