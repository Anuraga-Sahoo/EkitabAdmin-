// src/ai/flows/image-tagging.ts
'use server';

/**
 * @fileOverview An AI agent that suggests tags for images.
 *
 * - generateImageTags - A function that generates tags for an image.
 * - GenerateImageTagsInput - The input type for the generateImageTags function.
 * - GenerateImageTagsOutput - The return type for the generateImageTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageTagsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to generate tags for, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageTagsInput = z.infer<typeof GenerateImageTagsInputSchema>;

const GenerateImageTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of tags for the image.'),
});
export type GenerateImageTagsOutput = z.infer<typeof GenerateImageTagsOutputSchema>;

export async function generateImageTags(input: GenerateImageTagsInput): Promise<GenerateImageTagsOutput> {
  return generateImageTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageTagsPrompt',
  input: {schema: GenerateImageTagsInputSchema},
  output: {schema: GenerateImageTagsOutputSchema},
  prompt: `You are an expert image tagger. You will generate tags for the image provided.

  Return ONLY an array of tags that describe the image.  Do not return any other text.

  Image: {{media url=photoDataUri}}`,
});

const generateImageTagsFlow = ai.defineFlow(
  {
    name: 'generateImageTagsFlow',
    inputSchema: GenerateImageTagsInputSchema,
    outputSchema: GenerateImageTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
