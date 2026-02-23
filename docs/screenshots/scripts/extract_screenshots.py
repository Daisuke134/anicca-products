# docs/screenshots/scripts/extract_screenshots.py
# l.md Bible Step 3: xcresulttool で .xcresult から画像抽出
# Usage: python3 scripts/extract_screenshots.py <xcresult_path> <output_dir>

import subprocess
import json
import sys
import os


XCRESULT_PATH = None  # mainで設定


def fetch_object(ref_id):
    """xcresultからrefIDでオブジェクトをフェッチ（Xcode 16: get object --legacy）"""
    result = subprocess.run(
        ['xcrun', 'xcresulttool', 'get', 'object', '--legacy',
         '--path', XCRESULT_PATH, '--id', ref_id, '--format', 'json'],
        capture_output=True,
        text=True
    )
    if result.stdout:
        return json.loads(result.stdout)
    return {}


def get_root_object():
    """xcresultのルートオブジェクトを取得（Xcode 16: get object --legacy）"""
    result = subprocess.run(
        ['xcrun', 'xcresulttool', 'get', 'object', '--legacy',
         '--path', XCRESULT_PATH, '--format', 'json'],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)


def find_attachments_deep(obj, seen_refs=None):
    """再帰的にActionTestAttachmentを探す。summaryRefを辿る（Xcode 16対応）"""
    if seen_refs is None:
        seen_refs = set()
    results = []
    if isinstance(obj, dict):
        t = obj.get('_type', {}).get('_name', '')
        if t == 'ActionTestAttachment':
            name = obj.get('name', {}).get('_value', 'NONAME')
            ref_id = obj.get('payloadRef', {}).get('id', {}).get('_value', None)
            results.append((name, ref_id))
        # summaryRef を辿る（Xcode 16でアタッチメントがネストされている）
        if 'summaryRef' in obj:
            ref = obj['summaryRef'].get('id', {}).get('_value')
            if ref and ref not in seen_refs:
                seen_refs.add(ref)
                sub = fetch_object(ref)
                results.extend(find_attachments_deep(sub, seen_refs))
        for v in obj.values():
            results.extend(find_attachments_deep(v, seen_refs))
    elif isinstance(obj, list):
        for item in obj:
            results.extend(find_attachments_deep(item, seen_refs))
    return results


def export_screenshot(attachment_id, output_path):
    """指定されたIDのスクリーンショットをエクスポート"""
    subprocess.run([
        'xcrun', 'xcresulttool', 'export',
        '--path', XCRESULT_PATH,
        '--id', attachment_id,
        '--output-path', output_path,
        '--type', 'file'
    ], check=True)


def main():
    global XCRESULT_PATH

    if len(sys.argv) < 3:
        print("Usage: python extract_screenshots.py <xcresult_path> <output_dir>")
        sys.exit(1)

    XCRESULT_PATH = sys.argv[1]
    output_dir = sys.argv[2]

    os.makedirs(output_dir, exist_ok=True)

    print(f"📦 Analyzing {XCRESULT_PATH}...")
    data = get_root_object()

    # summaryRefを辿って全アタッチメントを収集（Xcode 16対応）
    print("🔍 Collecting all attachments (following summaryRefs)...")
    all_attachments = find_attachments_deep(data)
    print(f"   Found {len(all_attachments)} attachment(s) total")

    # YAML駆動: screenshots.yaml の screens[].id から動的に取得
    import yaml
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'screenshots.yaml')
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    expected_names = [s['id'] for s in config['screens']]

    for name in expected_names:
        print(f"🔍 Searching for '{name}'...")
        matches = [(n, rid) for n, rid in all_attachments if name in n and rid]

        if matches:
            found_name, attachment_id = matches[0]
            output_path = os.path.join(output_dir, f"{name}.png")
            export_screenshot(attachment_id, output_path)
            print(f"✅ Exported: {output_path}")
        else:
            print(f"⚠️  Not found: {name}")


if __name__ == "__main__":
    main()
