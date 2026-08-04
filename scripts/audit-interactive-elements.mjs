import ts from "typescript";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const sourcePath = "src/main.jsx";
const sourceText = await readFile(sourcePath, "utf8");
const sourceFile = ts.createSourceFile(
  sourcePath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JSX,
);
const tags = new Set(["button", "a", "input", "select", "textarea"]);
const rows = [];

const tagName = (node) => node.tagName?.getText(sourceFile) || "";
const attributes = (node) => {
  const result = new Map();
  for (const property of node.attributes?.properties || []) {
    if (!ts.isJsxAttribute(property)) continue;
    result.set(property.name.getText(sourceFile), property.initializer?.getText(sourceFile) || "true");
  }
  return result;
};
const visibleText = (node) => {
  if (!ts.isJsxElement(node)) return "";
  return node.children
    .filter(ts.isJsxText)
    .map((child) => child.text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
};
const clean = (value = "") => value.replace(/^['"{]|['"}]$/g, "").trim();

const visit = (node) => {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const tag = tagName(opening);
    const attrs = attributes(opening);
    const role = clean(attrs.get("role"));
    if (tags.has(tag) || role === "button") {
      const position = sourceFile.getLineAndCharacterOfPosition(opening.getStart(sourceFile));
      const label =
        clean(attrs.get("aria-label")) ||
        clean(attrs.get("title")) ||
        visibleText(node) ||
        clean(attrs.get("placeholder")) ||
        "<dinamico>";
      const hasHandler = [...attrs.keys()].some((name) =>
        /^(onClick|onChange|onInput|onSubmit|onPointerDown|onKeyDown)$/.test(name),
      );
      const href = clean(attrs.get("href"));
      let issue = "";
      if ((tag === "button" || role === "button") && !hasHandler)
        issue = "Tasto senza handler esplicito";
      if (tag === "a" && (!href || href === "#")) issue = "Collegamento vuoto";
      rows.push({
        id: `I${String(rows.length + 1).padStart(4, "0")}`,
        tag,
        role,
        label,
        line: position.line + 1,
        handler: hasHandler ? "yes" : "no",
        disabled: attrs.has("disabled") ? "conditional-or-yes" : "no",
        href,
        issue,
      });
    }
  }
  ts.forEachChild(node, visit);
};
visit(sourceFile);

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const columns = ["id", "tag", "role", "label", "line", "handler", "disabled", "href", "issue"];
const csv = [
  columns.join(","),
  ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")),
].join("\n");
const issues = rows.filter((row) => row.issue);
await mkdir("docs", { recursive: true });
await writeFile("docs/INTERACTIVE-INVENTORY.csv", csv, "utf8");
await writeFile(
  "docs/INTERACTIVE-AUDIT.md",
  `# Inventario elementi interattivi\n\n- Elementi trovati: ${rows.length}\n- Anomalie statiche: ${issues.length}\n\n` +
    (issues.length
      ? issues.map((row) => `- ${row.id} · riga ${row.line} · ${row.tag} · ${row.label}: ${row.issue}`).join("\n")
      : "Nessun tasto senza handler esplicito e nessun collegamento vuoto rilevato."),
  "utf8",
);
console.log(JSON.stringify({ total: rows.length, issues }, null, 2));
