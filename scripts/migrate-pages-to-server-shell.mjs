// One-shot: client page.tsx -> PageClient.tsx + server page.tsx (dynamic).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "../src/app");

function walk(dir, list = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (f === "page.tsx") list.push(full);
  }
  return list;
}

const allPages = walk(appRoot);
const clientPages = allPages.filter((f) => {
  const c = fs.readFileSync(f, "utf8");
  return c.startsWith('"use client"') || c.startsWith("'use client'");
});

const PAGE_SHELL = `import dynamic from "next/dynamic";

const PageClient = dynamic(() => import("./PageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  ),
});

export default function Page() {
  return <PageClient />;
}
`;

for (const pagePath of clientPages) {
  const dir = path.dirname(pagePath);
  const clientPath = path.join(dir, "PageClient.tsx");
  const content = fs.readFileSync(pagePath, "utf8");
  if (fs.existsSync(clientPath)) {
    console.warn("Skip (PageClient exists):", clientPath);
    continue;
  }
  fs.writeFileSync(clientPath, content);
  fs.writeFileSync(pagePath, PAGE_SHELL);
}

console.log("Migrated:", clientPages.length, "routes");
