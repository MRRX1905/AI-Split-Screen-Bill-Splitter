import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  FileText,
  Loader2,
  Check
} from 'lucide-react';
import { SAMPLE_RECEIPTS } from '../data/sampleReceipts';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptParsed: (parsedData: any) => void;
  onLoadSample: (sampleId: string) => void;
}

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  onReceiptParsed,
  onLoadSample,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (!previewUrl) return;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/receipt/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: previewUrl,
          mimeType: selectedFile?.type || 'image/jpeg',
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to scan receipt image.');
      }

      onReceiptParsed(json.data);
      onClose();
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Error scanning receipt. Please try another image or pick a sample.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Scan Receipt with Gemini
              </h3>
              <p className="text-xs text-slate-500">
                Powered by gemini-4-argon visual understanding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Dropzone / Image Preview */}
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex flex-col items-center justify-center max-h-64">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="max-h-64 object-contain w-full"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white p-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                  <p className="font-semibold text-sm">gemini-4-argon is analyzing receipt...</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Extracting items, subtotal, tax, and totals
                  </p>
                </div>
              )}
              {!isScanning && (
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-50/20"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drop receipt photo
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP, or HEIC
              </p>

              <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 flex items-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Picture</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Quick Sample Receipts Option */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Or pick an instant sample receipt:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_RECEIPTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onLoadSample(s.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800/80 text-left transition hover:shadow-sm"
                >
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {s.data.items.length} items • ${s.data.total.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {previewUrl && (
            <button
              onClick={handleScanReceipt}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse Receipt with Gemini</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
