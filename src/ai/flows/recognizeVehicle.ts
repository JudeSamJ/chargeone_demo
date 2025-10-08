
'use server';
/**
 * @fileOverview A flow to recognize a vehicle from a photo.
 */

import { ai } from '@/ai/genkit';
import { RecognizeVehicleInputSchema, RecognizeVehicleOutputSchema, RecognizeVehicleInput, RecognizeVehicleOutput } from '@/lib/types';


export async function recognizeVehicle(input: RecognizeVehicleInput): Promise<RecognizeVehicleOutput> {
  return recognizeVehicleFlow(input);
}


const recognizeVehiclePrompt = ai.definePrompt({
  name: 'recognizeVehiclePrompt',
  input: { schema: RecognizeVehicleInputSchema },
  output: { schema: RecognizeVehicleOutputSchema },
  prompt: `You are an expert in vehicle identification. Analyze the provided image and identify the make and model of the car.
  
  Photo: {{media url=photoDataUri}}`,
  model: 'googleai/gemini-1.5-flash',
});


const recognizeVehicleFlow = ai.defineFlow(
  {
    name: 'recognizeVehicleFlow',
    inputSchema: RecognizeVehicleInputSchema,
    outputSchema: RecognizeVehicleOutputSchema,
  },
  async (input) => {
    const { output } = await recognizeVehiclePrompt(input);
    if (!output) {
      throw new Error('Could not recognize vehicle.');
    }
    return output;
  }
);
