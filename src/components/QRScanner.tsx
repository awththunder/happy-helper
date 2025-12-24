import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // QR code not detected, continue scanning
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setHasPermission(false);
      onError?.('Camera access denied or not available');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        id="qr-reader"
        className="w-full max-w-[300px] aspect-square bg-secondary rounded-lg overflow-hidden relative"
      >
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
            {hasPermission === false ? (
              <>
                <CameraOff className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Camera access denied. Please enable camera permissions and try again.
                </p>
              </>
            ) : (
              <>
                <Camera className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click the button below to start scanning
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={isScanning ? stopScanning : startScanning}
        variant={isScanning ? 'secondary' : 'default'}
        className="w-full max-w-[300px]"
      >
        {isScanning ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanning
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Start Camera
          </>
        )}
      </Button>

      {isScanning && (
        <p className="text-sm text-muted-foreground text-center">
          Point your camera at a QR code from your authenticator setup
        </p>
      )}
    </div>
  );
}
