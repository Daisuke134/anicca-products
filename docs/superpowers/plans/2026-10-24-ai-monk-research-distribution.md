# AI Monk Database・Plugin・Factory実行計画

## 目的・範囲・完了条件
既存のDatabase/6tool CLI・pluginを土台に、商品/収益の根拠拡充と配布を先に完了し、原価が成立するcloud Factoryへ進む。要件の正本はfield-guide末尾「Database・Plugin・Factoryの追加契約」。通常判断はprimaryが実行し、承認待ちや固定stageを追加しない。brainstormingの承認質問はDaisの明示No-human-loopと詳細指定へ置き換える。Stripe実装時は既存Checkout/Billingを再利用し、既存runtimeの日次effect/ownerは触らない。

## 順序と現在cursor
旧順/新順/理由はfield-guideを参照する。先行配布はPR612/main74074d0、CLI v0.4.3/main6500499で受入済み。現在cursorはDatabase候補の商品/収益根拠の精査。原価とReelFarmのread-only調査だけを並行し、Factory実装を先行しない。

## TODO
- [ ] DB-1: 既知73profileの商品/売上/creator/言語/画像の調査coverageを記録し、取得可能な公開一次資料から精査・拡充する。pending非掲載という旧reasonを修正し、unknownを保持する。
- [ ] DB-2: 既存関連検証でsource参照/scope/価格と売上区別を確認し、main/公開JSON/Web/MCPと必要なCLI版へ反映する。
- [ ] PL-1: 既存無料Codex pluginと正式ChatGPT/Grok/Muse配布口を確認する。OpenAI MFA/Muse URLの未完を具体化し、実提出/掲載と導入を区別する。
- [ ] DIST-1: Database/Pluginの新launch copyを根拠付きで作り、自分のX投稿とGrok協力依頼を1回ずつ送る。公式receipt/permalinkと重複0を記録する。
- [ ] COST-1: ReelFarm公開価格/無料枠/導線、HeyGen実API単価、45/60秒・1日1本/2本・3日trial・再生成・Stripe手数料から原価と利益を計算する。取得不足はunknownとし課金top-upしない。
- [ ] SaaS-1: 原価からprice/生成上限を決め、最小auth・Stripe3日trial・Generate avatar/video・IG接続・自動投稿・metricsを既存Web/APIから実装して公開する。TikTokは後続。実API生成/Stripe subscription/利用者所有接続/公式投稿とmetricsを成果条件として追跡する。
- [ ] DIST-2: 実利用できるFactoryをXで告知し、Grokにも配布協力を依頼する。未実装や未達収益を宣伝しない。

## 境界
新規契約/top-upは行わず、既存creditとspend-capを守る。free試用は3日というユーザー指定を優先し、無制限生成を約束しない。個人wallet/口座資金移動、既存loop restart、未完effect再送、shared credential複製は行わない。Factoryの実設計・価格はCOST-1の結果から具体化し、ここで架空の利益/注文を置かない。
