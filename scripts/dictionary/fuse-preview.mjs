import { promises as fs } from "node:fs";
import path from "node:path";

const inputPath = path.join("artifacts", "dictionary-import", "lookup-preview.json");
const outputPath = path.join("artifacts", "dictionary-import", "fusion-preview.json");
const suru = "\u3059\u308b";

const draftExamples = {
  "勉強する": {
    meaning: "学习；用功",
    exampleJapanese: "明日の試験のために、毎日少しずつ勉強しています。",
    exampleReading: "あしたの しけんのために、まいにち すこしずつ べんきょうしています。",
    exampleChinese: "为了明天的考试，我每天一点一点地学习。"
  },
  "予定": {
    meaning: "计划；安排",
    exampleJapanese: "週末の予定を家族と相談しました。",
    exampleReading: "しゅうまつの よていを かぞくと そうだんしました。",
    exampleChinese: "我和家人商量了周末的安排。"
  },
  "把握する": {
    meaning: "掌握；理解",
    exampleJapanese: "会議の前に、問題点を正確に把握しておきます。",
    exampleReading: "かいぎの まえに、もんだいてんを せいかくに はあくしておきます。",
    exampleChinese: "会议前，我会先准确掌握问题点。"
  },
  "慣れる": {
    meaning: "习惯；适应",
    exampleJapanese: "新しい生活にも少しずつ慣れてきました。",
    exampleReading: "あたらしい せいかつにも すこしずつ なれてきました。",
    exampleChinese: "我也渐渐适应了新的生活。"
  },
  "申し込む": {
    meaning: "申请；报名",
    exampleJapanese: "来月のオンライン講座に申し込みました。",
    exampleReading: "らいげつの オンラインこうざに もうしこみました。",
    exampleChinese: "我报名了下个月的线上课程。"
  }
};

async function main() {
  const report = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const successfulSources = report.results.filter((source) => source.status === "ok");
  const candidates = report.words.map((word) => buildCandidate(word, successfulSources));
  const output = {
    generatedAt: new Date().toISOString(),
    sourceReport: inputPath,
    copyrightNote:
      "Fusion preview only. Draft meanings/examples are rewritten originals; source snippets remain in lookup-preview.json for internal review only.",
    candidates
  };

  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Fusion preview written to ${path.resolve(outputPath)}`);

  for (const candidate of candidates) {
    console.log(
      `${candidate.word}: ${candidate.recommended.reading ?? "-"} / ${candidate.recommended.pitchAccent.join(",") || "-"} / ${candidate.recommended.partOfSpeech.join(",") || "-"} / confidence ${candidate.confidenceScore}`
    );
  }
}

function buildCandidate(word, sources) {
  const sourceHits = sources
    .map((source) => {
      const match = source.matches.find((item) => item.word === word);
      const firstEntry = match?.entries?.[0];

      return {
        sourceId: source.sourceId,
        purpose: source.purpose,
        found: Boolean(match?.found && firstEntry),
        matchedKey: firstEntry?.key ?? null,
        linkedKey: firstEntry?.linkedKey ?? null,
        hints: firstEntry?.hints ?? null
      };
    })
    .filter((source) => source.found);
  const readingCandidates = collectReadings(word, sourceHits);
  const pitchAccentCandidates = unique(
    sourceHits.flatMap((source) => source.hints?.accentCandidates ?? []).filter(isLikelyAccent)
  );
  const rawPartOfSpeechCandidates = unique(sourceHits.flatMap((source) => source.hints?.partOfSpeechCandidates ?? []));
  const partOfSpeechCandidates = normalizePartOfSpeech(rawPartOfSpeechCandidates, word);
  const draft = draftExamples[word] ?? {
    meaning: "",
    exampleJapanese: "",
    exampleReading: "",
    exampleChinese: ""
  };

  return {
    word,
    recommended: {
      reading: readingCandidates[0] ?? null,
      pitchAccent: pitchAccentCandidates,
      partOfSpeech: partOfSpeechCandidates,
      meaning: draft.meaning
    },
    evidence: {
      sourceHits: sourceHits.map((source) => ({
        sourceId: source.sourceId,
        matchedKey: source.matchedKey,
        linkedKey: source.linkedKey,
        readingCandidates: source.hints?.kanaCandidates ?? [],
        pitchAccentCandidates: source.hints?.accentCandidates ?? [],
        partOfSpeechCandidates: source.hints?.partOfSpeechCandidates ?? []
      }))
    },
    originalExampleDraft: {
      japanese: draft.exampleJapanese,
      reading: draft.exampleReading,
      meaning: draft.exampleChinese
    },
    confidenceScore: scoreCandidate({
      readingCandidates,
      pitchAccentCandidates,
      partOfSpeechCandidates,
      sourceHits
    }),
    reviewNotes: [
      "Do not publish raw source definitions or examples.",
      "Editor should verify JLPT level before importing into vocabulary.",
      "Chinese meaning and Japanese example are rewritten drafts."
    ]
  };
}

function collectReadings(word, sourceHits) {
  const normalized = sourceHits
    .flatMap((source) =>
      (source.hints?.kanaCandidates ?? []).map((reading) => ({
        reading: normalizeReadingForWord(word, reading),
        sourceId: source.sourceId
      }))
    )
    .filter((item) => item.reading && item.reading.length >= 2)
    .filter((item) => /^[\u3041-\u3096\u30fc]+$/.test(item.reading))
    .filter((item) => item.reading.length <= Math.max(8, word.length + 4))
    .sort((a, b) => scoreReading(word, b) - scoreReading(word, a))
    .map((item) => item.reading);

  return unique(normalized);
}

function normalizeReadingForWord(word, reading) {
  const cleaned = reading.replace(/\s+/g, "");

  if (word.endsWith(suru) && !cleaned.endsWith(suru)) {
    return `${cleaned}${suru}`;
  }

  return cleaned;
}

function scoreReading(word, item) {
  let score = 0;

  if (item.sourceId === "nhk-accent") {
    score += 100;
  }

  if (word.endsWith(suru) && item.reading.endsWith(suru)) {
    score += 20;
  }

  if (item.reading.length >= 3 && item.reading.length <= 8) {
    score += 10;
  }

  if (item.reading.length > 10) {
    score -= 20;
  }

  return score;
}

function normalizePartOfSpeech(candidates, word) {
  if (word.endsWith(suru) && candidates.includes("suru_verb")) {
    return ["verb", "suru_verb"];
  }

  if (candidates.includes("noun")) {
    return candidates.includes("suru_verb") ? ["noun", "suru_verb"] : ["noun"];
  }

  if (candidates.includes("verb")) {
    return ["verb"];
  }

  return candidates;
}

function scoreCandidate({ readingCandidates, pitchAccentCandidates, partOfSpeechCandidates, sourceHits }) {
  let score = 0;

  score += Math.min(sourceHits.length * 15, 45);

  if (readingCandidates.length > 0) {
    score += 25;
  }

  if (pitchAccentCandidates.length > 0) {
    score += 20;
  }

  if (partOfSpeechCandidates.length > 0) {
    score += 10;
  }

  return Math.min(score, 100);
}

function isLikelyAccent(value) {
  return /^[0-9]$/.test(value);
}

function unique(values) {
  return Array.from(new Set(values));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
