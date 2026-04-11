import { mkdirSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";

const dirnameTransform = {
  education: "edu",
  development: "dev",
  communication: "comm",
  "profiles-and-user": "profile",
  "time-stopwatch": "time",
  "travel-and-location": "travel",
} as Record<string, string>;

const filenameTransform = {
  "-": "delete",
} as Record<string, string>;

const sourceMap = new Map<string, string>();
const generatedIcons: Array<{ name: string; svg: string }> = [];

function normalizeSvgColor(svgText: string): string {
  // Some upstream icons hardcode black, which breaks dark-mode previews.
  return svgText.replace(
    /\b(fill|stroke)\s*=\s*(['"])\s*(#000000|#000|black)\s*\2/gi,
    '$1="currentColor"',
  );
}

rmSync("icons", { recursive: true, force: true });
mkdirSync("icons");

for (const dir of await readdir("vendor/svg-icons")) {
  let prefix = dir
    // remove tag
    .replace(/-(outline|filled)$/, "")
    // singular
    .replace(/s$/g, "");

  let tag = dir.match(/-filled$/) ? "-filled" : "";

  for (const file of await readdir(`vendor/svg-icons/${dir}`)) {
    let filename = file.replace(/\.svg$/, "");

    if (filenameTransform[filename]) {
      filename = filenameTransform[filename];
    }

    if (filename.startsWith(prefix)) {
      filename = filename.slice(prefix.length);
    }

    if (dirnameTransform[prefix]) {
      prefix = dirnameTransform[prefix];
    }

    filename = filename
      .toLowerCase()
      .replace(/^-+/g, "")
      .replace(/[^-a-z0-9]+/g, "-")
      .replace(/-+/g, "-");

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

    generatedIcons.push({
      name: destfilename.replace(/\.svg$/, ""),
      svg: normalizedSvg,
    });

    await Bun.write(dest, sourceText);
  }
}

generatedIcons.sort((a, b) => a.name.localeCompare(b.name));

const iconJsonString = JSON.stringify(generatedIcons).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const htmlTemplate = await Bun.file("scripts/icons-search.template.html").text();
const html = htmlTemplate.replace("<INJECT>", iconJsonString);

await Bun.write("icons-search.html", html);
console.log(`Generated icons/${generatedIcons.length} SVGs + icons-search.html`);
