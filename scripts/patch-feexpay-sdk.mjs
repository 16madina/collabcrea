import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const files = [
  "node_modules/@feexpay/react-sdk/dist/index.es.js",
  "node_modules/@feexpay/react-sdk/dist/index.cjs.js",
];

const legacyApiUrl = "https://api.feexpay.me";
const currentApiUrl = "https://api-v2.feexpay.me";

for (const file of files) {
  const path = resolve(file);
  const source = await readFile(path, "utf8");

  if (!source.includes(legacyApiUrl)) continue;

  await writeFile(path, source.replaceAll(legacyApiUrl, currentApiUrl));
  console.log(`Updated FeexPay API endpoint in ${file}`);
}