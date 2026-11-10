import fs from "fs";
import path from "path";
export const metadata = { title: "Anicca — YC W27 draft", robots: { index: false, follow: false } };
export default function Page() {
  const md = fs.readFileSync(path.join(process.cwd(), "app/yc-draft/draft.md"), "utf8");
  return <main style={{maxWidth:760,margin:"40px auto",padding:16}}><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{md}</pre></main>;
}
