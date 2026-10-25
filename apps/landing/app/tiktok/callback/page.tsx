export const metadata = { title: 'TikTok Connected | Anicca', robots: { index: false } };

export default function TikTokCallback() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold text-foreground">TikTok authorization</h1>
      <p className="mt-6 text-muted-foreground">
        Thank you. Your TikTok account authorization for Anicca has been received. You can close this window.
      </p>
      <p className="mt-3 text-muted-foreground">
        See our <a className="underline" href="/terms">Terms of Service</a> and <a className="underline" href="/privacy">Privacy Policy</a>. Questions: keiodaisuke@gmail.com
      </p>
    </main>
  );
}
