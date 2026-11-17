import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { storage } from '@/src/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from './Button';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadComplete, 
  folder = 'uploads',
  label = 'Upload Image'
}) => {
  const [isUploading, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size too large (max 5MB).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setProgress(0);

    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (err) => {
        console.error('Upload error', err);
        setError('Upload failed. Ensure Storage is enabled.');
        setIsSubmitting(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(downloadURL);
        setIsSubmitting(false);
        setProgress(0);
      }
    );
  };

  return (
    <div className="space-y-2">
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-2
          ${isUploading ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed' : 'hover:border-dpc-blue hover:bg-blue-50/30 border-neutral-300'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-dpc-blue animate-spin" />
            <div className="w-full max-w-[200px] bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-dpc-blue h-full transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="text-xs font-bold text-navy uppercase">Uploading {Math.round(progress)}%</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-text-muted">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-navy block">{label}</span>
              <span className="text-[10px] text-text-muted">JPG, PNG, WEBP (Max 5MB)</span>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
};
