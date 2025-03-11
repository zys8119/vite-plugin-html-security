import { Plugin } from "vite";
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { template, merge } from "lodash";
const sriAssetsMap: Array<{
  filePath: string;
  path: string;
  asset: boolean;
  match: string;
  matchTag: string;
}> = [];
const integrityAttrValueShaKey = "integrityAttrValueSha";
function getSRIHash(filePath: string): string | null {
  try {
    const fileContent = readFileSync(filePath);
    const hash = createHash("sha384");
    hash.update(fileContent);
    return `sha384-${hash.digest("base64")}`;
  } catch (e) {
    return null;
  }
}
type Options = {
  outputDir?: string;
};
export default function (options: Options): Plugin {
  const config = merge(
    {
      outputDir: "dist",
    },
    options
  );
  return {
    name: "vite-plugin-sri",
    apply: "build",
    enforce: "post",
    closeBundle() {
      sriAssetsMap.forEach((item) => {
        const htmlPath = join(process.cwd(), config.outputDir, item.path);
        const sriHash = getSRIHash(
          /node_modules/.test(item.filePath)
            ? join(
                process.cwd(),
                "node_modules",
                item.filePath.replace(/.*?node_modules/, "")
              )
            : item.filePath
        );
        let newHtml = readFileSync(htmlPath, "utf-8");
        if (sriHash) {
          newHtml = newHtml.replace(
            item.match,
            template(item.matchTag)({
              [integrityAttrValueShaKey]: sriHash,
            })
          );
        }

        writeFileSync(htmlPath, newHtml);
      });
    },
    transformIndexHtml: {
      enforce: "post",
      transform(html, { bundle, path }) {
        if (!bundle) return html;

        const newHtml = html.replace(
          /<(link|script) ([^>]*?)(href|src)=("([^"]+)"|'([^']+)')([^>]*?)>/g,
          (match, tag, before, attr, quoteWrappedUrl, url1, url2) => {
            const url = (url1 || url2 || "").replace(/^(\.|\/)+/, "");
            const asset = Object.values(bundle).find((b) => b.fileName === url);
            const filePath = join(process.cwd(), config.outputDir, url);
            sriAssetsMap.push({
              filePath,
              asset: !!asset,
              path,
              match,
              matchTag: `<${tag} ${before}${attr}=${quoteWrappedUrl} integrity="<%=${integrityAttrValueShaKey}%>" crossorigin="anonymous"${
                match.endsWith("/>") ? "/" : ""
              }>`,
            });

            return match;
          }
        );
        return newHtml;
      },
    },
  } as Plugin;
}
