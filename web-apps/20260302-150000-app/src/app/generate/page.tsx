"use client";

import { useState } from "react";

const tones = [
  { id: "professional", label: "Professional", emoji: "👔" },
  { id: "casual", label: "Casual", emoji: "😊" },
  { id: "provocative", label: "Provocative", emoji: "🔥" },
  { id: "empathetic", label: "Empathetic", emoji: "💛" },
];

const templates = [
  { id: "sales", label: "Sales Outreach" },
  { id: "recruiting", label: "Recruitment" },
  { id: "partnership", label: "Partnership" },
  { id: "freelance", label: "Freelance Pitch" },
];

interface GeneratedEmail {
  subjectA: string;
  subjectB: string;
  body: string;
}

function generateEmail(
  prospect: string,
  product: string,
  tone: string,
  template: string
): GeneratedEmail {
  const toneMap: Record<string, { greeting: string; style: string; close: string }> = {
    professional: {
      greeting: "I hope this message finds you well.",
      style: "I wanted to reach out because",
      close: "I would welcome the opportunity to discuss this further at your convenience.",
    },
    casual: {
      greeting: "Hey there!",
      style: "I came across your profile and thought",
      close: "Would love to chat if you are open to it — no pressure at all.",
    },
    provocative: {
      greeting: "Quick question:",
      style: "Most people in your position are leaving money on the table because",
      close: "If that sounds like something worth exploring, let me know. If not, no hard feelings.",
    },
    empathetic: {
      greeting: "I know your inbox is probably overflowing, so I will keep this brief.",
      style: "I understand the challenges of your role, and I believe",
      close: "I would love to hear your thoughts whenever it is convenient for you.",
    },
  };

  const templateMap: Record<string, { hook: string; value: string }> = {
    sales: {
      hook: `your team at ${prospect} could benefit from`,
      value: `${product} has helped similar teams increase their conversion rates by up to 40%.`,
    },
    recruiting: {
      hook: `someone with your background at ${prospect} would be a perfect fit for`,
      value: `${product} is building something remarkable, and your experience aligns perfectly with what we need.`,
    },
    partnership: {
      hook: `there is a natural synergy between ${prospect} and`,
      value: `A partnership with ${product} could unlock new revenue streams for both of us.`,
    },
    freelance: {
      hook: `${prospect} could use help with`,
      value: `I specialize in ${product} and have delivered results for companies like yours.`,
    },
  };

  const t = toneMap[tone] || toneMap.professional;
  const tmpl = templateMap[template] || templateMap.sales;

  const body = `${t.greeting}

${t.style} ${tmpl.hook} what we are building.

${tmpl.value}

Here is what I had in mind: a quick 15-minute call where I can share how we have helped others in your space and see if it makes sense for ${prospect}.

${t.close}

Best regards`;

  const subjectA =
    template === "sales"
      ? `Quick idea for ${prospect}`
      : template === "recruiting"
      ? `Exciting opportunity — ${prospect}`
      : template === "partnership"
      ? `Partnership idea: ${prospect} + ${product}`
      : `Can I help ${prospect} with ${product}?`;

  const subjectB =
    template === "sales"
      ? `${prospect}, saw something you should know`
      : template === "recruiting"
      ? `Your experience at ${prospect} caught my eye`
      : template === "partnership"
      ? `${prospect} x ${product} — better together?`
      : `A quick pitch for ${prospect}`;

  return { subjectA, subjectB, body };
}

export default function GeneratePage() {
  const [prospect, setProspect] = useState("");
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("sales");
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    if (!prospect.trim() || !product.trim()) return;
    const email = generateEmail(prospect.trim(), product.trim(), tone, template);
    setResult(email);
    setCopied(false);
  }

  function handleCopy() {
    if (!result) return;
    const text = `Subject A: ${result.subjectA}\nSubject B: ${result.subjectB}\n\n${result.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Generate Cold Email</h1>
      <p className="mb-8 text-muted">
        Fill in the details and get a personalized cold email with A/B subject
        lines.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="prospect"
              className="mb-2 block text-sm font-medium"
            >
              Prospect (company or person)
            </label>
            <input
              id="prospect"
              type="text"
              value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              placeholder="e.g., Acme Corp, John at Stripe"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="product" className="mb-2 block text-sm font-medium">
              Your product or service
            </label>
            <input
              id="product"
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g., our design system tool, React consulting"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors cursor-pointer ${
                    tone === t.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors cursor-pointer ${
                    template === t.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prospect.trim() || !product.trim()}
            className="w-full rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Generate Email
          </button>
        </div>

        <div>
          {result ? (
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Generated Email</h2>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg border border-border px-3 py-1 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy All"}
                </button>
              </div>

              <div className="mb-4 space-y-2">
                <div className="rounded-lg bg-background p-3">
                  <span className="text-xs font-medium text-accent">
                    Subject A:
                  </span>
                  <p className="mt-1 text-sm">{result.subjectA}</p>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <span className="text-xs font-medium text-accent">
                    Subject B:
                  </span>
                  <p className="mt-1 text-sm">{result.subjectB}</p>
                </div>
              </div>

              <div className="rounded-lg bg-background p-4">
                <span className="text-xs font-medium text-accent">Body:</span>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {result.body}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
              <div>
                <p className="mb-2 text-2xl">✉️</p>
                <p className="text-sm text-muted">
                  Fill in the details and click Generate to see your
                  personalized email here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
