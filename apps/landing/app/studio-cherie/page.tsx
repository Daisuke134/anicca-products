import {loadPublishedApps} from '../../lib/published-apps';
import '../../components/blog/owned-media.css';
import '../dailydharma/landing.css';
export const metadata={"title": "STUDIO CHERIE | 服を写真で整理するクローゼット管理アプリ", "description": "手持ちの服・靴・バッグ・アクセサリーを写真で整理。好きなコーデの保存や着こなしの提案、買い足す前の組み合わせの検討に。", "alternates": {"canonical": "https://aniccaai.com/studio-cherie"}};
const content={
  "h1": "手持ちの服から、今日の着こなし。",
  "introHeading": "シェリーってどんなアプリ？",
  "intro": "服も、靴も、バッグも。写真でまとめて、手持ちのアイテムを見渡す。\nコーデの提案やお気に入りのコーデを保存。買い足しアイテムや断捨離アイテムの仕分けなど、「シェリー」は毎日の服選びのためのクローゼット管理アプリです。",
  "cta": "アプリをダウンロード",
  "note": "ダウンロード無料。iPhone・iPad対応。対応条件はストアでご確認ください。",
  "hero": "closet",
  "caption": "写真付きでアイテムを登録するクローゼット管理画面。",
  "sections": [
    [
      "持っている服を見渡す",
      "服・靴・バッグ・アクセサリーを写真付きで登録。カテゴリごとに整理して、クローゼットの中身を確認できます。",
      "closet"
    ],
    [
      "好きな着こなしを残す",
      "気になるコーデの写真を保存。なりたいスタイルを集めて、手持ちの服をどう着るか考えるきっかけに。",
      "inspiration"
    ],
    [
      "次の組み合わせへ",
      "登録したアイテムをもとに、コーディネートの提案を確認。いつもの服の着方を見直したいときにも。",
      "suggest"
    ],
    [
      "買い足す前に考える",
      "購入を迷っている服を登録し、手持ちのアイテムとの組み合わせを検討できます。",
      "maybebuy"
    ],
    [
      "手放す前に、ひと休み",
      "すぐには手放せない服は、お休みボックスへ。今着る服と分けて、ワードローブを整理できます。",
      null
    ]
  ],
  "faq": [
    [
      "どんなアプリですか？",
      "服や小物を写真付きで管理し、手持ちのアイテムから着こなしを考えるアプリです。気になるコーデの保存や、購入を迷っている服の組み合わせの検討にも使えます。"
    ],
    [
      "購入前の服も試せますか？",
      "購入を迷っている服を登録し、手持ちのアイテムとどのように組み合わせられるか検討できます。実物の試着やサイズの保証をする機能ではありません。"
    ],
    [
      "料金はいくらですか？",
      "ストアでは無料でダウンロードできます。最新の料金や利用条件は、ダウンロード前にストアの表示をご確認ください。"
    ],
    [
      "どの端末で使えますか？",
      "iPhoneはiOS 18.0以降、iPadはiPadOS 18.0以降に対応しています。端末ごとの最新の対応条件はストアでご確認ください。"
    ],
    [
      "プライバシー情報はどこで確認できますか？",
      "ストアの「アプリのプライバシー」と、掲載されているプライバシーポリシーをご確認ください。"
    ]
  ],
  "close": "まずは、手持ちの服から。",
  "links": [
    [
      "商品一覧",
      "/dais/ja"
    ],
    [
      "ストア掲載のプライバシーポリシー",
      "https://studiocherie.official.ec/privacy"
    ]
  ],
  "assets": {
    "closet": {
      "src": "/images/studio-cherie/closet.jpg",
      "alt": "STUDIO CHERIEのクローゼット管理画面。"
    },
    "suggest": {
      "src": "/images/studio-cherie/suggest.jpg",
      "alt": "手持ちの服をもとにしたコーディネート提案画面。"
    },
    "inspiration": {
      "src": "/images/studio-cherie/inspiration.jpg",
      "alt": "理想のコーデを保存する画面。"
    },
    "maybebuy": {
      "src": "/images/studio-cherie/maybebuy.jpg",
      "alt": "購入候補の服を追加して検討する画面。"
    }
  }
};
export default function ProductLanding(){const app=loadPublishedApps().find(a=>a.id==='6766485903');if(!app)throw new Error('Missing published app');const store=app.store.replace("/us/","/jp/");const hero=content.assets[content.hero as keyof typeof content.assets];return <main lang="ja" className="media-page dhamma-page"><nav className="media-nav" aria-label="サイト内移動"><a href="/dais/ja">商品一覧</a></nav><div className="dhamma-layout"><aside className="dhamma-stage"><img src={hero.src} alt={hero.alt}/></aside><div className="dhamma-content"><header><p>{app.name}</p><h1>{content.h1}</h1><h2>{content.introHeading}</h2><p>{content.intro.split('\n').map((line,index)=><span key={line}>{index>0&&<br/>}{line}</span>)}</p><a className="media-button" href={store}>{content.cta}</a><p className="dhamma-note">{content.note}</p><img className="dhamma-mobile-hero" src={hero.src} alt={hero.alt}/><p className="dhamma-note">{content.caption}</p></header>{content.sections.map(([heading,body,image])=>{const shot=image?content.assets[image as keyof typeof content.assets]:null;return <section key={heading}><h2>{heading}</h2><p>{body}</p>{shot&&<img className="dhamma-screen" src={shot.src} alt={shot.alt} loading="lazy"/>}</section>})}<section><h2>よくある質問</h2>{content.faq.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section><section><h2>{content.close}</h2><a className="media-button" href={store}>{content.cta}</a><p className="dhamma-note">{content.note}</p></section><footer>{content.links.map(([label,href])=><a key={href} href={href}>{label}</a>)}</footer></div></div></main>}
