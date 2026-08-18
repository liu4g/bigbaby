import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const defaultInput = "E:\\tokyo\\GoldenDict\\content\\jp";
const defaultOutput = path.join("artifacts", "dictionary-import", "goldendict-sources.json");
const dictionaryExtensions = new Set([".mdx", ".mdd", ".css", ".png", ".jpg", ".jpeg", ".ttf", ".otf"]);

const inputDir = process.argv[2] ?? defaultInput;
const outputPath = process.argv[3] ?? defaultOutput;
const fullHash = process.argv.includes("--full-hash");

async function main() {
  const files = await walk(inputDir);
  const dictionaryFiles = files.filter((filePath) => dictionaryExtensions.has(path.extname(filePath).toLowerCase()));
  const sources = [];

  for (const filePath of dictionaryFiles) {
    const stat = await fs.stat(filePath);
    const extension = path.extname(filePath).slice(1).toLowerCase();
    const source = {
      name: path.basename(filePath, path.extname(filePath)),
      filePath,
      relativePath: path.relative(inputDir, filePath),
      sourceKind: extension,
      fileSizeBytes: stat.size,
      fileHash: fullHash ? await hashFile(filePath) : await partialHashFile(filePath, stat.size),
      hashMode: fullHash ? "full" : "partial",
      mdxHeader: null,
      detectedRole: detectRole(filePath),
      licenseStatus: "internal_reference_only"
    };

    if (extension === "mdx") {
      source.mdxHeader = await readMdxHeader(filePath);
    }

    sources.push(source);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    inputDir,
    totalFiles: sources.length,
    countsByKind: countBy(sources, "sourceKind"),
    countsByRole: countBy(sources, "detectedRole"),
    sources
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Scanned ${sources.length} files`);
  console.log(`Report: ${path.resolve(outputPath)}`);
  console.log(JSON.stringify({ countsByKind: report.countsByKind, countsByRole: report.countsByRole }, null, 2));
}

async function walk(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      result.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }

  return result;
}

async function readMdxHeader(filePath) {
  try {
    const handle = await fs.open(filePath, "r");

    try {
      const sizeBuffer = Buffer.alloc(4);
      await handle.read(sizeBuffer, 0, 4, 0);
      const headerSize = sizeBuffer.readUInt32BE(0);

      if (headerSize <= 0 || headerSize > 1024 * 1024) {
        return { error: "unexpected_header_size", headerSize };
      }

      const headerBuffer = Buffer.alloc(headerSize);
      await handle.read(headerBuffer, 0, headerSize, 4);
      const headerText = decodeHeader(headerBuffer);
      const attributes = {};

      for (const match of headerText.matchAll(/([A-Za-z][A-Za-z0-9_:-]*)="([^"]*)"/g)) {
        attributes[match[1]] = decodeHtmlEntities(match[2]);
      }

      return {
        headerSize,
        title: attributes.Title ?? attributes.DictTitle ?? null,
        description: attributes.Description ?? null,
        encoding: attributes.Encoding ?? null,
        encrypted: attributes.Encrypted ?? null,
        generatedBy: attributes.GeneratedByEngineVersion ?? null,
        format: attributes.Format ?? null,
        attributes
      };
    } finally {
      await handle.close();
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function decodeHeader(buffer) {
  const zeroBytes = buffer.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  const encoding = zeroBytes > buffer.length / 5 ? "utf16le" : "utf8";

  return buffer.toString(encoding).replace(/\u0000/g, "").trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function detectRole(filePath) {
  const name = filePath.toLowerCase();

  if (name.includes("nhk") || name.includes("発音") || name.includes("accent")) {
    return "accent_reference";
  }

  if (name.includes("日汉") || name.includes("日華") || name.includes("日中") || name.includes("rihan")) {
    return "jp_zh_definition_reference";
  }

  if (name.includes("中日") || name.includes("华日") || name.includes("漢日")) {
    return "zh_jp_lookup_reference";
  }

  if (name.includes("文型") || name.includes("表現")) {
    return "grammar_expression_reference";
  }

  if (name.includes("動詞") || name.includes("动词")) {
    return "conjugation_reference";
  }

  return "general_reference";
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function partialHashFile(filePath, size) {
  const hash = createHash("sha256");
  const chunkSize = 1024 * 1024;
  const handle = await fs.open(filePath, "r");

  try {
    const firstSize = Math.min(chunkSize, size);
    const first = Buffer.alloc(firstSize);
    await handle.read(first, 0, firstSize, 0);
    hash.update(first);

    if (size > chunkSize) {
      const lastSize = Math.min(chunkSize, size);
      const last = Buffer.alloc(lastSize);
      await handle.read(last, 0, lastSize, size - lastSize);
      hash.update(last);
    }

    hash.update(String(size));
    return hash.digest("hex");
  } finally {
    await handle.close();
  }
}

async function hashFile(filePath) {
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return hash.digest("hex");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
