"use server";
/**
 * @fileOverview An AI flow to identify a vehicle's make and model from a photo.
 *
 * - identifyVehicle - A function that handles the vehicle identification process.
 * - IdentifyVehicleInput - The input type for the identifyVehicle function.
 * - IdentifyVehicleOutput - The return type for the identifyVehicle function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const IdentifyVehicleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyVehicleInput = z.infer<typeof IdentifyVehicleInputSchema>;

const IdentifyVehicleOutputSchema = z.object({
  make: z
    .string()
    .describe("The make of the identified vehicle (e.g., 'Tesla')."),
  model: z
    .string()
    .describe("The model of the identified vehicle (e.g., 'Model Y')."),
});
export type IdentifyVehicleOutput = z.infer<typeof IdentifyVehicleOutputSchema>;

export async function identifyVehicle(
  input: IdentifyVehicleInput
): Promise<IdentifyVehicleOutput> {
  return identifyVehicleFlow(input);
}

const prompt = ai.definePrompt({
  name: "identifyVehiclePrompt",
  input: { schema: IdentifyVehicleInputSchema },
  output: { schema: IdentifyVehicleOutputSchema },
  prompt: `You are an expert in vehicle identification. Analyze the provided image of a car and identify its make and model. 
  
  If you cannot confidently identify the vehicle, return "Unknown" for both make and model.

  Photo: {{media url=photoDataUri}}`,
});

const identifyVehicleFlow = ai.defineFlow(
  {
    name: "identifyVehicleFlow",
    inputSchema: IdentifyVehicleInputSchema,
    outputSchema: IdentifyVehicleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to get a structured response from the model.");
    }
    return output;
  }
);
