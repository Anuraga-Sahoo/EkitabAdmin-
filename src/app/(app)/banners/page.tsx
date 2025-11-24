
'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Trash2, Image as ImageIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Banner } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function ManageBannersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/banners');
      if (!response.ok) {
        throw new Error('Failed to fetch banners.');
      }
      const data: Banner[] = await response.json();
      setBanners(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'No File Selected', description: 'Please choose an image file to upload.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('bannerImage', file);

    try {
      const response = await fetch('/api/banners', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: 'Banner uploaded successfully.' });
        setFile(null);
        setPreview(null);
        fetchBanners(); // Refresh the list
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ title: 'Upload Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
  };
  
  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/banners/${bannerToDelete._id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success", description: "Banner deleted successfully." });
        setBanners(prev => prev.filter(b => b._id !== bannerToDelete._id));
      } else {
        throw new Error(result.message || "Failed to delete banner");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setBannerToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center">
        <ImageIcon className="mr-3 h-8 w-8" /> Manage Banners
      </h1>

      <Card className="shadow-lg max-w-2xl">
        <form onSubmit={handleUploadSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Upload New Banner</CardTitle>
            <CardDescription>Choose an image file to upload as a new banner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banner-upload">Banner Image</Label>
              <Input id="banner-upload" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            {preview && (
              <div className="mt-4 p-2 border rounded-md shadow-inner bg-muted/30">
                <p className="text-sm font-medium mb-2">Image Preview:</p>
                <Image src={preview} alt="Banner preview" width={400} height={200} className="rounded-md object-contain w-full" />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUploading || !file} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
              Upload Banner
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Existing Banners</CardTitle>
          <CardDescription>View and delete currently active banners.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading banners...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive"><p>Error: {error}</p></div>
          ) : banners.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No banners found. Upload one above to get started!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <Card key={banner._id} className="group relative overflow-hidden">
                   <Image src={banner.imageUrl} alt="Banner" width={400} height={200} className="object-cover w-full h-48" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(banner)}>
                       <Trash2 className="h-5 w-5" />
                       <span className="sr-only">Delete Banner</span>
                     </Button>
                   </div>
                   <CardFooter className="p-2 text-xs text-muted-foreground bg-card/80">
                     Uploaded {formatDistanceToNow(new Date(banner.createdAt), { addSuffix: true })}
                   </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {bannerToDelete && (
        <AlertDialog open={!!bannerToDelete} onOpenChange={() => setBannerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this banner?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone and will remove the banner permanently.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBannerToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Banner
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
