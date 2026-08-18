import type { Level } from "@/lib/site";

export type AccessTier = "free" | "pro";
export type VocabularyProgressStatus = "not_started" | "in_progress" | "completed" | "suspended";

export type VocabularyExample = {
  japanese: string;
  reading: string;
  meaning: string;
  note?: string;
};

export type VocabularyEntry = {
  id: string;
  slug: string;
  word: string;
  reading: string;
  kana: string;
  romaji: string;
  meaning: string;
  partOfSpeech: string;
  partOfSpeechLabel: string;
  jlptLevel: Level;
  pitchAccent: string;
  category: string;
  categoryLabel: string;
  notes: string;
  accessTier: AccessTier;
  examples: VocabularyExample[];
  synonyms: string[];
  antonyms: string[];
};

export type VocabularyWithState = VocabularyEntry & {
  isBookmarked: boolean;
  status: VocabularyProgressStatus;
  masteryScore: number;
  nextReviewAt: string | null;
  canAccess: boolean;
  isLocked: boolean;
};

export const vocabularyCategories = [
  { id: "verbs", label: "动词", description: "动作、变化、日常表达的核心词。" },
  { id: "nouns", label: "名词", description: "主题、概念、人物和场景词。" },
  { id: "adjectives", label: "形容词", description: "状态、评价和描述类词汇。" },
  { id: "adverbs", label: "副词", description: "频率、程度、语气和连接表达。" },
  { id: "expressions", label: "表达", description: "固定搭配、寒暄和考试常见句块。" }
] as const;

export const vocabularyStatusLabels: Record<VocabularyProgressStatus, string> = {
  not_started: "未学习",
  in_progress: "不熟悉",
  completed: "已掌握",
  suspended: "暂停"
};

export const vocabularyEntries: VocabularyEntry[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    slug: "n5-benkyou-suru",
    word: "勉強する",
    reading: "べんきょうする",
    kana: "べんきょうする",
    romaji: "benkyou suru",
    meaning: "学习；用功",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N5",
    pitchAccent: "0",
    category: "verbs",
    categoryLabel: "动词",
    notes: "基础动词，常用于日常学习场景。",
    accessTier: "free",
    examples: [
      {
        japanese: "毎日30分日本語を勉強します。",
        reading: "まいにち さんじゅっぷん にほんごを べんきょうします。",
        meaning: "我每天学习 30 分钟日语。"
      }
    ],
    synonyms: ["学ぶ"],
    antonyms: []
  },
  {
    id: "00000000-0000-0000-0000-000000000107",
    slug: "n5-taberu",
    word: "食べる",
    reading: "たべる",
    kana: "たべる",
    romaji: "taberu",
    meaning: "吃",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N5",
    pitchAccent: "2",
    category: "verbs",
    categoryLabel: "动词",
    notes: "一段动词，N5 高频基础词。",
    accessTier: "free",
    examples: [
      {
        japanese: "朝ご飯を食べました。",
        reading: "あさごはんを たべました。",
        meaning: "我吃了早饭。"
      }
    ],
    synonyms: ["食事する"],
    antonyms: []
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    slug: "n4-yotei",
    word: "予定",
    reading: "よてい",
    kana: "よてい",
    romaji: "yotei",
    meaning: "计划；安排",
    partOfSpeech: "noun",
    partOfSpeechLabel: "名词",
    jlptLevel: "N4",
    pitchAccent: "0",
    category: "nouns",
    categoryLabel: "名词",
    notes: "常用于说明日程安排。",
    accessTier: "free",
    examples: [
      {
        japanese: "明日の予定を確認します。",
        reading: "あしたの よていを かくにんします。",
        meaning: "确认明天的安排。"
      }
    ],
    synonyms: ["計画", "スケジュール"],
    antonyms: []
  },
  {
    id: "00000000-0000-0000-0000-000000000108",
    slug: "n4-tetsudau",
    word: "手伝う",
    reading: "てつだう",
    kana: "てつだう",
    romaji: "tetsudau",
    meaning: "帮助；帮忙",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N4",
    pitchAccent: "3",
    category: "verbs",
    categoryLabel: "动词",
    notes: "五段动词，常用于请求和日常协作。",
    accessTier: "free",
    examples: [
      {
        japanese: "友達の引っ越しを手伝いました。",
        reading: "ともだちの ひっこしを てつだいました。",
        meaning: "我帮朋友搬家了。"
      }
    ],
    synonyms: ["助ける"],
    antonyms: ["邪魔する"]
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    slug: "n3-haaku-suru",
    word: "把握する",
    reading: "はあくする",
    kana: "はあくする",
    romaji: "haaku suru",
    meaning: "掌握；理解",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N3",
    pitchAccent: "0",
    category: "verbs",
    categoryLabel: "动词",
    notes: "常用于状况、内容、整体情况的理解。",
    accessTier: "free",
    examples: [
      {
        japanese: "状況を正しく把握する必要があります。",
        reading: "じょうきょうを ただしく はあくする ひつようが あります。",
        meaning: "有必要正确掌握情况。"
      }
    ],
    synonyms: ["理解する", "つかむ"],
    antonyms: []
  },
  {
    id: "00000000-0000-0000-0000-000000000104",
    slug: "n3-nareru",
    word: "慣れる",
    reading: "なれる",
    kana: "なれる",
    romaji: "nareru",
    meaning: "习惯；适应",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N3",
    pitchAccent: "2",
    category: "verbs",
    categoryLabel: "动词",
    notes: "常用于环境、生活、工作适应。",
    accessTier: "free",
    examples: [
      {
        japanese: "新しい環境に少しずつ慣れてきました。",
        reading: "あたらしい かんきょうに すこしずつ なれてきました。",
        meaning: "逐渐习惯了新的环境。"
      }
    ],
    synonyms: ["適応する"],
    antonyms: ["戸惑う"]
  },
  {
    id: "00000000-0000-0000-0000-000000000105",
    slug: "n2-moushikomu",
    word: "申し込む",
    reading: "もうしこむ",
    kana: "もうしこむ",
    romaji: "moushikomu",
    meaning: "申请；报名",
    partOfSpeech: "verb",
    partOfSpeechLabel: "动词",
    jlptLevel: "N2",
    pitchAccent: "4",
    category: "verbs",
    categoryLabel: "动词",
    notes: "较正式表达，常用于手续、活动、课程。",
    accessTier: "pro",
    examples: [
      {
        japanese: "来月の講座に申し込みました。",
        reading: "らいげつの こうざに もうしこみました。",
        meaning: "我报名了下个月的课程。",
        note: "PRO 例句"
      }
    ],
    synonyms: ["申請する", "応募する"],
    antonyms: ["取り消す"]
  },
  {
    id: "00000000-0000-0000-0000-000000000109",
    slug: "n2-sakugen",
    word: "削減",
    reading: "さくげん",
    kana: "さくげん",
    romaji: "sakugen",
    meaning: "削减；缩减",
    partOfSpeech: "noun",
    partOfSpeechLabel: "名词",
    jlptLevel: "N2",
    pitchAccent: "0",
    category: "nouns",
    categoryLabel: "名词",
    notes: "常用于成本、时间、人力等正式语境。",
    accessTier: "pro",
    examples: [
      {
        japanese: "会議の時間を削減する方針です。",
        reading: "かいぎの じかんを さくげんする ほうしんです。",
        meaning: "方针是缩短会议时间。",
        note: "PRO 例句"
      }
    ],
    synonyms: ["縮小", "カット"],
    antonyms: ["増加"]
  },
  {
    id: "00000000-0000-0000-0000-000000000106",
    slug: "n1-kenkai",
    word: "見解",
    reading: "けんかい",
    kana: "けんかい",
    romaji: "kenkai",
    meaning: "见解；观点",
    partOfSpeech: "noun",
    partOfSpeechLabel: "名词",
    jlptLevel: "N1",
    pitchAccent: "0",
    category: "nouns",
    categoryLabel: "名词",
    notes: "用于正式场景中的观点表达。",
    accessTier: "pro",
    examples: [
      {
        japanese: "専門家の見解を参考にします。",
        reading: "せんもんかの けんかいを さんこうにします。",
        meaning: "参考专家的见解。",
        note: "PRO 例句"
      }
    ],
    synonyms: ["意見", "見方"],
    antonyms: []
  },
  {
    id: "00000000-0000-0000-0000-000000000110",
    slug: "n1-hanron",
    word: "反論",
    reading: "はんろん",
    kana: "はんろん",
    romaji: "hanron",
    meaning: "反驳；反论",
    partOfSpeech: "noun",
    partOfSpeechLabel: "名词",
    jlptLevel: "N1",
    pitchAccent: "0",
    category: "nouns",
    categoryLabel: "名词",
    notes: "议论文、讨论和商务会议中常见。",
    accessTier: "pro",
    examples: [
      {
        japanese: "彼の意見に対して反論しました。",
        reading: "かれの いけんに たいして はんろんしました。",
        meaning: "我对他的意见提出了反驳。",
        note: "PRO 例句"
      }
    ],
    synonyms: ["異議", "抗弁"],
    antonyms: ["賛成"]
  }
];

export function getVocabularyCategoryLabel(category: string) {
  return vocabularyCategories.find((item) => item.id === category)?.label ?? "其他";
}

export function buildVocabularyQuizChoices(entry: Pick<VocabularyEntry, "meaning" | "jlptLevel">) {
  const pool = vocabularyEntries
    .filter((item) => item.meaning !== entry.meaning && item.jlptLevel === entry.jlptLevel)
    .map((item) => item.meaning);

  const fallback = vocabularyEntries.filter((item) => item.meaning !== entry.meaning).map((item) => item.meaning);
  const choices = [entry.meaning, ...pool, ...fallback];

  return Array.from(new Set(choices)).slice(0, 4).sort((a, b) => a.localeCompare(b, "zh-CN"));
}
