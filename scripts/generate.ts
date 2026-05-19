import { mkdirSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { optimize } from "svgo";
import svgoConfig from "../svgo.config";

const dirnameTransform = {
  education: "edu",
  development: "dev",
  communication: "comm",
  "profiles-and-user": "profile",
  "time-stopwatch": "time",
  "travel-and-location": "travel",
} as Record<string, string>;

const skipDirs = ["crypto", "flags-rectangle", "flags-round"];

const filenameTransform = {
  "-": "delete",
} as Record<string, string>;

const sourceMap = new Map<string, string>();

function normalizeSvgColor(svgText: string): string {
  // Some upstream icons hardcode black, which breaks dark-mode previews.
  svgText = svgText.replace(/fill="(?:black|#000)"/g, 'fill="currentColor"');

  // Optimize away fill=none
  if (
    svgText.includes("fill=", svgText.indexOf(">")) &&
    svgText.indexOf('fill="none"') !== -1 &&
    svgText.indexOf('fill="none"') < svgText.indexOf(">")
  ) {
    svgText = svgText.replace(/fill="none"/, "");
  }

  // correct fill="currentColor"
  if (svgText.indexOf('fill="currentColor"') < svgText.indexOf(">")) {
    svgText = svgText.replace('fill="currentColor"', 'fill="none"');
  }

  return svgText;
}

async function generateIcons(): Promise<number> {
  rmSync("icons", { recursive: true, force: true });
  mkdirSync("icons");

  let generatedCount = 0;

  for (const dir of await readdir("vendor/svg-icons")) {
    if (skipDirs.includes(dir)) continue;

    const rawPrefix = dir
      // remove tag
      .replace(/-(outline|filled)$/, "")
      // singular
      .replace(/s$/g, "");

    const prefix = dirnameTransform[rawPrefix] ?? rawPrefix;
    const defaultTag = dir.match(/-filled$/) ? "-filled" : "";

    for (const file of await readdir(`vendor/svg-icons/${dir}`)) {
      let filename = file.replace(/\.svg$/, "");
      let tag = defaultTag;

      if (filenameTransform[filename]) {
        filename = filenameTransform[filename];
      }

      if (filename.startsWith(rawPrefix)) {
        filename = filename.slice(rawPrefix.length);
      }

      filename = filename
        .toLowerCase()
        .replace(/[^-a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      if (filename.endsWith("-outline")) {
        tag = "";
      } else if (filename.endsWith("-filled")) {
        tag = "-filled";
      }

      filename = filename.replace(/-(outline|filled)$/g, "");

      const source = Bun.file(`vendor/svg-icons/${dir}/${file}`);

      let destfilename = `${prefix}-${filename}`;

      // outline is default
      if (destfilename.endsWith("-outline")) {
        destfilename = destfilename.replace("-outline", "");
      }

      // normalize numbers + avoid name conflicts
      let num = Number(destfilename.match(/-(\d+)$/)?.[1] ?? "0");

      const base = destfilename.replace(/-(\d+)$/, "");

      while (true) {
        destfilename = `${base}${num === 0 ? "" : `-${num}`}${tag}`;

        num++;

        if (!(await Bun.file(`icons/${destfilename}.svg`).exists())) break;
      }

      destfilename += ".svg";

      const dest = Bun.file(`icons/${destfilename}`);

      if (await dest.exists()) {
        console.warn(
          `File '${dir}/${file}' -> 'icons/${destfilename}' already exists from ${sourceMap.get(destfilename)}`,
        );
        process.exit(1);
      }

      sourceMap.set(destfilename, `${dir}/${file}`);
      const sourceText = await source.text();
      const normalizedSvg = normalizeSvgColor(sourceText);

      await Bun.write(dest, normalizedSvg);
      generatedCount++;
    }
  }

  return generatedCount;
}

async function optimizeIcons(): Promise<void> {
  for (const file of await readdir("icons")) {
    if (!file.endsWith(".svg")) continue;

    const path = `icons/${file}`;
    const svg = await Bun.file(path).text();
    const result = optimize(svg, { ...(svgoConfig as any), path });

    await Bun.write(path, result.data);
  }
}

async function generateHtml(): Promise<number> {
  const generatedIcons: Array<{ name: string; svg: string }> = [];
  for (const file of await readdir("icons")) {
    if (!file.endsWith(".svg")) continue;
    generatedIcons.push({
      name: file.replace(/\.svg$/, ""),
      svg: await Bun.file(`icons/${file}`).text(),
    });
  }

  generatedIcons.sort((a, b) => a.name.localeCompare(b.name));

  const iconJsonString = JSON.stringify(generatedIcons).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const htmlTemplate = await Bun.file("scripts/icons-search.template.html").text();
  const html = htmlTemplate.replace("<INJECT>", iconJsonString);

  await Bun.write("index.html", html);
  return generatedIcons.length;
}

const generatedCount = await generateIcons();
await optimizeIcons();
const htmlIconCount = await generateHtml();
console.log(
  `Generated icons/${generatedCount} SVGs -> optimized with svgo -> index.html (${htmlIconCount} icons)`,
);
