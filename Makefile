# Makefile — l.md Bible 100%
# Usage: make generate-store-screenshots

generate-store-screenshots:
	# 1. クリーンアップ
	rm -rf docs/screenshots/raw/* docs/screenshots/processed/* docs/screenshots/output.xcresult

	# 2. XCUITestでスクリーンショット撮影
	xcodebuild test \
	  -project aniccaios/aniccaios.xcodeproj \
	  -scheme "aniccaios" \
	  -destination 'platform=iOS Simulator,name=iPhone 17' \
	  -only-testing:aniccaiosUITests/ScreenshotTests \
	  -resultBundlePath docs/screenshots/output.xcresult \
	  -testLanguage en

	# 3. xcresultから画像を抽出
	python3 docs/screenshots/scripts/extract_screenshots.py \
	  docs/screenshots/output.xcresult \
	  docs/screenshots/raw

	# 4. Pillowで画像を加工（l.md Bible）
	cd docs/screenshots && python3 scripts/process_screenshots.py

# デザイン変更だけ再実行（raw/ 撮影済みの場合 — 数秒で完了）
process-only:
	cd docs/screenshots && python3 scripts/process_screenshots.py
