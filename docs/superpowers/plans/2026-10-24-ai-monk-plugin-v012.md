# AI Monk Plugin v0.1.2 配布・提出準備

## 目的・範囲・完了条件

公開済みread-only MCPの6toolsへportable pluginの紹介文・審査ケースを揃える。既存の無料契約、公開endpoint、icon、MCP設定、repo catalogのpathを保持する。対象は `packages/ai-monk-plugin/{plugin.json,README.md}` と本計画・配布正本のPL-1・sanitized source証拠だけとする。catalogにはversion欄がないため、版を重複して追加しない。Factory、生成、投稿、購入導線、新tool、新依存、credential、browser、本番設定は変更しない。

完了はv0.1.2の表示情報と5positive/3negativeの整合、公式portable schema、隔離したCodexのpackage/config load、公開remoteの必要最小read-only確認、commit/push/remote object一致で判定する。主担当がmain統合後、そのimmutable SHAから新tag/ZIPを作って公開受入する。既存v0.1.1 Release・証拠は履歴として保持し、上書きしない。source受入を新ZIP公開・ChatGPT掲載・新審査ケースのnative自然言語routingへ換算しない。

## パッケージ契約

- profile検索/取得/coverageに加え、`top_formats`のformat・hook・台本構造、`how_they_monetize`の商品・表示価格・帰属付き売上申告、`winning_playbooks`の台本formula・voice・cadence・funnelを案内する。
- `extensions.com.openai.interface`のshortDescriptionは30文字以内、longDescriptionは4,000文字以内とし、4つのHTTPS service URLと既存iconを保持する。審査ケースはpositive5件で6toolsを覆い、negative3件を保持する。
- 研究候補、AI status、unknown、source/dateを保持する。sampleのviewsをchannel総数、価格/seller counterを注文、creator申告を監査済み売上・利益・MRRへ変換しない。playbookは制作の型として説明し、原文台本を転載せず、成果や収益を保証しない。
- 無料read-only研究機能のみをpackageに含める。Factoryへの既存cross-linkは同梱READMEから外し、生成・投稿・digital purchaseの誘導を足さない。実demo動画がないため`demo_recording_url`は追加しない。

## 正式提出の現在位置

公式提出仕様 → https://developers.openai.com/plugins/deploy/submission 。primaryが新しい専用OpenAI orgの通常ログイン後、`/plugins`のupload入口で `Developer identity required before upload`、IndividualのStartで `Payment method required` を観測する。valid default payment methodが不足し、正式upload/submit・個人document提出・決済は0。既存OpenAI accountのpasskey MFA境界とは別に記録する。個人ID文書/selfieが必須という画面には未到達であり、条件を推定しない。API keyの実GET成功からdeveloper identity完了を推定しない。本人確認・支払元・実walkthrough・正式提出/掲載はprimaryの継続作業とする。取得済みdocとredactedな実UI receiptの参照 → `../../evidence/ai-monk-plugin-v012-source-20261024.json`。

Museは既存提出の3/3 requirements受付済み、BusinessだけApproved、Data processingとIntegration credentialsはIn reviewで、コネクタ全体の承認/掲載URLは未確認。既存receipt → `../../evidence/ai-monk-distribution-status-20261024.json`。Grokはremote MCP互換の公開仕様と正式directory掲載を分け、未特定の配布口へ推測で送信しない。

## TODO・現在cursor

- [x] v0.1.2のmanifest/READMEを6toolsへ整合する。
- [x] portable schema、隔離したCodex package/config load、公開remote6toolのsource受入を記録する。証拠 → `../../evidence/ai-monk-plugin-v012-source-20261024.json`。branchのcommit/pushとremote object一致は主担当へ報告する。
- [x] PR630/main2cfc70e2c706ef7d697dbe30b47e319d4c28b3c1の固定4filesからZIPを作り、ai-monk-plugin-v0.1.2を公開する。asset670323615/733154bytesのofficial digestと公開download SHA256 78594ea8af058d06cc64cf65d1442e3bca9f3ba799d1761f8779f2dd6a45d1baが一致する。source review SHIP、旧Release変更0。証拠 → ../../evidence/ai-monk-plugin-v012-release-20261024.json。
- [x] positive3/4/5のnative自然言語routingを隔離Codexで実受入する。top_formats、search_ai_monks→how_they_monetize、winning_playbooksの計4呼び出し、全caseの日本語final/exit0、公開v0.4.6 snapshot一致を確認する。証拠 → ../../evidence/ai-monk-plugin-native-v012-20261024.json。
- [ ] primaryがdeveloper identity/支払元・実demoを満たして正式upload/submit/審査結果/掲載を個別に記録する。

後続の残case・実ログデモ・現在cursorの正本 → [正式提出前の試験と実ログデモspec](../specs/2026-10-24-ai-monk-plugin-review-readiness.md)。以下の拡張3case受入は既存v0.1.2証拠の履歴として保持する。

## native routing受入の範囲

固定main2cfc70e由来v0.1.2をprivate CODEX_HOMEでloadし、既存ユーザー選択を継承する有限ephemeral/read-only runを3件実行する。新しいmodel/provider指定0、tool名の強制0、認証materialコピー0、共有config変更0。標準authへの参照symlinkは使用後に除去し、既存runtimeのauthを新credential作成やloginへ読み替えない。

公開v0.4.6のsnapshot b38ed6fabb78a357718cbddae7840c1922859b04e4858a578c2de2e76e768f02を4呼び出しすべてで確認する。最終回答の日本語・source/日付/未確認と未監査claimの区別を保持する。未検証のcaseと正式提出/demoを完了へ拡張しない。private入力・出力とhash一覧はreceiptで参照する。

CLIには未使用Firecrawl transportの認証要求が各runの起動時に出る。privateのplugin宣言とmcp listはAI Monkだけで、不要transportの発生元は未確定とする。実research tool呼び出し/認証修復は0、tokenや共有設定の変更・推測した無効化設定は行わない。この境界を成功や無通信へ置換しない。

## main統合後の再現可能なZIP作成

主担当はfetch後の統合済み40桁main SHAを`MONK_PLUGIN_RELEASE_SHA`、repo外の出力先を`MONK_PLUGIN_ZIP`へ設定して実行する。作業中のWTのbytesを直接採用せず、Git objectの4filesだけを固定順序・timestamp・modeで格納する。tag/Release作成と公開GETの受入はこの作成手順とは別に行う。

```sh
rtk proxy env MONK_PLUGIN_RELEASE_SHA=<merged-main-SHA> MONK_PLUGIN_ZIP=<absolute-output-path>/ai-monk-index-plugin-0.1.2.zip python3 - <<'PY'
import hashlib, json, os, re, subprocess, zipfile
from pathlib import Path

sha = os.environ['MONK_PLUGIN_RELEASE_SHA']
assert re.fullmatch(r'[0-9a-f]{40}', sha)
subprocess.run(['git', 'merge-base', '--is-ancestor', sha, 'origin/main'], check=True)
names = ['README.md', 'assets/icon.png', 'mcp.json', 'plugin.json']
payload = {name: subprocess.check_output(['git', 'show', f'{sha}:packages/ai-monk-plugin/{name}']) for name in names}
assert json.loads(payload['plugin.json'])['version'] == '0.1.2'
output = Path(os.environ['MONK_PLUGIN_ZIP'])
with output.open('xb') as target:
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in payload.items():
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(entry, data, compresslevel=9)
with zipfile.ZipFile(output) as archive:
    assert archive.namelist() == names
    assert all(archive.read(name) == data for name, data in payload.items())
print(json.dumps({'source_main_sha': sha, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
                  'bytes': output.stat().st_size, 'files': {name: hashlib.sha256(data).hexdigest() for name, data in payload.items()}}, indent=2))
PY
```

このunitはZIPを生成・公開しない。main統合後にこの標準ライブラリ手順を初めて実行して受入し、実行前からZIPのdigestや公開成功を記録しない。
