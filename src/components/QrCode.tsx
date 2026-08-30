import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
}

const QrCode = ({ value, size = 220 }: QrCodeProps) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#3F2A22', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse bg-[var(--cream)] rounded-lg"
        style={{ width: size, height: size }}
        aria-label="Generating QR code"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Verification QR code"
      width={size}
      height={size}
      className="rounded-lg bg-white p-2 border border-[var(--coffee-accent)]/30"
    />
  );
};

export default QrCode;