export const metadata = {
  title: 'Support | Honne',
  description: 'Get help with Honne — Chat Intent Revealed by AI',
};

export default function HonneSupport() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <h1 className="text-3xl font-bold text-foreground">Support</h1>
      <p className="mt-2 text-muted-foreground">Honne — Chat Intent Revealed by AI</p>

      <p className="mt-6 text-muted-foreground">
        Need help with Honne? We&apos;re here to assist you.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
        <p className="mt-3 text-muted-foreground">
          For support inquiries, feature requests, or general questions, please contact us:
        </p>
        <p className="mt-4">
          <a
            href="mailto:keiodaisuke@gmail.com"
            className="font-medium text-primary hover:underline"
          >
            keiodaisuke@gmail.com
          </a>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We typically respond within 2 business days.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">What is Honne?</h3>
            <p className="mt-2 text-muted-foreground">
              Honne is an iOS app that analyzes pasted LINE or chat messages for hidden emotions
              and suggests replies intended to protect the relationship. It is developed by
              Daisuke Narita (Anicca).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">How many free analyses do I get?</h3>
            <p className="mt-2 text-muted-foreground">
              The free tier includes 3 analyses per day. Premium unlocks unlimited analyses, full
              history, priority speed, and deeper insights.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Is my chat text private?</h3>
            <p className="mt-2 text-muted-foreground">
              Messages you enter are sent to a third-party AI service for analysis, with your
              consent. History stays on your device. See our{' '}
              <a href="/honne/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>{' '}
              for details.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Which devices are supported?</h3>
            <p className="mt-2 text-muted-foreground">
              Honne requires iOS 18.0 or later (iPhone and iPad).
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">Additional Resources</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>
            <a href="/honne" className="text-primary hover:underline">
              Honne product page
            </a>
          </li>
          <li>
            <a href="/honne/ja" className="text-primary hover:underline">
              日本語ページ
            </a>
          </li>
          <li>
            <a href="/honne/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              className="text-primary hover:underline"
            >
              Terms of Use (EULA)
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
