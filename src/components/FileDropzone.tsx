'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  isProcessing: boolean;
}

export function FileDropzone({ onFilesAccepted, isProcessing }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAccepted(acceptedFiles);
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input {...getInputProps()} />
      {isProcessing ? (
        <p className="text-gray-500">Processing files...</p>
      ) : isDragActive ? (
        <p className="text-blue-500">Drop the files here...</p>
      ) : (
        <p className="text-gray-500">
          Drag & drop receipt images here, or click to select files
        </p>
      )}
    </div>
  );
}
