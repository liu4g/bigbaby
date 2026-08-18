import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { inflateSync } from "node:zlib";

const defaultRoot = "E:\\tokyo\\GoldenDict\\content\\jp";
const defaultOutput = path.join("artifacts", "dictionary-import", "lookup-preview.json");
const defaultWords = ["勉強する", "予定", "把握する", "慣れる", "申し込む"];
const firstBatchSourceIds = ["nhk-accent", "jmdict", "daijirin4", "shinmeikai8", "new-century-jp-zh"];

const args = parseArgs(process.argv.slice(2));
const rootDir = args.root ?? defaultRoot;
const outputPath = args.output ?? defaultOutput;
const words = args.words.length ? args.words : defaultWords;
const selectedIds = args.sources.length ? args.sources : firstBatchSourceIds;

async function main() {
  const sourceConfig = JSON.parse(await fs.readFile(path.join("scripts", "dictionary", "reference-sources.json"), "utf8"));
  const selectedSources = sourceConfig.selected.filter((source) => selectedIds.includes(source.id));
  const results = [];

  for (const source of selectedSources) {
    const filePath = path.join(rootDir, source.path);

    try {
      const mdx = await MdxDictionary.open(filePath);
      const matches = [];

      for (const word of words) {
        const entries = await mdx.lookup(word, { limit: 3 });
        matches.push({
          word,
          found: entries.length > 0,
          entries: entries.map((entry) => ({
            key: entry.key,
            recordOffset: entry.recordOffset,
            snippet: sanitizeSnippet(entry.text),
            hints: extractHints(entry.text, word)
          }))
        });
      }

      results.push({
        sourceId: source.id,
        title: mdx.header.title || source.title,
        purpose: source.purpose,
        file: source.path,
        status: "ok",
        header: {
          encoding: mdx.header.encoding,
          version: mdx.header.version,
          encrypted: mdx.header.encrypted,
          entries: mdx.keyEntries.length,
          keyBlocks: mdx.keyBlockInfo.length,
          recordBlocks: mdx.recordBlockInfo.length
        },
        matches
      });
    } catch (error) {
      results.push({
        sourceId: source.id,
        title: source.title,
        purpose: source.purpose,
        file: source.path,
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    rootDir,
    words,
    selectedSourceIds: selectedIds,
    copyrightNote:
      "Internal preview only. Do not publish copied commercial dictionary definitions, examples, audio, or article structure.",
    results
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Lookup preview written to ${path.resolve(outputPath)}`);
  console.log(summaryTable(results));
}

class MdxDictionary {
  constructor(filePath, buffer, header, keyBlockInfo, keyEntries, recordBlockInfo, recordBlocksOffset) {
    this.filePath = filePath;
    this.buffer = buffer;
    this.header = header;
    this.keyBlockInfo = keyBlockInfo;
    this.keyEntries = keyEntries;
    this.recordBlockInfo = recordBlockInfo;
    this.recordBlocksOffset = recordBlocksOffset;
    this.recordBlockCache = new Map();
    this.keyEntryByKey = new Map();
    this.keyEntryByNormalizedKey = new Map();

    for (const entry of this.keyEntries) {
      if (!this.keyEntryByKey.has(entry.key)) {
        this.keyEntryByKey.set(entry.key, entry);
      }

      const normalizedKey = normalizeKey(entry.key);

      if (!this.keyEntryByNormalizedKey.has(normalizedKey)) {
        this.keyEntryByNormalizedKey.set(normalizedKey, entry);
      }
    }
  }

  static async open(filePath) {
    const buffer = await fs.readFile(filePath);
    const { header, offsetAfterHeader } = parseHeader(buffer);
    const keyHeader = parseKeyBlockHeader(buffer, offsetAfterHeader, header.version);
    const keyInfoOffset = keyHeader.offset;
    const keyInfoPayload = buffer.subarray(keyInfoOffset, keyInfoOffset + keyHeader.keyBlockInfoCompressedSize);
    const keyBlockInfoBytes = decompressPayload(keyInfoPayload, "key block info");
    const keyBlockInfo = parseKeyBlockInfo(keyBlockInfoBytes, header.encoding, header.version);
    const keyBlocksOffset = keyInfoOffset + keyHeader.keyBlockInfoCompressedSize;
    const keyEntries = parseKeyBlocks(buffer, keyBlocksOffset, keyBlockInfo, header.encoding, header.version);
    const recordHeaderOffset = keyBlocksOffset + keyHeader.keyBlocksTotalSize;
    const recordHeader = parseRecordBlockHeader(buffer, recordHeaderOffset, header.version);
    const recordBlockInfo = parseRecordBlockInfo(
      buffer,
      recordHeader.offset,
      recordHeader.numRecordBlocks,
      header.version
    );
    const recordBlocksOffset = recordHeader.offset + recordHeader.recordBlockInfoSize;

    return new MdxDictionary(filePath, buffer, header, keyBlockInfo, keyEntries, recordBlockInfo, recordBlocksOffset);
  }

  async lookup(query, { limit = 3 } = {}) {
    const queryCandidates = buildLookupCandidates(query);
    const exact = [];
    const fuzzy = [];

    for (const candidate of queryCandidates) {
      const entry = this.keyEntryByNormalizedKey.get(candidate);

      if (entry && !exact.includes(entry)) {
        exact.push(entry);
      }
    }

    if (exact.length < limit) {
      for (const entry of this.keyEntries) {
        const normalizedKey = normalizeKey(entry.key);

        if (
          queryCandidates.some(
            (candidate) =>
              candidate.length >= 2 &&
              normalizedKey.length >= candidate.length &&
              (normalizedKey === candidate || normalizedKey.startsWith(candidate))
          )
        ) {
          if (!exact.includes(entry) && !fuzzy.includes(entry)) {
            fuzzy.push(entry);
          }
        }

        if (exact.length + fuzzy.length >= limit) {
          break;
        }
      }
    }

    const selected = [...exact, ...fuzzy].slice(0, limit);
    const entries = [];

    for (const entry of selected) {
      const decoded = this.decodeRecord(entry);
      entries.push({
        ...entry,
        linkedKey: decoded.linkedKey,
        text: decoded.text
      });
    }

    return entries;
  }

  findLinkedEntry(targetKey) {
    return this.keyEntryByKey.get(targetKey) ?? this.keyEntryByNormalizedKey.get(normalizeKey(targetKey)) ?? null;
  }

  decodeRecord(entry, seen = new Set()) {
    if (seen.has(entry.key)) {
      return { text: "", linkedKey: entry.key };
    }

    seen.add(entry.key);

    const currentIndex = entry.index;
    const nextEntry = this.keyEntries[currentIndex + 1];
    const start = entry.recordOffset;
    const end = nextEntry ? nextEntry.recordOffset : this.getTotalRecordSize();

    if (end <= start) {
      return { text: "", linkedKey: null };
    }

    const chunks = [];
    let consumed = 0;
    let cursor = this.recordBlocksOffset;

    for (let index = 0; index < this.recordBlockInfo.length; index += 1) {
      const info = this.recordBlockInfo[index];
      const blockStart = consumed;
      const blockEnd = consumed + info.decompressedSize;

      if (end > blockStart && start < blockEnd) {
        const block = this.getRecordBlock(index, cursor, info);
        const sliceStart = Math.max(0, start - blockStart);
        const sliceEnd = Math.min(info.decompressedSize, end - blockStart);
        chunks.push(block.subarray(sliceStart, sliceEnd));
      }

      consumed = blockEnd;
      cursor += info.compressedSize;

      if (consumed >= end) {
        break;
      }
    }

    const text = decodeText(Buffer.concat(chunks), this.header.encoding).replace(/\u0000/g, "");
    const linkMatch = text.trim().match(/^@@@LINK=(.+)$/);

    if (linkMatch) {
      const linkedKey = linkMatch[1].trim();
      const linkedEntry = this.findLinkedEntry(linkedKey);

      if (linkedEntry) {
        const decoded = this.decodeRecord(linkedEntry, seen);
        return {
          text: decoded.text,
          linkedKey
        };
      }
    }

    return { text, linkedKey: null };
  }

  getRecordBlock(index, cursor, info) {
    const cached = this.recordBlockCache.get(index);

    if (cached) {
      return cached;
    }

    const payload = this.buffer.subarray(cursor, cursor + info.compressedSize);
    const decompressed = decompressPayload(payload, `record block ${index}`);
    this.recordBlockCache.set(index, decompressed);

    return decompressed;
  }

  getTotalRecordSize() {
    return this.recordBlockInfo.reduce((sum, info) => sum + info.decompressedSize, 0);
  }
}

function parseHeader(buffer) {
  const headerSize = buffer.readUInt32BE(0);
  const headerBytes = buffer.subarray(4, 4 + headerSize);
  const headerText = decodeHeader(headerBytes);
  const attributes = {};

  for (const match of headerText.matchAll(/([A-Za-z][A-Za-z0-9_:-]*)="([^"]*)"/g)) {
    attributes[match[1]] = decodeHtmlEntities(match[2]);
  }

  const version = Number.parseFloat(attributes.GeneratedByEngineVersion ?? attributes.RequiredEngineVersion ?? "2.0");
  const offsetAfterHeader = 4 + headerSize + 4;

  return {
    header: {
      attributes,
      version: Number.isFinite(version) ? version : 2,
      encoding: normalizeEncoding(attributes.Encoding ?? "UTF-8"),
      encrypted: attributes.Encrypted ?? "No",
      title: attributes.Title ?? attributes.DictTitle ?? "",
      description: attributes.Description ?? ""
    },
    offsetAfterHeader
  };
}

function parseKeyBlockHeader(buffer, offset, version) {
  const width = numberWidth(version);
  let cursor = offset;
  const numKeyBlocks = readNumber(buffer, cursor, width);
  cursor += width;
  const numEntries = readNumber(buffer, cursor, width);
  cursor += width;
  const keyBlockInfoDecompressedSize = readNumber(buffer, cursor, width);
  cursor += width;
  const keyBlockInfoCompressedSize = readNumber(buffer, cursor, width);
  cursor += width;
  const keyBlocksTotalSize = readNumber(buffer, cursor, width);
  cursor += width;

  if (version >= 2) {
    cursor += 4;
  }

  return {
    numKeyBlocks,
    numEntries,
    keyBlockInfoDecompressedSize,
    keyBlockInfoCompressedSize,
    keyBlocksTotalSize,
    offset: cursor
  };
}

function parseKeyBlockInfo(buffer, encoding, version) {
  const width = numberWidth(version);
  const keySizeWidth = version >= 2 ? 2 : 1;
  let cursor = 0;
  const info = [];

  while (cursor < buffer.length) {
    const numEntries = readNumber(buffer, cursor, width);
    cursor += width;

    const firstKeySize = buffer.readUIntBE(cursor, keySizeWidth);
    cursor += keySizeWidth;
    const firstKey = decodeText(buffer.subarray(cursor, cursor + firstKeySize), encoding).replace(/\u0000/g, "");
    cursor += firstKeySize + terminatorLength(encoding);

    const lastKeySize = buffer.readUIntBE(cursor, keySizeWidth);
    cursor += keySizeWidth;
    const lastKey = decodeText(buffer.subarray(cursor, cursor + lastKeySize), encoding).replace(/\u0000/g, "");
    cursor += lastKeySize + terminatorLength(encoding);

    const compressedSize = readNumber(buffer, cursor, width);
    cursor += width;
    const decompressedSize = readNumber(buffer, cursor, width);
    cursor += width;

    info.push({ numEntries, firstKey, lastKey, compressedSize, decompressedSize });
  }

  return info;
}

function parseKeyBlocks(buffer, offset, keyBlockInfo, encoding, version) {
  const width = numberWidth(version);
  let cursor = offset;
  const entries = [];

  for (const info of keyBlockInfo) {
    const payload = buffer.subarray(cursor, cursor + info.compressedSize);
    const block = decompressPayload(payload, "key block");
    let blockCursor = 0;

    for (let index = 0; index < info.numEntries && blockCursor < block.length; index += 1) {
      const recordOffset = readNumber(block, blockCursor, width);
      blockCursor += width;
      const { text, nextOffset } = readNullTerminatedText(block, blockCursor, encoding);
      blockCursor = nextOffset;

      entries.push({
        key: text,
        recordOffset,
        index: entries.length
      });
    }

    cursor += info.compressedSize;
  }

  return entries;
}

function parseRecordBlockHeader(buffer, offset, version) {
  const width = numberWidth(version);
  let cursor = offset;
  const numRecordBlocks = readNumber(buffer, cursor, width);
  cursor += width;
  const numEntries = readNumber(buffer, cursor, width);
  cursor += width;
  const recordBlockInfoSize = readNumber(buffer, cursor, width);
  cursor += width;
  const recordBlocksSize = readNumber(buffer, cursor, width);
  cursor += width;

  return {
    numRecordBlocks,
    numEntries,
    recordBlockInfoSize,
    recordBlocksSize,
    offset: cursor
  };
}

function parseRecordBlockInfo(buffer, offset, count, version) {
  const width = numberWidth(version);
  let cursor = offset;
  const info = [];

  for (let index = 0; index < count; index += 1) {
    const compressedSize = readNumber(buffer, cursor, width);
    cursor += width;
    const decompressedSize = readNumber(buffer, cursor, width);
    cursor += width;
    info.push({ compressedSize, decompressedSize });
  }

  return info;
}

function decompressPayload(payload, label) {
  const compressionType = payload.readUInt32LE(0);
  const body = payload.subarray(8);

  if (compressionType === 0) {
    return body;
  }

  if (compressionType === 2) {
    return inflateSync(body);
  }

  throw new Error(`${label} uses unsupported compression type ${compressionType}`);
}

function readNullTerminatedText(buffer, offset, encoding) {
  const terminator = terminatorLength(encoding);
  let cursor = offset;

  if (terminator === 2) {
    while (cursor + 1 < buffer.length) {
      if (buffer[cursor] === 0 && buffer[cursor + 1] === 0) {
        break;
      }
      cursor += 2;
    }
  } else {
    while (cursor < buffer.length && buffer[cursor] !== 0) {
      cursor += 1;
    }
  }

  return {
    text: decodeText(buffer.subarray(offset, cursor), encoding).replace(/\u0000/g, ""),
    nextOffset: Math.min(buffer.length, cursor + terminator)
  };
}

function readNumber(buffer, offset, width) {
  if (width === 8) {
    return Number(buffer.readBigUInt64BE(offset));
  }

  return buffer.readUInt32BE(offset);
}

function numberWidth(version) {
  return version >= 2 ? 8 : 4;
}

function terminatorLength(encoding) {
  return encoding === "utf-16le" || encoding === "utf-16be" ? 2 : 1;
}

function decodeHeader(buffer) {
  const zeroBytes = buffer.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
  const encoding = zeroBytes > buffer.length / 5 ? "utf-16le" : "utf8";

  return buffer.toString(encoding).replace(/\u0000/g, "").trim();
}

function decodeText(buffer, encoding) {
  if (encoding === "utf-16be") {
    return swapUtf16Endian(buffer).toString("utf16le");
  }

  return buffer.toString(encoding);
}

function normalizeEncoding(value) {
  const normalized = value.toLowerCase().replace(/_/g, "-");

  if (normalized.includes("utf-16")) {
    return "utf-16le";
  }

  if (normalized.includes("gbk") || normalized.includes("gb2312")) {
    return "latin1";
  }

  return "utf8";
}

function swapUtf16Endian(buffer) {
  const copy = Buffer.from(buffer);

  for (let index = 0; index + 1 < copy.length; index += 2) {
    const current = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = current;
  }

  return copy;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeKey(value) {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[・‐‑‒–—―ｰー]/g, "")
    .toLowerCase();
}

function buildLookupCandidates(value) {
  const normalized = normalizeKey(value);
  const candidates = new Set([normalized]);

  if (normalized.endsWith("する") && normalized.length > 3) {
    candidates.add(normalized.slice(0, -2));
  }

  if (normalized.endsWith("だ") && normalized.length > 2) {
    candidates.add(normalized.slice(0, -1));
  }

  return Array.from(candidates).filter((candidate) => candidate.length > 0);
}

function sanitizeSnippet(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function extractHints(html, word) {
  const text = sanitizeSnippet(html);
  const kanaMatches = Array.from(text.matchAll(/[ぁ-ゖー]{2,}/g), (match) => match[0]).slice(0, 5);
  const accentMatches = Array.from(text.matchAll(/\[([0-9０-９]{1,2})\]/g), (match) => normalizeDigit(match[1]))
    .filter(Boolean);
  const headerSegment = text.includes("【") ? text.slice(0, text.indexOf("【")) : text.slice(0, 120);
  const circledAccentMatches = Array.from(headerSegment.matchAll(/[⓪①②③④⑤⑥⑦⑧⑨]/g), (match) => match[0]);

  const accentCandidates = [...accentMatches, ...circledAccentMatches.map(circledNumberToDigit)]
    .filter(Boolean)
    .slice(0, 5);

  return {
    containsWord: text.includes(word),
    kanaCandidates: Array.from(new Set(kanaMatches)),
    accentCandidates: Array.from(new Set(accentCandidates)),
    partOfSpeechCandidates: extractPartOfSpeechCandidates(text)
  };
}

function normalizeDigit(value) {
  return value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

function circledNumberToDigit(value) {
  const map = {
    "⓪": "0",
    "①": "1",
    "②": "2",
    "③": "3",
    "④": "4",
    "⑤": "5",
    "⑥": "6",
    "⑦": "7",
    "⑧": "8",
    "⑨": "9"
  };

  return map[value] ?? "";
}

function extractPartOfSpeechCandidates(text) {
  const candidates = new Set();

  if (/[（(]\s*名\s*[）)]/.test(text)) {
    candidates.add("noun");
  }

  if (/スル|サ\s*[）)]|サ変|他\s*サ|自\s*サ/.test(text)) {
    candidates.add("suru_verb");
  }

  if (/動|五|上一|下一|自\s|他\s/.test(text)) {
    candidates.add("verb");
  }

  if (/形容詞|形\s*[）)]|イ形/.test(text)) {
    candidates.add("i_adjective");
  }

  if (/形動|ナ形|な\s*[）)]/.test(text)) {
    candidates.add("na_adjective");
  }

  return Array.from(candidates);
}

function parseArgs(argv) {
  const parsed = {
    root: null,
    output: null,
    words: [],
    sources: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--root") {
      parsed.root = argv[++index];
    } else if (arg === "--output") {
      parsed.output = argv[++index];
    } else if (arg === "--source") {
      parsed.sources.push(argv[++index]);
    } else if (arg === "--words") {
      parsed.words.push(...argv[++index].split(",").map((word) => word.trim()).filter(Boolean));
    } else {
      parsed.words.push(arg);
    }
  }

  return parsed;
}

function summaryTable(results) {
  return results
    .map((result) => {
      if (result.status !== "ok") {
        return `${result.sourceId}: error - ${result.error}`;
      }

      const hits = result.matches.filter((match) => match.found).length;
      return `${result.sourceId}: ${hits}/${result.matches.length} words found, ${result.header.entries} keys`;
    })
    .join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
