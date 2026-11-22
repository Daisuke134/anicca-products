'use client';

import { useEffect } from 'react';

export default function BreathCalmTerms() {
  useEffect(() => {
    window.location.href = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
  }, []);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <p className="text-muted-foreground">Redirecting to Terms of Use...</p>
      <p className="mt-6 text-muted-foreground">
        If you are not redirected, read the{' '}
        <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms of Use on apple.com</a>.
      </p>
      <p className="mt-6">
        <a href="/about">About Anicca →</a>
      </p>
    </main>
  );
}
