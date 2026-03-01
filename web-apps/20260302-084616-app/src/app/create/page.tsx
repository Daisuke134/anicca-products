import { SignatureEditor } from "@/components/signature-editor";

export default function CreatePage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create Your Email Signature
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Fill in your details, pick a template, and copy your signature.
        </p>
        <div className="mt-10">
          <SignatureEditor />
        </div>
      </div>
    </section>
  );
}
