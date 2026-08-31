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
  weeks,
  photo,
  token,
}: CertificateDocumentProps) => {
  return (
    <div id="ksb-certificate" className="ksb-certificate">
      <div
        className="relative bg-[var(--cream-light)] overflow-hidden"
        style={{
          border: '10px double var(--coffee-dark)',
          borderRadius: '12px',
        }}
      >
        {/* Corner accents */}
        <div className="absolute left-4 top-4 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-[var(--coffee-accent)]" />
        <div className="absolute right-4 top-4 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-[var(--coffee-accent)]" />
        <div className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-[var(--coffee-accent)]" />
        <div className="absolute bottom-4 right-4 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-[var(--coffee-accent)]" />

        <div className="px-8 sm:px-14 py-10 sm:py-12 flex flex-col items-center text-center">
          {/* Header */}
          <img
            src="/images/KBS.jpeg"
            alt="KSB logo"
            className="h-20 w-20 rounded-full object-cover border-4 border-[var(--coffee-accent)]/40 mb-4"
          />
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[var(--coffee-light)] font-semibold">
            The Kigali Specialist Barista
          </p>
          <div className="my-3 flex items-center justify-center gap-3 w-full max-w-md">
            <div className="h-px flex-1 bg-[var(--coffee-accent)]/60" />
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--coffee-dark)] tracking-wide">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="h-px flex-1 bg-[var(--coffee-accent)]/60" />
          </div>

          <p className="font-serif italic text-sm sm:text-base text-[var(--text-medium)] mt-1">
            This is to certify that
          </p>

          {/* Student name */}
          <h2 className="my-3 font-serif text-3xl sm:text-4xl font-bold text-[var(--coffee-dark)] border-b-2 border-[var(--coffee-accent)] pb-2 px-6">
            {fullName}
          </h2>

          <p className="mt-3 max-w-xl text-sm sm:text-base text-[var(--text-medium)] leading-relaxed">
            has successfully completed the{' '}
            <span className="font-semibold text-[var(--coffee-light)]">
              {programTitle}
            </span>
            {weeks ? ` (${weeks} weeks)` : ''} barista training programme and
            demonstrated competence in all assessed modules.
          </p>

          {/* Photo */}
          {photo && (
            <div className="mt-6">
              <img
                src={photo}
                alt={fullName}
                className="h-24 w-24 rounded-full object-cover border-4 border-[var(--coffee-accent)]/40"
              />
            </div>
          )}

          {/* Details row */}
          <div className="mt-6 grid w-full max-w-xl grid-cols-1 sm:grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-[var(--coffee-accent)]/40 bg-white/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-light)]">Certificate ID</div>
              <div className="font-mono text-sm font-semibold text-[var(--text-dark)]">{certId}</div>
            </div>
            <div className="rounded-lg border border-[var(--coffee-accent)]/40 bg-white/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-light)]">Date of issue</div>
              <div className="text-sm font-semibold text-[var(--text-dark)]">{issueDate}</div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-8 flex w-full max-w-xl items-end justify-between">
            <div className="flex flex-col items-center">
              <div className="font-serif italic text-lg text-[var(--coffee-dark)]">KSB</div>
              <div className="mt-1 h-px w-36 bg-[var(--coffee-dark)]" />
              <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-light)]">Authorized Signature</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="font-serif italic text-lg text-[var(--coffee-dark)]">Kigali, Rwanda</div>
              <div className="mt-1 h-px w-36 bg-[var(--coffee-dark)]" />
              <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-light)]">Issued at</div>
            </div>
          </div>

          {/* QR code */}
          <div className="mt-8 flex flex-col items-center">
            <QrCode value={verificationURL(token)} size={140} />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--text-light)]">
              Scan to verify authenticity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDocument;
