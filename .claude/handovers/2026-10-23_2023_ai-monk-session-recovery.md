# AI Monk セッション復旧checkpoint

## 終了境界

ユーザーのセッション復旧指示により元作業を停止する。goalは`paused`、成果全体は未完。新しい投稿・送信・生成・機能実装を開始しない。メール送信・新goal・自動再開を行わない。
対象thread: `01a163e6-e9b5-71c3-a60d-49d675e9c322`。
実行中の子agentは0。既存投稿fenceと共有daemon・他会話・lockfileは変更しない。

## 正本とGit

- Products repository: `/Users/anicca/Projects/anicca-products`、remote `Daisuke134/anicca-products`。
- Products worktree: `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-remote-mcp-20261023`。
- checkpoint branch/push先: `docs/ai-monk-session-recovery-20261023` → `origin/docs/ai-monk-session-recovery-20261023`。
- checkpoint作成元main commit: `1f912140aace5f437e1eb8add27baa40d46ca101`。作成前はclean。checkpoint commitは同branchのremote objectで確認する。
- 残TODO正本: `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-remote-mcp-20261023/docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md` の現在cursor・Atomic TODO・AM-12〜16。
- 表示scope正本: `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-remote-mcp-20261023/docs/superpowers/plans/2026-10-23-ai-monk-avatar-scope.md`。
- Factory repository: `/Users/anicca/Projects/life-manager-main`、remote `Daisuke134/life-manager`。primary checkoutは他ownerのため変更しない。
- Factory worktree: `/Users/anicca/Projects/life-manager-main/.worktrees/ai-monk-receipt-proof-20261023`。
- Factory branch: `docs/ai-monk-existing-asset-manual-cursor-20261023`、HEAD `f1ebb45bffa4a4889c472cfc9380077baae48e07`、同名origin branch追跡、clean。PR8683はmain `178b6c46b30fc2e0540f12ccc741b3a8eef605cf`へ統合済み。
- Factory残TODO正本: `/Users/anicca/Projects/life-manager-main/.worktrees/ai-monk-receipt-proof-20261023/docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md` のS11。worktree HEADは最新mainではない。復旧時のfetch後origin/mainは`da3f55f4a5cee7e8c776566eabe51791385b69da`。新sessionは最新mainのS11を先に読む。

## 保持する完了証拠

- Database source PR591/head47051952、本番main `c66e4fa4fab2052328e26a454c2bb598d64ca7b4`、Netlify39944184677 SUCCESS。公開4件/顔画像4件、75-record archive/57出典/pending69/除外2。AI status UIなし、followers/views/期間付き収益claimのsortあり。
- canonical SHA256 `8711cf04c6c310a3ea07bf4a72e4387be18207e45b20a001457ed0f59edd0ff4`。helper9件とCLI/stdio/HTTP/独立install13件PASS、fresh review指摘0件。
- `docs/evidence/ai-monk-creator-business-{source,production}-20261023.json`、`docs/evidence/ai-monk-cli-mcp-v041-release-20261023.json`。CLI v0.4.1の公開URL実install/公式tag/digestが同mainと一致する。PR592はmain `1f912140aace5f437e1eb8add27baa40d46ca101`へ統合済み。
- 英語書籍/Database英語/Database日本語のnative返信は2113582983580139758/2113583291374952934/2113583436426625030。JA書籍返信は2113556550073921584。各送信済みreceiptとexact parent/URL/UTMを保持し、再送しない。対応証拠は`docs/evidence/ai-monk-existing-x-link-recovery-*-20261023.json`とJA書籍link recovery receipt。
- Factory AM-15a/b/cはsource・固定版受入のみ完了。publisher接続PR8668/main7c63b4e3、固定release `/Users/anicca/loops/releases/20261023T185527-7c63b4e3`。実生成・日次配信・収益の完了とはしない。

## 同じ投稿IDの公式readback

`docs/evidence/ai-monk-session-recovery-post-readback-20261023.json`に復旧時の公式GETを保存する。
Postiz `cmvkswmg6314hlh0yw1p4b6fh`はHTTP200/PUBLISHED、integration `cmo5rwq2p00twn10yrsdglng3` / monk_anicca。
provider release IDは`v_pub_file~v2-1.7699801439001937940`。返却URLは`https://www.tiktok.com/@monk_anicca`というprofile URLであり、個別動画permalinkではない。
送信状態のみ確認済み。producer/元動画SHA/個別動画URLの照合は未完。自社canonical素材への再帰属・再送・fence解除をしない。復旧中のprovider書込は0。

## 未完と現在cursor

現在cursorは停止位置の保存。再開指示があるまではgoalを再開しない。
Database69pendingの制作/video根拠・各creatorの収益根拠・言語coverage、ChatGPT app掲載が残る。
新刊は日英公開済みだが10:54:49Zの公式全page読戻しでは各SKUのpaid Checkoutは0。paid納品・売上・利益の達成を宣言しない。
FactoryはS11の既存ownerによる新TikTok producer照合/指定IG修復/自然配信と、事前USD cap・利用者資格情報分離・Factory用課金権限/納品・他者導入/MCP/subscriptionが残る。
旧EN完成素材のcash costは未照合。nullを0へ変えず、新規生成guardを維持する。既存素材再利用がcostだけで一律禁止とはしないが、manual追加実行は行わない。前回admissionのdisk/FIFO延期は履歴であり、再開時はloaded release/既存receipt/fence/公式重複/admission/ownerをfresh read-onlyで確認する。

## iPhone競合と所有権

この会話だけのunsubscribe toolは公開されたCodex app toolsにない。公式CLI0.160.0のschemaには`thread/unsubscribe`がある。
正規daemon versionはrunning/CLIとdaemon0.160.0一致を返す。共有daemonは変更しない。
公式`app-server proxy`によるinitializeは通常経路と、公式versionが返すcontrol socket指定の両方で応答timeout。後者は受信0frames/0bytes。unsubscribe要求は送っておらず、書込み所有権の解放は未確認。
公式read_threadではこの復旧turnはinProgress/対象thread active。goal pausedと購読解除・所有権解放は別の結果として保持する。別client/他会話を停止したり、lockfileを削除したり、Computer Use制約を迂回しない。

最初の安全な再開操作: このcheckpointと正本を読み、gitのHEAD/upstream/dirtyと同IDの既存receiptを確認する。iPhone側で再開できた事実を確認する前に「競合解消済み」と扱わず、元goalは明示再開指示までpausedのままにする。
