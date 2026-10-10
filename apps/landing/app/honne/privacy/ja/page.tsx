export const metadata = {
  title: 'プライバシーポリシー | 本音翻訳AI',
  description:
    '本音翻訳AIのプライバシーポリシー — 収集データ、AI分析、第三者への送信について。',
};

/**
 * Legal text ported from the existing Honne privacy policy at
 * https://daisuke134.github.io/rork--ai/privacy-policy.html
 * (最終更新日: 2026年3月9日). Do not change legal meaning.
 */
export default function HonnePrivacyJa() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <div className="mb-6 text-right text-sm">
        <a href="/honne/privacy" className="text-primary hover:underline">
          English
        </a>
      </div>

      <h1 className="text-3xl font-bold text-foreground">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年3月9日</p>

      <p className="mt-6 text-muted-foreground">
        本音翻訳AI（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーは、本アプリが収集するデータ、その使用方法、および第三者との共有について説明します。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">1. 収集するデータ</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border border-border bg-muted/40 text-left">
              <th className="border border-border p-3 font-semibold text-foreground">
                データの種類
              </th>
              <th className="border border-border p-3 font-semibold text-foreground">収集方法</th>
              <th className="border border-border p-3 font-semibold text-foreground">目的</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr>
              <td className="border border-border p-3">
                ユーザーが入力したメッセージ・会話文
              </td>
              <td className="border border-border p-3">アプリ内のテキスト入力</td>
              <td className="border border-border p-3">
                AI分析のため第三者AIサービスに送信
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">サブスクリプション情報</td>
              <td className="border border-border p-3">RevenueCat SDK経由</td>
              <td className="border border-border p-3">購入管理・プレミアム機能の提供</td>
            </tr>
            <tr>
              <td className="border border-border p-3">アプリ利用状況（無料回数等）</td>
              <td className="border border-border p-3">デバイス内のUserDefaults</td>
              <td className="border border-border p-3">無料利用回数の管理</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-muted-foreground">
        本アプリは、氏名、メールアドレス、電話番号、位置情報などの個人を特定できる情報を収集しません。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">
        2. 第三者AIサービスへのデータ送信
      </h2>
      <p className="mt-3 text-muted-foreground">
        本アプリは、ユーザーが入力したメッセージをAI分析のために
        <strong className="text-foreground">OpenAI社</strong>
        のサーバーに送信します。
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border border-border bg-muted/40 text-left">
              <th className="border border-border p-3 font-semibold text-foreground">項目</th>
              <th className="border border-border p-3 font-semibold text-foreground">詳細</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr>
              <td className="border border-border p-3">送信先</td>
              <td className="border border-border p-3">
                OpenAI, Inc.（米国カリフォルニア州）
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">送信されるデータ</td>
              <td className="border border-border p-3">
                ユーザーが入力したメッセージ・会話文のテキストのみ
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">送信目的</td>
              <td className="border border-border p-3">
                メッセージの心理分析・本音の翻訳・返答提案の生成
              </td>
            </tr>
            <tr>
              <td className="border border-border p-3">データの保持</td>
              <td className="border border-border p-3">
                OpenAI社のAPI利用規約に準拠（APIリクエストのデータはモデル学習に使用されません）
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-muted-foreground">
        <strong className="text-foreground">重要:</strong>{' '}
        本アプリは、AIサービスへのデータ送信前にユーザーの明示的な同意を取得します。初回利用時にデータの取り扱いに関する同意画面が表示されます。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">3. RevenueCat（決済処理）</h2>
      <p className="mt-3 text-muted-foreground">
        本アプリは、サブスクリプション管理のためにRevenueCat, Inc.のSDKを使用しています。RevenueCatは購入トランザクション情報を処理しますが、クレジットカード情報等の決済情報はApple社が直接処理します。
      </p>
      <p className="mt-3 text-muted-foreground">
        RevenueCatのプライバシーポリシー:{' '}
        <a
          href="https://www.revenuecat.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          https://www.revenuecat.com/privacy
        </a>
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">4. データの保存</h2>
      <p className="mt-3 text-muted-foreground">
        翻訳履歴はデバイス内にのみ保存され、外部サーバーには送信されません。アプリを削除すると、デバイス内の全データが削除されます。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">5. 子どものプライバシー</h2>
      <p className="mt-3 text-muted-foreground">
        本アプリは13歳未満の子どもを対象としておらず、13歳未満の子どもから意図的に情報を収集することはありません。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">6. ユーザーの権利</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>データ送信の同意はいつでも設定画面から取り消すことができます</li>
        <li>
          翻訳履歴はデバイス内に保存されているため、アプリの削除により完全に消去されます
        </li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-foreground">7. ポリシーの変更</h2>
      <p className="mt-3 text-muted-foreground">
        本プライバシーポリシーは予告なく変更されることがあります。重要な変更がある場合は、アプリ内で通知します。
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">8. お問い合わせ</h2>
      <p className="mt-3 text-muted-foreground">
        プライバシーに関するご質問は、以下までお問い合わせください。
      </p>
      <p className="mt-2 text-muted-foreground">
        Email:{' '}
        <a href="mailto:daisuke@aniccaai.com" className="underline hover:text-foreground">
          daisuke@aniccaai.com
        </a>
      </p>

      <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
        <a href="/honne/privacy" className="underline hover:text-foreground">
          English Privacy Policy
        </a>
        {' · '}
        <a href="/honne/ja" className="underline hover:text-foreground">
          本音翻訳に戻る
        </a>
        {' · '}
        <a href="/honne/support" className="underline hover:text-foreground">
          サポート
        </a>
      </div>
    </main>
  );
}
