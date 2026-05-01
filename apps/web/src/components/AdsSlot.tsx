import { useEffect } from 'react';

type AdsSlotProps = {
  slot: string;
  className?: string;
};

const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT;

const AdsSlot: React.FC<AdsSlotProps> = ({ slot, className }) => {
  useEffect(() => {
    if (!adsenseClient) {
      return;
    }

    try {
      (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || [];
      (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle?.push({});
    } catch {
      // no-op in local/dev environments where ad serving is blocked
    }
  }, []);

  if (!adsenseClient) {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle block min-h-[120px] w-full rounded-xl border border-infamous-border bg-infamous-dark ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={adsenseClient}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default AdsSlot;
