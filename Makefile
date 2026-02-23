# Makefile
# pipeline: xcrun simctl screenshot → l.md process_screenshots.py
# Usage: make generate-store-screenshots

BUNDLE_ID := ai.anicca.app.ios

generate-store-screenshots:
	# 1. クリーンアップ
	rm -rf docs/screenshots/raw/* docs/screenshots/processed/*
	mkdir -p docs/screenshots/raw docs/screenshots/processed

	# 2. Build & Install on simulator
	xcodebuild \
	  -project aniccaios/aniccaios.xcodeproj \
	  -scheme aniccaios \
	  -configuration "staging Debug" \
	  -destination "platform=iOS Simulator,name=iPhone 17" \
	  -derivedDataPath .build/DerivedData \
	  build

	xcrun simctl install booted \
	  .build/DerivedData/Build/Products/staging\ Debug-iphonesimulator/aniccaios.app

	# 3. Launch app
	xcrun simctl launch booted $(BUNDLE_ID)
	sleep 4

	# 4. screen1: 現在の画面をそのまま撮影
	xcrun simctl io booted screenshot docs/screenshots/raw/screen1.png
	sleep 1

	# 5. screen2: 次の画面へ進んで撮影（axe tap で操作）
	# axe tap --id "nextButton" --udid booted
	xcrun simctl io booted screenshot docs/screenshots/raw/screen2.png
	sleep 1

	# 6. screen3: さらに進んで撮影
	xcrun simctl io booted screenshot docs/screenshots/raw/screen3.png

	# 7. PIL合成 (l.md Bible)
	cd docs/screenshots && python3 scripts/process_screenshots.py

# デザイン変更のみ再実行（raw/ 撮影済み → 数秒で完了）
process-only:
	cd docs/screenshots && python3 scripts/process_screenshots.py
