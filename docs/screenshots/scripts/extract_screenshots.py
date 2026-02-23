# docs/screenshots/scripts/extract_screenshots.py
# l.md Bible Step 3: xcresulttool で .xcresult から画像抽出
# Usage: python3 scripts/extract_screenshots.py <xcresult_path> <output_dir>

import subprocess
import json
import sys
import os


def get_attachment_list(xcresult_path):
    """xcresultからアタッチメントのリストを取得"""
    result = subprocess.run(
        ['xcrun', 'xcresulttool', 'get', '--path', xcresult_path, '--format', 'json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)


def find_screenshots(data, name_filter):
    """再帰的にスクリーンショットのIDを探す"""
    screenshots = []

    def recurse(obj):
        if isinstance(obj, dict):
            if obj.get('_type', {}).get('_name') == 'ActionTestAttachment':
                name = obj.get('name', {}).get('_value', '')
                if name_filter in name:
                    attachment_id = obj.get('payloadRef', {}).get('id', {}).get('_value')
                    if attachment_id:
                        screenshots.append((name, attachment_id))
            for value in obj.values():
                recurse(value)
        elif isinstance(obj, list):
            for item in obj:
                recurse(item)

    recurse(data)
    return screenshots


def export_screenshot(xcresult_path, attachment_id, output_path):
    """指定されたIDのスクリーンショットをエクスポート"""
    subprocess.run([
        'xcrun', 'xcresulttool', 'export',
        '--path', xcresult_path,
        '--id', attachment_id,
        '--output-path', output_path,
        '--type', 'file'
    ], check=True)


def main():
    if len(sys.argv) < 3:
        print("Usage: python extract_screenshots.py <xcresult_path> <output_dir>")
        sys.exit(1)

    xcresult_path = sys.argv[1]
    output_dir = sys.argv[2]

    os.makedirs(output_dir, exist_ok=True)

    print(f"📦 Analyzing {xcresult_path}...")
    data = get_attachment_list(xcresult_path)

    # YAML駆動: screenshots.yaml の screens[].id から動的に取得
    import yaml
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'screenshots.yaml')
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    expected_names = [s['id'] for s in config['screens']]

    for name in expected_names:
        print(f"🔍 Searching for '{name}'...")
        screenshots = find_screenshots(data, name)

        if screenshots:
            found_name, attachment_id = screenshots[0]
            output_path = os.path.join(output_dir, f"{name}.png")
            export_screenshot(xcresult_path, attachment_id, output_path)
            print(f"✅ Exported: {output_path}")
        else:
            print(f"⚠️  Not found: {name}")


if __name__ == "__main__":
    main()
