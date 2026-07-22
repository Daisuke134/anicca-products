const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const html2pptx = require('../../../.claude/skills/pptx/scripts/html2pptx');

const root = __dirname;
const work = path.join(root, 'work');
const out = path.join(root, 'output');
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(out, { recursive: true });

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const img = (name) => path.join(root, 'assets', name);

const base = `
* { box-sizing: border-box; }
html, body { width: 720pt; height: 405pt; margin: 0; padding: 0; }
body { display: flex; position: relative; overflow: hidden; background: #F5F1E8; color: #171717; font-family: Arial, sans-serif; }
h1, h2, h3, p, ul, ol { margin: 0; }
h1 { font-size: 38pt; line-height: 1.05; letter-spacing: -1.4pt; }
h2 { font-size: 25pt; line-height: 1.08; letter-spacing: -0.7pt; }
h3 { font-size: 13pt; line-height: 1.15; }
p, li { font-size: 12pt; line-height: 1.32; }
ul, ol { padding-left: 17pt; }
.slide { width: 720pt; height: 405pt; padding: 27pt 34pt 24pt; position: relative; display: flex; flex-direction: column; }
.dark { background: #111111; color: #F5F1E8; }
.gold { color: #C99B2E; }
.muted { color: #68645C; }
.dark .muted { color: #BFB7A7; }
.kicker { font-size: 8.5pt; font-weight: bold; letter-spacing: 1.3pt; text-transform: uppercase; color: #A97C16; }
.rule { width: 52pt; height: 4pt; background: #C99B2E; margin: 10pt 0 13pt; }
.header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18pt; }
.header .num { width: 38pt; height: 38pt; border: 1.5pt solid #C99B2E; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.header .num p { color: #A97C16; font-size: 14pt; font-weight: bold; }
.grid2 { display: flex; gap: 20pt; flex: 1; min-height: 0; }
.col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.card { background: #FFFFFF; border: 1pt solid #D9D2C3; border-radius: 8pt; padding: 13pt; }
.dark .card { background: #1B1B1B; border-color: #38342C; }
.accent-card { background: #D7AE4A; color: #111111; border-radius: 9pt; padding: 16pt; }
.big { font-size: 26pt; line-height: 1.05; font-weight: bold; }
.stat { font-size: 29pt; line-height: 1; font-weight: bold; color: #A97C16; }
.small { font-size: 9.5pt; line-height: 1.25; }
.tiny { font-size: 7.5pt; line-height: 1.2; }
.tag { display: inline-flex; background: #EEE6D5; border-radius: 20pt; padding: 4pt 8pt; margin-right: 5pt; }
.tag p { font-size: 8.5pt; font-weight: bold; color: #564C38; }
.dark .tag { background: #2A2721; }
.dark .tag p { color: #E3C982; }
.steps { display: flex; align-items: stretch; gap: 8pt; flex: 1; }
.step { flex: 1; background: #FFFFFF; border: 1pt solid #D9D2C3; border-radius: 8pt; padding: 12pt 10pt; display: flex; flex-direction: column; }
.step .n { width: 25pt; height: 25pt; border-radius: 50%; background: #C99B2E; display: flex; align-items: center; justify-content: center; margin-bottom: 9pt; }
.step .n p { font-weight: bold; font-size: 10pt; }
.arrow { width: 11pt; display: flex; align-items: center; justify-content: center; }
.arrow p { font-size: 18pt; color: #A97C16; }
.folio { position: absolute; right: 34pt; bottom: 13pt; }
.folio p { font-size: 7pt; color: #8E887D; }
.source { position: absolute; left: 34pt; bottom: 12pt; }
.source p { font-size: 6.5pt; color: #8E887D; }
`;

function page(title, body, opts = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${base}${opts.css || ''}</style></head><body class="${opts.dark ? 'dark' : ''}"><div class="slide">${body}<div class="folio"><p>${esc(opts.folio || '')}</p></div></div></body></html>`;
}

const slides = [
  page('Anicca Life Manager', `
    <div style="display:flex; height:100%; gap:28pt; align-items:center;">
      <div style="width:430pt; display:flex; flex-direction:column;">
        <p class="kicker">課題A｜グローバル市場向けプロダクト</p>
        <div class="rule"></div>
        <h1><span class="gold">Anicca</span><br>Life Manager</h1>
        <p style="font-size:19pt; line-height:1.28; margin-top:16pt;">意志力ではなく、<br><b>あなたの代わりに動く。</b></p>
        <p class="muted" style="font-size:11pt; margin-top:18pt;">安全に実行する、プロアクティブAIライフマネージャー</p>
        <p style="font-size:9pt; margin-top:28pt;">成田大祐｜個人応募｜NAIST 情報科学領域 修士課程</p>
      </div>
      <div style="width:190pt; display:flex; align-items:center; justify-content:center;">
        <div style="width:178pt; height:178pt; border:1pt solid #453A25; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#1B1B1B;">
          <img src="${img('anicca-icon.png')}" style="width:132pt; height:132pt; border-radius:26pt;">
        </div>
      </div>
    </div>`, { dark: true, folio: '01 / 09' }),

  page('Why', `
    <div class="header"><div><p class="kicker">WHY NOW</p><div class="rule"></div><h2>予定はある。<br>でも、人は予定どおりに動けない。</h2></div><div class="num"><p>1</p></div></div>
    <div class="grid2">
      <div class="col" style="justify-content:space-between;">
        <div class="accent-card">
          <p style="font-size:17pt; line-height:1.28; font-weight:bold;">「支えてくれる道具」ではなく、<br>先に動いて導く存在が必要だった。</p>
        </div>
        <p class="muted" style="font-size:11pt;">私は起床・移動・瞑想を何度も習慣化しようとして失敗した。カレンダー、習慣アプリ、対話AIは、私が開くまで何もしない。</p>
      </div>
      <div class="col" style="gap:9pt;">
        <div class="card"><h3>反応型の限界</h3><p class="small muted" style="margin-top:5pt;">通知を見ても、行動に移るとは限らない。</p></div>
        <div class="card"><h3>実行権限の空白</h3><p class="small muted" style="margin-top:5pt;">AIに任せたい一方、カードや認証情報の丸投げは危険。</p></div>
        <div class="card"><h3>行動の証拠が残らない</h3><p class="small muted" style="margin-top:5pt;">何を、なぜ、いくらで実行したかを後から検証しにくい。</p></div>
      </div>
    </div>`, { folio: '02 / 09' }),

  page('Target', `
    <div class="header"><div><p class="kicker">BEACHHEAD</p><div class="rule"></div><h2>最初は「遅刻する創業者」に絞る</h2></div><div class="num"><p>2</p></div></div>
    <div style="display:flex; gap:12pt; flex:1;">
      <div class="card" style="width:245pt; display:flex; flex-direction:column; justify-content:center;">
        <p class="big">忙しい創業者・<br>知識労働者</p>
        <p class="muted" style="margin-top:12pt;">カレンダーは使うが、起床・出発・切替が遅れ、重要な約束を落とす人。</p>
      </div>
      <div style="display:flex; flex-direction:column; gap:9pt; flex:1;">
        <div class="card" style="flex:1;"><p class="stat">01</p><h3 style="margin-top:6pt;">移動時間を毎回調べる</h3><p class="small muted" style="margin-top:4pt;">予定に場所がなく、準備・移動枠もない。</p></div>
        <div class="card" style="flex:1;"><p class="stat">02</p><h3 style="margin-top:6pt;">通知を無視する</h3><p class="small muted" style="margin-top:4pt;">情報は届くが、身体は動かない。</p></div>
        <div class="card" style="flex:1;"><p class="stat">03</p><h3 style="margin-top:6pt;">遅刻連絡まで遅れる</h3><p class="small muted" style="margin-top:4pt;">相手への説明・連絡も本人の負担になる。</p></div>
      </div>
    </div>`, { folio: '03 / 09', css: '.header{margin-bottom:10pt}.card{padding:9pt}.col{gap:6pt !important;}' }),

  page('Product', `
    <div class="header"><div><p class="kicker">PRODUCT TODAY</p><div class="rule"></div><h2>Life Managerが予定を読み、<br>Aniccaが人を動かす</h2></div><div class="num"><p>3</p></div></div>
    <div class="grid2" style="gap:16pt;">
      <div class="col" style="width:330pt; flex:none;">
        <div style="height:186pt; border:1pt solid #D9D2C3; border-radius:8pt; overflow:hidden; background:#FFFFFF;">
          <img src="${img('life-manager-hero.png')}" style="width:100%; height:100%; object-fit:cover; object-position:left center;">
        </div>
        <p class="tiny muted" style="margin-top:6pt;">実稼働画面：aniccaai.com/life-manager</p>
      </div>
      <div class="col" style="gap:8pt;">
        <div class="card"><h3>カレンダー</h3><p class="small muted" style="margin-top:4pt;">物理予定の移動・準備時間を自動挿入。</p></div>
        <div class="card"><h3>電話</h3><p class="small muted" style="margin-top:4pt;">出発10分前・5分前に段階的に呼びかける。</p></div>
        <div class="card"><h3>Telegram</h3><p class="small muted" style="margin-top:4pt;">場所確認、遅刻確認、実行後の報告。</p></div>
        <div class="accent-card" style="padding:10pt 12pt;"><p class="small"><b>Anicca統合：</b>起床・集中・瞑想・不安など、13種類の行動変容ナッジを生活文脈に合わせる。</p></div>
      </div>
    </div>`, { folio: '04 / 09' }),

  page('Demo', `
    <div class="header"><div><p class="kicker">EXPERIENCE</p><div class="rule"></div><h2>開かなくても、人生が前に進む</h2></div><div class="num"><p>4</p></div></div>
    <div class="steps">
      <div class="step"><div class="n"><p>1</p></div><h3>予定を読む</h3><p class="small muted" style="margin-top:7pt;">場所・移動時間・本人の行動傾向を推定。</p></div>
      <div class="arrow"><p>→</p></div>
      <div class="step"><div class="n"><p>2</p></div><h3>先回りする</h3><p class="small muted" style="margin-top:7pt;">準備枠を追加し、出発前に電話する。</p></div>
      <div class="arrow"><p>→</p></div>
      <div class="step"><div class="n"><p>3</p></div><h3>身体を動かす</h3><p class="small muted" style="margin-top:7pt;">Aniccaが今の状態に合う短い指示を出す。</p></div>
      <div class="arrow"><p>→</p></div>
      <div class="step"><div class="n"><p>4</p></div><h3>代わりに処理</h3><p class="small muted" style="margin-top:7pt;">遅刻連絡や小額支払いを権限内で実行。</p></div>
      <div class="arrow"><p>→</p></div>
      <div class="step"><div class="n"><p>5</p></div><h3>証跡を返す</h3><p class="small muted" style="margin-top:7pt;">何をしたか、金額、理由、取消手段を報告。</p></div>
    </div>
    <div style="margin-top:12pt; display:flex; gap:7pt;">
      <div class="tag"><p>アプリ起動不要</p></div><div class="tag"><p>質問は最小</p></div><div class="tag"><p>実行後に報告</p></div><div class="tag"><p>いつでも取消</p></div>
    </div>`, { folio: '05 / 09' }),

  page('Blockchain', `
    <div class="header"><div style="width:560pt;"><p class="kicker">WHY BLOCKCHAIN</p><div class="rule"></div><h2 style="font-size:21pt;">秘密鍵を渡さない<br>渡すのは限定権限</h2></div><div class="num"><p>5</p></div></div>
    <div class="grid2">
      <div class="col">
        <div class="accent-card" style="height:100%; display:flex; flex-direction:column; justify-content:center;">
          <p style="font-size:10pt; font-weight:bold; letter-spacing:1pt;">LIFE MANDATE</p>
          <p class="big" style="margin-top:11pt;">「7日間、交通と健康に<br>合計50ドルまで」</p>
          <p class="small" style="margin-top:15pt;">用途・上限・期限・相手先をスマートアカウント側で強制し、いつでも失効できる。</p>
        </div>
      </div>
      <div class="col" style="gap:9pt;">
        <div class="card"><h3>安全な代理実行</h3><p class="small muted" style="margin-top:4pt;">権限を狭くし、本人が不在でも条件内だけ実行。</p></div>
        <div class="card"><h3>グローバルな小額決済</h3><p class="small muted" style="margin-top:4pt;">ステーブルコインとx402で、国境を越えたサービス購入を即時化。</p></div>
        <div class="card"><h3>検証可能な証跡</h3><p class="small muted" style="margin-top:4pt;">個人データは非公開のまま、権限・支払い・取消を監査可能にする。</p></div>
        <p class="tiny muted">実装対象：ERC-4337型スマートアカウント、ERC-7715型権限要求、x402決済。規格選定はプログラム内で検証。</p>
      </div>
    </div>
    <div class="source"><p>出典：eips.ethereum.org/EIPS/eip-4337 ｜ eips.ethereum.org/EIPS/eip-7715 ｜ x402.org</p></div>`, { folio: '06 / 09' }),

  page('Architecture', `
    <div class="header"><div><p class="kicker">SYSTEM</p><div class="rule"></div><h2>秘密の生活文脈と、公開できる権限証跡を分離する</h2></div><div class="num"><p>6</p></div></div>
    <div style="display:flex; align-items:stretch; gap:10pt; flex:1;">
      <div class="card" style="width:185pt;"><p class="kicker">PRIVATE CONTEXT</p><h3 style="margin-top:10pt;">Life Managerクラウド</h3><ul style="margin-top:10pt;"><li class="small">カレンダー</li><li class="small">位置・移動</li><li class="small">会話・気分</li><li class="small">Anicca行動モデル</li></ul><p class="tiny muted" style="margin-top:12pt;">個人データはチェーンに載せない。</p></div>
      <div class="arrow"><p>→</p></div>
      <div class="accent-card" style="width:190pt;"><p class="kicker" style="color:#4D3A0C;">POLICY ENGINE</p><h3 style="margin-top:10pt; font-size:16pt;">Life Mandate</h3><ul style="margin-top:10pt;"><li class="small">用途</li><li class="small">金額上限</li><li class="small">期限</li><li class="small">許可先</li></ul><p class="small" style="margin-top:11pt;"><b>違反する実行は通らない。</b></p></div>
      <div class="arrow"><p>→</p></div>
      <div class="card" style="width:185pt;"><p class="kicker">OPEN EXECUTION</p><h3 style="margin-top:10pt;">ウォレット＋x402</h3><ul style="margin-top:10pt;"><li class="small">交通・予約</li><li class="small">健康サービス</li><li class="small">AI/API購入</li><li class="small">実行レシート</li></ul><p class="tiny muted" style="margin-top:12pt;">加盟店ごとのアカウント登録を減らす。</p></div>
    </div>`, { folio: '07 / 09' }),

  page('Validation', `
    <div class="header"><div><p class="kicker">BUSINESS + VALIDATION</p><div class="rule"></div><h2>まず「遅刻しない」に課金し、<br>行動成果から広げる</h2></div><div class="num"><p>7</p></div></div>
    <div class="grid2">
      <div class="col" style="gap:9pt;">
        <div class="accent-card"><p class="small">クラウド版</p><p class="big" style="margin-top:5pt;">20ドル／月</p><p class="small" style="margin-top:5pt;">電話・Telegram・カレンダー・実行権限</p></div>
        <div class="card"><h3>無料導線</h3><p class="small muted" style="margin-top:4pt;">同じ中核をローカル版OSSとして提供し、信頼と開発者流入を得る。</p></div>
      </div>
      <div class="col" style="gap:8pt;">
        <div style="display:flex; gap:8pt;">
          <div class="card" style="flex:1;"><p class="stat">LIVE</p><p class="small muted" style="margin-top:6pt;">クラウド版・実電話・移動枠</p></div>
          <div class="card" style="flex:1;"><p class="stat">$27</p><p class="small muted" style="margin-top:6pt;">Anicca iOSの月次経常収益</p></div>
        </div>
        <div class="card"><h3>検証する仮説</h3><ol style="margin-top:7pt;"><li class="small">週3回以上の先回り介入で遅刻率が半減する</li><li class="small">上限付き委任はクレジットカード共有より信頼される</li><li class="small">月20ドルでも3か月継続する</li></ol></div>
        <p class="tiny muted">注：月次経常収益は aniccaai.com/dashboard.json の公開値（更新時点 2026-06-05）。Life Managerの外部有料ユーザーはまだゼロ。</p>
      </div>
    </div>`, { folio: '08 / 09' }),

  page('Team', `
    <div class="header"><div style="width:560pt;"><p class="kicker">DEMO DAY + TEAM</p><div class="rule"></div><h2 style="font-size:21pt;">最終発表<br>委任・決済・取消</h2></div><div class="num"><p>8</p></div></div>
    <div class="grid2">
      <div class="col" style="gap:9pt;">
        <div class="card"><h3>デモ</h3><ol style="margin-top:8pt;"><li class="small">ユーザーが7日・50ドルの権限を設定</li><li class="small">予定からジム体験を選び、予約・支払い</li><li class="small">Aniccaが電話で行動を促す</li><li class="small">レシート表示後、権限を即時取消</li></ol></div>
        <div class="accent-card" style="padding:11pt;"><p class="small"><b>このプログラムで得たいこと：</b>ウォレット権限設計、決済・規制、脅威モデル、実ユーザー検証の壁打ち。</p></div>
      </div>
      <div class="col" style="flex-direction:row; gap:12pt; align-items:center;">
        <img src="${img('dais-profile.jpg')}" style="width:104pt; height:136pt; object-fit:cover; border-radius:8pt;">
        <div style="flex:1;">
          <p class="kicker">個人応募</p><h3 style="font-size:18pt; margin-top:6pt;">成田大祐</h3>
          <p class="small muted" style="margin-top:7pt;">慶應義塾大学 法学部卒<br>NAIST 情報科学領域 修士課程<br>修士研究：注意散漫検出と行動変容<br>MUITで業務AI導入<br>Aniccaを一人で開発・運用</p>
          <p style="font-size:9pt; line-height:1.2; margin-top:8pt;"><b>既に動く生活エージェントへ、<br>安全な実行権限を。</b></p>
        </div>
      </div>
    </div>`, { folio: '09 / 09' })
];

const canvasCss = `
.slide { padding: 14pt 16pt 12pt; }
.canvas-title { height: 34pt; display:flex; align-items:center; justify-content:space-between; margin-bottom:5pt; }
.canvas-title h1 { font-size:21pt; }
.canvas-title p { font-size:8pt; }
.canvas-row { display:flex; gap:4pt; }
.box { background:#FFFFFF; border:1pt solid #CFC7B9; border-radius:4pt; padding:7pt; display:flex; flex-direction:column; }
.box h3 { font-size:9.5pt; color:#8A6411; margin-bottom:4pt; }
.box p, .box li { font-size:7.2pt; line-height:1.23; }
.box ul { padding-left:10pt; }
.lean { height:248pt; display:flex; flex-direction:column; gap:4pt; }
.top { height:122pt; }
.bottom { height:122pt; }
.momentum { height:95pt; margin-top:5pt; }
.m { background:#1A1A1A; color:#F5F1E8; border-color:#3A3429; }
.m h3 { color:#E6C46F; }
`;

const canvas = page('Hackathon Canvas', `
  <div class="canvas-title"><div><h1><span class="gold">Anicca</span> Life Manager</h1><p class="muted">Hackathon Canvas｜課題A：グローバル市場｜個人応募：成田大祐</p></div><img src="${img('anicca-icon.png')}" style="width:28pt; height:28pt; border-radius:6pt;"></div>
  <div class="lean">
    <div class="canvas-row top">
      <div class="box" style="width:128pt;"><h3>1. 課題</h3><ul><li>カレンダーがあっても人は動けない</li><li>AIに決済権限を丸投げできない</li><li>代理実行の理由・金額を検証できない</li></ul></div>
      <div class="box" style="width:128pt;"><h3>7. 解決策</h3><ul><li>予定を読み、準備・移動枠を追加</li><li>電話とAniccaナッジで身体を動かす</li><li>上限付き委任で予約・小額決済</li></ul></div>
      <div class="box" style="width:128pt;"><h3>5. 価値提案</h3><p><b>開かなくても、人生が前に進む。</b></p><p style="margin-top:5pt;">意志力を要求せず、安全な範囲だけAIが実行する。</p></div>
      <div class="box" style="width:128pt;"><h3>8. 模倣困難性</h3><ul><li>実電話・予定・行動結果の閉ループ</li><li>Aniccaの行動変容データ</li><li>Life Managerを創業者自身が毎日利用</li></ul></div>
      <div class="box" style="width:128pt;"><h3>3. 顧客層</h3><p>グローバルの多忙な創業者・知識労働者。</p><p style="margin-top:5pt;">次に、注意散漫・先延ばし・生活管理に困る人。</p></div>
    </div>
    <div class="canvas-row bottom">
      <div class="box" style="width:128pt;"><h3>2. 既存代替</h3><ul><li>Googleカレンダー</li><li>習慣・タスクアプリ</li><li>ChatGPT等の対話AI</li><li>人間の秘書</li></ul><p style="margin-top:4pt;">いずれも反応型、または高コスト。</p></div>
      <div class="box" style="width:128pt;"><h3>最初に作るもの</h3><p>「Life Mandate」MVP。</p><ul style="margin-top:4pt;"><li>7日・50ドルの権限</li><li>交通・健康だけ許可</li><li>x402支払い</li><li>レシートと即時取消</li></ul></div>
      <div class="box" style="width:128pt;"><h3>6. 高概念</h3><p><b>自分専用のAI執行役。</b></p><p style="margin-top:5pt;">カレンダー×行動変容×プログラマブルな財布。</p></div>
      <div class="box" style="width:128pt;"><h3>検証仮説・指標</h3><ul><li>先回り介入で遅刻率50%減</li><li>委任設定完了率60%</li><li>権限逸脱0件</li><li>週3回以上の実行</li><li>3か月継続率40%</li></ul></div>
      <div class="box" style="width:128pt;"><h3>4. 初期顧客</h3><p>AIツールを既に使い、遅刻・予定過多に強い痛みがあり、月20ドルを払える英語圏・日本の創業者。</p><h3 style="margin-top:7pt;">販売経路</h3><p>創業者コミュニティ、研究室、OSS、実演動画。</p></div>
    </div>
  </div>
  <div class="canvas-row momentum">
    <div class="box m" style="width:218pt;"><h3>1. レバレッジ</h3><p>電話・Telegram・カレンダーの既存本番基盤に、スマートアカウントとx402を追加。OSS版→クラウド版へ展開し、国ごとのカード契約なしでグローバルなサービス購入へ。</p></div>
    <div class="box m" style="width:218pt;"><h3>2. 注目獲得</h3><p>「7日・50ドルだけAIに任せる」公開デモを軸に、X・GitHub・大学/創業者コミュニティで検証過程を公開。フォロワー購入や無関係な宣伝は行わない。</p></div>
    <div class="box m" style="width:218pt;"><h3>3. トラクション</h3><p>Life Manager：本番クラウド、実電話、移動枠挿入、Telegramを稼働。内部テスト3プロフィール（全て創業者テスト）。外部有料ユーザー0。Anicca iOS：公開ダッシュボード上の月次経常収益27ドル。</p></div>
  </div>
  `, { css: canvasCss, folio: '' });

function writeHtml(name, content) {
  const file = path.join(work, name);
  fs.writeFileSync(file, content);
  return file;
}

async function buildDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Daisuke Narita';
  pptx.company = 'Anicca';
  pptx.subject = 'UTokyo Blockchain Entrepreneurship Support Program 2026';
  pptx.title = 'Anicca Life Manager';
  pptx.lang = 'ja-JP';
  for (let i = 0; i < slides.length; i++) {
    await html2pptx(writeHtml(`slide-${String(i + 1).padStart(2, '0')}.html`, slides[i]), pptx);
  }
  await pptx.writeFile({ fileName: path.join(out, 'Anicca-Life-Manager-事業アイデア説明.pptx') });
}

async function buildCanvas() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Daisuke Narita';
  pptx.company = 'Anicca';
  pptx.title = 'Anicca Life Manager Hackathon Canvas';
  pptx.lang = 'ja-JP';
  await html2pptx(writeHtml('hackathon-canvas.html', canvas), pptx);
  await pptx.writeFile({ fileName: path.join(out, 'Anicca-Life-Manager-Hackathon-Canvas.pptx') });
}

Promise.all([buildDeck(), buildCanvas()]).catch((err) => {
  console.error(err);
  process.exit(1);
});
