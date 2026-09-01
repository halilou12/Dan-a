import QrCode from './QrCode';
import { verificationURL } from '../lib/store';

interface CertificateDocumentProps {
  certId: string;
  fullName: string;
  programTitle: string;
  issueDate: string;
  weeks?: number;
  photo?: string | null;
  token: string;
  status: 'valid' | 'revoked';
}

const CertificateDocument = ({
  certId,
  fullName,
  programTitle,
  issueDate,
  photo,
  token,
}: CertificateDocumentProps) => {
  return (
    <div
      id={`ksb-certificate-${certId}`}
      className="ksb-certificate relative w-full"
      style={{
        aspectRatio: '607 / 422',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      {/* certificate.png IS the certificate paper. Rendered as a real <img>,
          never a CSS background, so it always prints — even when the browser
          dialog has "background graphics" turned off. */}
      <img
        src="/images/certificate.png"
        alt=""
        aria-hidden
        className="ksb-certificate-paper absolute inset-0 h-full w-full"
        style={{ objectFit: 'fill', display: 'block' }}
      />

      {/* Student photo — top-left corner */}
      {photo && (
        <div
          className="absolute overflow-hidden rounded-full border-2 border-white shadow"
          style={{
            left: '5%',
            top: '7%',
            width: '18%',
            aspectRatio: '1 / 1',
          }}
        >
          <img src={photo} alt={fullName} className="h-full w-full object-cover" />
        </div>
      )}

      {/* QR code — top-right corner */}
      <div className="absolute flex flex-col items-center" style={{ right: '4%', top: '6%' }}>
        <QrCode value={verificationURL(token)} size={110} />
        <p
          className="text-center text-white"
          style={{ fontSize: '9px', textShadow: '1px 1px 1px rgba(0,0,0,0.7)' }}
        >
          Scan to verify
        </p>
      </div>

        {/* Student name — under "proudly presented to" (center body) */}
        <div className="absolute left-0 w-full text-center" style={{ top: '50%' }}>
          <p
            className="mx-auto font-serif font-bold text-white"
            style={{
              fontSize: 'clamp(16px, 3.2vw, 30px)',
              textShadow: '1px 2px 4px rgba(0,0,0,0.65)',
              maxWidth: '80%',
              lineHeight: 1.1,
            }}
          >
            {fullName}
          </p>
        </div>

        {/* Program title — below the name */}
        <div className="absolute left-0 w-full text-center" style={{ top: '60%' }}>
          <p
            className="mx-auto px-[10%] font-medium text-white"
            style={{
              fontSize: 'clamp(11px, 1.9vw, 18px)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
              lineHeight: 1.2,
            }}
          >
            {programTitle}
          </p>
        </div>

        {/* Certificate ID — bottom-left */}
        <div className="absolute left-[6%] text-white" style={{ bottom: '9%' }}>
          <p className="font-mono" style={{ fontSize: 'clamp(9px, 1.4vw, 14px)' }}>{certId}</p>
        </div>

        {/* Issue date — bottom-right */}
        <div className="absolute right-[6%] text-white text-right" style={{ bottom: '9%' }}>
          <p style={{ fontSize: 'clamp(9px, 1.4vw, 14px)' }}>{issueDate}</p>
        </div>
    </div>
  );
};

export default CertificateDocument;
