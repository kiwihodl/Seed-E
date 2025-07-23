import React, { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScanCompleted: (data: any) => void;
  hideCamera?: boolean;
}

// Web-compatible QR scanner using HTML5 camera API
function QRScanner({ onScanCompleted, hideCamera = false }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [qrPercent, setQrPercent] = useState(0);
  const [qrData, setData] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasScannedRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Reset QR scanner state
  const resetQR = useCallback(
    async (error = false) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData(null);
      setQrPercent(0);
      if (error || hasError) {
        console.error("Invalid QR scanned");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      setHasError(false);
    },
    [hasError]
  );

  // Validate xpub format
  const validateXpub = (data: string): boolean => {
    // Basic xpub validation - starts with xpub, ypub, zpub, Zpub, etc.
    const xpubPattern = /^[xyzZ]pub[a-km-zA-HJ-NP-Z1-9]{107}$/;
    return xpubPattern.test(data);
  };

  // Parse SeedSigner format: [fingerprint/path]zpub
  const parseSeedSignerFormat = (data: string) => {
    // Manual parsing approach
    if (!data.startsWith("[") || !data.includes("]")) {
      return null;
    }

    const endBracketIndex = data.indexOf("]");
    if (endBracketIndex === -1) {
      return null;
    }

    const bracketContent = data.substring(1, endBracketIndex);
    const xpubPart = data.substring(endBracketIndex + 1);

    // Check if xpub part starts with xpub, ypub, zpub, or Zpub
    if (!xpubPart.match(/^[xXyYzZ]pub/)) {
      return null;
    }

    // Split the bracket content by first '/'
    const slashIndex = bracketContent.indexOf("/");
    if (slashIndex === -1) {
      return null;
    }

    const fingerprint = bracketContent.substring(0, slashIndex);
    const derivationPath = bracketContent.substring(slashIndex + 1);

    // Validate fingerprint is hex
    if (!fingerprint.match(/^[0-9a-fA-F]+$/)) {
      return null;
    }

    return {
      masterFingerprint: fingerprint,
      derivationPath: derivationPath,
      xpub: xpubPart,
    };
  };

  // Process scanned QR data
  const processQRData = useCallback(
    (data: string) => {
      console.log("Processing QR data:", data);

      if (!data || hasScannedRef.current) return;

      hasScannedRef.current = true;

      // For xpub import, we expect either:
      // 1. Direct xpub string
      // 2. UR encoded crypto account
      // 3. BBQR encoded data
      // 4. SeedSigner format: [fingerprint/path]zpub

      if (validateXpub(data)) {
        console.log("Valid xpub detected:", data);
        // Direct xpub
        onScanCompleted({ type: "xpub", data });
      } else if (data.startsWith("ur:")) {
        console.log("UR encoded data detected:", data);
        // UR encoded data
        onScanCompleted({ type: "ur", data });
      } else if (data.startsWith("B$")) {
        console.log("BBQR encoded data detected:", data);
        // BBQR encoded data
        onScanCompleted({ type: "bbqr", data });
      } else {
        // Try to parse as SeedSigner format
        const seedSignerData = parseSeedSignerFormat(data);
        if (seedSignerData) {
          console.log("SeedSigner format detected:", seedSignerData);
          onScanCompleted({
            type: "seedsigner",
            data: seedSignerData.xpub,
            masterFingerprint: seedSignerData.masterFingerprint,
            derivationPath: seedSignerData.derivationPath,
          });
        } else {
          console.log("QR code detected but not in expected format:", data);
          console.log("QR code length:", data.length);
          console.log("QR code type:", typeof data);

          // For now, let's accept any QR code and let the import handler deal with it
          // This allows for testing with different QR code formats
          onScanCompleted({
            type: "unknown",
            data,
            message:
              "QR code detected but format not recognized. Please ensure you're scanning an xpub QR code.",
          });
        }
      }

      resetQR();
    },
    [onScanCompleted, resetQR]
  );

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      console.log("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        console.log("Camera started successfully");
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      setErrorMessage("Camera access denied");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Scan QR codes
  const scanQR = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Check if video is ready and has valid dimensions
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.log("Video not ready:", {
        readyState: video.readyState,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Additional check to ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      console.log("Canvas dimensions invalid:", {
        width: canvas.width,
        height: canvas.height,
      });
      return;
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log("QR Code detected:", code.data);
        processQRData(code.data);
        return;
      }
    } catch (error) {
      console.error("Error scanning QR code:", error);
    }
  }, [processQRData]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            processQRData(code.data);
          } else {
            setHasError(true);
            setErrorMessage("No QR code found in image");
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [processQRData]
  );

  useEffect(() => {
    if (!hideCamera) {
      startCamera();
    }

    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hideCamera, startCamera, stopCamera]);

  useEffect(() => {
    if (!hideCamera && isScanning) {
      const scanFrame = () => {
        scanQR();
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
      };
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hideCamera, isScanning, scanQR]);

  if (hideCamera) {
    return (
      <div className="qr-scanner-file-upload">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="file-input"
        />
        <p>Upload QR code image</p>
      </div>
    );
  }

  return (
    <div className="qr-scanner">
      <video ref={videoRef} autoPlay playsInline muted className="qr-video" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {hasError && (
        <div className="qr-error">
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="qr-overlay">
        <div className="qr-frame" />
        <p>Position QR code within frame</p>
      </div>
    </div>
  );
}

export default QRScanner;
