export const metadata = {
  title: 'Privacy Policy | Honne Translation AI',
  description:
    'Privacy Policy for Honne Translation AI — what data is collected, how AI analysis works, and third-party sharing.',
};

/**
 * Legal text ported from the existing Honne privacy policy at
 * https://daisuke134.github.io/rork--ai/privacy-policy-en.html
 * (Last updated: March 9, 2026). Do not change legal meaning.
 */
export default function HonnePrivacyEn() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <div className="mb-6 text-right text-sm">
        <a href="/honne/privacy/ja" className="text-primary hover:underline">
          日本語
        </a>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: March 9, 2026</p>

      <p className="mt-6 text-muted-foreground">
        Honne Translation AI (&quot;the App&quot;) respects your privacy and is committed to protecting
        your personal information. This Privacy Policy explains what data the App collects, how it
        is used, and how it is shared with third parties.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">1. Data We Collect</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border border-border bg-muted/40 text-left">
              <th className="border border-border p-3 font-semibold text-foreground">Data Type</th>
              <th className="border border-border p-3 font-semibold text-foreground">
                Collection Method
              </th>
              <th className="border border-border p-3 font-semibold text-foreground">Purpose</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr>
              <td className="border border-border p-3">
                Messages and conversations entered by the user
              </td>
              <td className="border border-border p-3">Text input within the app</td>
              <td className="border border-border p-3">
                Sent to a third-party AI service for analysis
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">Subscription information</td>
              <td className="border border-border p-3">Via RevenueCat SDK</td>
              <td className="border border-border p-3">
                Purchase management and premium feature delivery
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">
                App usage data (free usage count)
              </td>
              <td className="border border-border p-3">On-device UserDefaults</td>
              <td className="border border-border p-3">Managing free usage limits</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-muted-foreground">
        The App does not collect personally identifiable information such as names, email
        addresses, phone numbers, or location data.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">
        2. Data Sharing with Third-Party AI Service
      </h2>
      <p className="mt-3 text-muted-foreground">
        The App sends user-entered messages to <strong className="text-foreground">OpenAI, Inc.</strong>{' '}
        servers for AI analysis.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border border-border bg-muted/40 text-left">
              <th className="border border-border p-3 font-semibold text-foreground">Item</th>
              <th className="border border-border p-3 font-semibold text-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr>
              <td className="border border-border p-3">Recipient</td>
              <td className="border border-border p-3">
                OpenAI, Inc. (San Francisco, California, USA)
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">Data Sent</td>
              <td className="border border-border p-3">
                Only the text of messages and conversations entered by the user
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">Purpose</td>
              <td className="border border-border p-3">
                Psychological analysis, translation of true intentions, and response suggestions
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">Data Retention</td>
              <td className="border border-border p-3">
                Per OpenAI&apos;s API usage terms (API request data is not used for model training)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-muted-foreground">
        <strong className="text-foreground">Important:</strong> The App obtains explicit user
        consent before sending any data to the AI service. A consent dialog is displayed before
        first use.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">
        3. RevenueCat (Payment Processing)
      </h2>
      <p className="mt-3 text-muted-foreground">
        The App uses the RevenueCat, Inc. SDK for subscription management. RevenueCat processes
        purchase transaction information, but payment details such as credit card information are
        processed directly by Apple.
      </p>
      <p className="mt-3 text-muted-foreground">
        RevenueCat Privacy Policy:{' '}
        <a
          href="https://www.revenuecat.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          https://www.revenuecat.com/privacy
        </a>
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">4. Data Storage</h2>
      <p className="mt-3 text-muted-foreground">
        Translation history is stored only on the device and is not sent to external servers.
        Deleting the app removes all local data.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">5. Children&apos;s Privacy</h2>
      <p className="mt-3 text-muted-foreground">
        The App is not directed at children under 13 and does not knowingly collect information
        from children under 13.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">6. Your Rights</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>You can revoke your data sharing consent at any time from the Settings screen</li>
        <li>
          Translation history is stored locally and can be completely erased by deleting the app
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
      <p className="mt-3 text-muted-foreground">
        This Privacy Policy may be updated from time to time. Significant changes will be
        communicated through the app.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">8. Contact Us</h2>
      <p className="mt-3 text-muted-foreground">For privacy-related inquiries, please contact us at:</p>
      <p className="mt-2 text-muted-foreground">
        Email:{' '}
        <a href="mailto:daisuke@aniccaai.com" className="underline hover:text-foreground">
          daisuke@aniccaai.com
        </a>
      </p>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        <a href="/honne/privacy/ja" className="underline hover:text-foreground">
          日本語版プライバシーポリシー
        </a>
        {' · '}
        <a href="/honne" className="underline hover:text-foreground">
          Back to Honne
        </a>
        {' · '}
        <a href="/honne/support" className="underline hover:text-foreground">
          Support
        </a>
      </div>
    </main>
  );
}
