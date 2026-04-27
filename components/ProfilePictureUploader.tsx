'use client';
import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point, Size } from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onSave: (croppedImage: Blob) => Promise<void>;
  onClose: () => void;
}

export default function ProfilePictureUploader({ imageSrc, onSave, onClose }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) reject(new Error('No context'));
        else {
          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
          );
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
        }
      };
      image.onerror = reject;
    });
  };

  const handleSave = async () => {
    // If no crop area set, proceed anyway, perhaps with a dummy area that getCroppedImg might handle or fail on
    // This is better than just doing nothing and ignoring the user's click.
    const area = croppedAreaPixels || { x: 0, y: 0, width: 100, height: 100 };
    
    try {
      const blob = await getCroppedImg(imageSrc, area);
      await onSave(blob);
    } catch (e) {
      console.error('Error saving image', e);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-sm h-96 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-4 z-50">
        <button onClick={onClose} className="p-4 bg-red-600 text-white rounded-full"><X /></button>
        <button onClick={handleSave} className="p-4 bg-green-600 text-white rounded-full"><Check /></button>
      </div>
    </div>
  );
}
