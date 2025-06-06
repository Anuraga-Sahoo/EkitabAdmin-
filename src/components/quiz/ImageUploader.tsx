'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { generateImageTags } from '@/ai/flows/image-tagging';
import { ImagePlus, Tags, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUploaded: (dataUri: string, tags: string[]) => void;
  idSuffix: string; // To make IDs unique if multiple uploaders are on one page
}

export function ImageUploader({ onImageUploaded, idSuffix }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isTagging, setIsTagging] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setAiTags([]); // Reset tags for new image
        // Inform parent about the new image (without tags yet, or with empty tags)
        // onImageUploaded(result, []); 
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreview(null);
      setAiTags([]);
    }
  };

  const handleGenerateTags = async () => {
    if (!preview) {
      toast({
        title: "No Image Selected",
        description: "Please select an image first to generate tags.",
        variant: "destructive",
      });
      return;
    }
    setIsTagging(true);
    try {
      const result = await generateImageTags({ photoDataUri: preview });
      setAiTags(result.tags);
      onImageUploaded(preview, result.tags); // Inform parent with image and tags
      toast({
        title: "AI Tags Generated",
        description: `${result.tags.length} tags were successfully generated.`,
      });
    } catch (error) {
      console.error("Error generating tags:", error);
      toast({
        title: "Tag Generation Failed",
        description: "Could not generate AI tags for the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTagging(false);
    }
  };

  return (
    <div className="space-y-3 p-3 border rounded-md bg-card">
      <Label htmlFor={`image-upload-${idSuffix}`} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
        <ImagePlus className="h-5 w-5 text-primary" />
        Upload Image
      </Label>
      <Input
        id={`image-upload-${idSuffix}`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="text-sm"
      />
      {preview && (
        <div className="mt-2 border p-2 rounded-md shadow-inner bg-muted/30">
          <Image
            src={preview}
            alt="Image preview"
            width={200}
            height={200}
            className="rounded-md object-contain max-h-48 w-auto mx-auto"
            data-ai-hint="uploaded image"
          />
        </div>
      )}
      {preview && (
        <Button onClick={handleGenerateTags} disabled={isTagging} size="sm" variant="outline" className="w-full">
          {isTagging ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Tags className="mr-2 h-4 w-4" />
          )}
          Generate AI Tags
        </Button>
      )}
      {aiTags.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">AI Generated Tags:</p>
          <div className="flex flex-wrap gap-1">
            {aiTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
