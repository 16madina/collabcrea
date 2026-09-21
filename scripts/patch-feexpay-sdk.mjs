import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const files = [
  "node_modules/@feexpay/react-sdk/dist/index.es.js",
  "node_modules/@feexpay/react-sdk/dist/index.cjs.js",
];

const legacyApiUrl = "https://api.feexpay.me";
const currentApiUrl = "https://api-v2.feexpay.me";

// Prefill support: the SDK hardcodes its initial form state (country, network,
// phone, name, email). We rewrite those initial values so the host app can
// provide defaults through `window.__CC_FEEXPAY_PREFILL`.
const prefillStateRegex =
  /\[([^\]]+)\]\s*=\s*(\w+)\("BENIN"\)\s*,\s*\[([^\]]+)\]\s*=\s*\2\("MTN"\)\s*,\s*\[([^\]]+)\]\s*=\s*\2\(""\)\s*,\s*\[([^\]]+)\]\s*=\s*\2\(""\)\s*,\s*\[([^\]]+)\]\s*=\s*\2\(""\)/;

const pf = (key, fallback) =>
  `((typeof window<"u"&&window.__CC_FEEXPAY_PREFILL&&window.__CC_FEEXPAY_PREFILL.${key})||${fallback})`;

for (const file of files) {
  const path = resolve(file);
  let source = await readFile(path, "utf8");
  const original = source;

  source = source.replaceAll(legacyApiUrl, currentApiUrl);

  if (!source.includes("__CC_FEEXPAY_PREFILL")) {
    const match = source.match(prefillStateRegex);
    if (match) {
      const [, country, setter, network, phone, name, email] = match;
      source = source.replace(
        prefillStateRegex,
        `[${country}]=${setter}(${pf("country", '"BENIN"')}),` +
          `[${network}]=${setter}(${pf("network", '"MTN"')}),` +
          `[${phone}]=${setter}(${pf("phone", '""')}),` +
          `[${name}]=${setter}(${pf("name", '""')}),` +
          `[${email}]=${setter}(${pf("email", '""')})`
      );
    } else {
      console.warn(`FeexPay prefill patch: pattern not found in ${file}`);
    }
  }

  if (source !== original) {
    await writeFile(path, source);
    console.log(`Patched FeexPay SDK in ${file}`);
  }
}
