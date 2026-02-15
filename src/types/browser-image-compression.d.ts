declare module 'browser-image-compression' {
  export interface Options {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    maxIteration?: number;
    exifOrientation?: number;
    fileType?: string;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
  }

  export default function imageCompression(
    file: File,
    options: Options
  ): Promise<File>;
} 

