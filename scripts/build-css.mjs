import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const rootDir = process.cwd();
const inputPath = path.join(rootDir, "src/styles/admin_home.css");
const outputPath = path.join(rootDir, "public/style_admin_home.css");

const inputCss = await readFile(inputPath, "utf8");
const result = await postcss([tailwindcss()]).process(inputCss, {
  from: inputPath,
  to: outputPath,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, result.css, "utf8");

if (result.map) {
  await writeFile(`${outputPath}.map`, result.map.toString(), "utf8");
}

console.log(`CSS generado en ${path.relative(rootDir, outputPath)}`);
