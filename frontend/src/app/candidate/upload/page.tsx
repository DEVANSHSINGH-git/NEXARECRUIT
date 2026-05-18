'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

export default function UploadResumePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadResult(response.data.data);
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
          <p className="text-gray-600 mt-1">Upload your resume to begin AI-powered evaluation</p>
        </div>

        {/* Dropzone */}
        {!uploadResult && (
          <div
            {...getRootProps()}
            className={`card border-2 border-dashed cursor-pointer transition-colors duration-200 ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="py-12 text-center">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`} />
              {isDragActive ? (
                <p className="text-primary-600 font-medium">Drop your resume here</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">Drag and drop your resume here</p>
                  <p className="text-sm text-gray-500">or click to browse files</p>
                  <p className="text-xs text-gray-400 mt-3">Supported: PDF, DOCX (Max 10MB)</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* File Preview */}
        {file && !uploadResult && (
          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button onClick={removeFile} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary w-full mt-4"
            >
              {isUploading ? 'Uploading & Parsing...' : 'Upload Resume'}
            </button>
          </div>
        )}

        {/* Upload Success */}
        {uploadResult && (
          <div className="card mt-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-800">Resume Uploaded Successfully</h3>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              <p><span className="font-medium">File:</span> {uploadResult.fileName}</p>
              <p><span className="font-medium">Parsed:</span> {uploadResult.parsed ? 'Yes' : 'Pending'}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => router.push('/candidate/evaluations')} className="btn-primary flex-1">
                Start Evaluation
              </button>
              <button onClick={() => { setFile(null); setUploadResult(null); }} className="btn-secondary flex-1">
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary-600" />
            Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use a clean, well-formatted resume (avoid tables/graphics)</li>
            <li>• Include specific skills, technologies, and accomplishments</li>
            <li>• Quantify your achievements where possible</li>
            <li>• Ensure your resume is up-to-date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
