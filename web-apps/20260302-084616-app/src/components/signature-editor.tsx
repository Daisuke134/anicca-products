"use client";

import { useState, useCallback } from "react";
import {
  type SignatureData,
  type TemplateName,
  defaultData,
  generateSignatureHtml,
} from "@/lib/templates";

const templates: { id: TemplateName; label: string }[] = [
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
];

const colors = [
  "#4f46e5",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#111827",
];

export function SignatureEditor() {
  const [data, setData] = useState<SignatureData>(defaultData);
  const [template, setTemplate] = useState<TemplateName>("modern");
  const [copied, setCopied] = useState(false);

  const html = generateSignatureHtml(data, template);

  const updateField = useCallback(
    (field: keyof SignatureData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  async function handleCopy() {
    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": new Blob([html], { type: "text/plain" }) }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const fields: { key: keyof SignatureData; label: string; placeholder: string }[] = [
    { key: "name", label: "Full Name", placeholder: "Jane Smith" },
    { key: "title", label: "Job Title", placeholder: "Product Designer" },
    { key: "company", label: "Company", placeholder: "Acme Inc." },
    { key: "email", label: "Email", placeholder: "jane@acme.com" },
    { key: "phone", label: "Phone", placeholder: "+1 (555) 123-4567" },
    { key: "website", label: "Website", placeholder: "acme.com" },
    { key: "linkedin", label: "LinkedIn Username", placeholder: "janesmith" },
    { key: "twitter", label: "X (Twitter) Username", placeholder: "janesmith" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your Details
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {f.label}
                </label>
                <input
                  type="text"
                  value={data[f.key]}
                  onChange={updateField(f.key)}
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Template
          </h2>
          <div className="mt-3 flex gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  template === t.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Brand Color
          </h2>
          <div className="mt-3 flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setData((prev) => ({ ...prev, color: c }))}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  data.color === c ? "border-zinc-900 dark:border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Preview
          </h2>
          <button
            onClick={handleCopy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            {copied ? "Copied!" : "Copy Signature"}
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Paste directly into Gmail, Outlook, or Apple Mail signature settings.
        </p>
      </div>
    </div>
  );
}
