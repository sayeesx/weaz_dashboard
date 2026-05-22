'use client';

export default function SentryTestPage() {
  const triggerError = () => {
    throw new Error("WEAZ Dashboard Production Test — " + new Date().toISOString());
  };

  return (
    <div className="p-20 bg-black text-white font-mono flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-8">Sentry Hardening Validation</h1>
      <button 
        onClick={triggerError}
        className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
      >
        TRIGGER PRODUCTION EXCEPTION
      </button>
      <p className="mt-4 text-white/30 text-sm">Verify event appears in Sentry dashboard after clicking.</p>
    </div>
  );
}
