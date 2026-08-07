from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Any


def _read(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON object required: {path}")
    return value


def _persist_recipe(receipt: dict[str, Any]) -> None:
    root = Path(
        os.environ.get(
            "BH_AGENT_WORKSPACE",
            str(Path.home() / ".config/browser-harness/agent-workspace"),
        )
    ).expanduser()
    skill_root = root / "domain-skills" / "jobs.ashbyhq.com"
    skill_root.mkdir(parents=True, exist_ok=True, mode=0o700)
    recipe = skill_root / "application-repair.json"
    value = {
        "version": 1,
        "strategy": "data-field-path semantic controls plus native input events",
        "resume_upload": "browser-harness upload_file",
        "submit_authority": "prohibited; return to Ledger-fenced Ashby CLI",
        "last_status": receipt["status"],
        "last_filled_count": receipt["filled_count"],
        "unresolved_control_count": len(receipt["unresolved"]),
    }
    recipe.write_text(json.dumps(value, sort_keys=True) + "\n", encoding="utf-8")
    os.chmod(recipe, 0o600)


def repair(*, url: str, answers_path: Path, resume_path: Path, output: Path) -> dict[str, Any]:
    payload = _read(answers_path)
    answers = payload.get("answers")
    if not isinstance(answers, dict):
        raise ValueError("Ashby answers are unavailable")
    plain_answers = {
        str(question): str(value.get("answer") if isinstance(value, dict) else value)
        for question, value in answers.items()
    }
    application_url = url if url.rstrip("/").endswith("/application") else f"{url.rstrip('/')}/application"
    script = f'''
import json
target = new_tab({application_url!r})
wait_for_load()
result = js("""() => {{
  const clean = value => (value || '').replace(/\\s+/g, ' ').trim();
  const answers = JSON.parse({json.dumps(json.dumps(plain_answers, ensure_ascii=False))});
  let filled = 0;
  let unresolved = [];
  for (const group of document.querySelectorAll('[data-field-path]')) {{
    const controls = [...group.querySelectorAll('input, textarea, select, button, [role=radio], [role=combobox]')];
    const options = controls.filter(x => x.matches('button, [role=radio], input[type=radio]'));
    const optionText = options.map(x => clean(x.innerText || x.textContent));
    const question = (clean(group.innerText).split('\\n').find(x => x && !optionText.includes(x)) || '').replace(/\\s*\\*\\s*$/, '');
    const entry = Object.entries(answers).find(([key]) => clean(key).toLowerCase() === question.toLowerCase());
    if (!entry) continue;
    const answer = clean(entry[1]);
    const text = controls.find(x => x.matches('input:not([type=file]):not([type=checkbox]):not([type=radio]), textarea'));
    const select = controls.find(x => x.matches('select'));
    const checkbox = controls.find(x => x.matches('input[type=checkbox]'));
    if (text) {{
      const proto = text.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(text, answer);
      text.dispatchEvent(new Event('input', {{bubbles:true}}));
      text.dispatchEvent(new Event('change', {{bubbles:true}}));
      filled++;
    }} else if (select) {{
      const option = [...select.options].find(x => clean(x.textContent).toLowerCase() === answer.toLowerCase());
      if (option) {{ select.value = option.value; select.dispatchEvent(new Event('change', {{bubbles:true}})); filled++; }}
      else unresolved.push(question);
    }} else if (options.length) {{
      const option = options.find(x => clean(x.innerText || x.textContent).toLowerCase() === answer.toLowerCase());
      if (option) {{ option.click(); filled++; }} else unresolved.push(question);
    }} else if (checkbox) {{ checkbox.click(); filled++; }}
    else unresolved.push(question);
  }}
  return {{filled, unresolved, url: location.href}};
}})()""")
upload_file('input[type=file]', {str(resume_path)!r})
print(json.dumps(result))
'''
    completed = subprocess.run(
        ["browser-harness"], input=script, text=True, capture_output=True, check=False,
        env={**os.environ, "BH_DOMAIN_SKILLS": "1"},
    )
    if completed.returncode != 0:
        raise RuntimeError(f"Browser Harness repair failed: {completed.stderr[-500:]}")
    lines = [line for line in completed.stdout.splitlines() if line.strip().startswith("{")]
    observation = json.loads(lines[-1]) if lines else {}
    receipt = {
        "version": 1,
        "status": "repaired" if not observation.get("unresolved") else "partial",
        "filled_count": int(observation.get("filled") or 0),
        "unresolved": observation.get("unresolved") or [],
        "application_url": application_url,
        "submit_clicked": False,
        "executor": "browser-harness",
    }
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    output.write_text(json.dumps(receipt, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    os.chmod(output, 0o600)
    _persist_recipe(receipt)
    return receipt


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--answers", type=Path, required=True)
    parser.add_argument("--resume", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    result = repair(url=args.url, answers_path=args.answers, resume_path=args.resume, output=args.output)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["status"] == "repaired" else 2


if __name__ == "__main__":
    raise SystemExit(main())
