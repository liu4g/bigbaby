import type { Level } from "@/lib/site";
import type { AccessTier, VocabularyProgressStatus } from "@/lib/vocabulary-data";

export type GrammarProgressStatus = VocabularyProgressStatus;

export type GrammarExample = {
  japanese: string;
  reading: string;
  meaning: string;
  note?: string;
};

export type GrammarEntry = {
  id: string;
  slug: string;
  grammarPoint: string;
  jlptLevel: Level;
  meaning: string;
  formation: string;
  explanation: string;
  examples: GrammarExample[];
  similarGrammar: string[];
  notes: string;
  accessTier: AccessTier;
};

export type GrammarWithState = GrammarEntry & {
  isBookmarked: boolean;
  status: GrammarProgressStatus;
  masteryScore: number;
  nextReviewAt: string | null;
  canAccess: boolean;
  isLocked: boolean;
};

export const grammarStatusLabels: Record<GrammarProgressStatus, string> = {
  not_started: "未学习",
  in_progress: "不熟悉",
  completed: "已掌握",
  suspended: "暂停"
};

export const grammarEntries: GrammarEntry[] = [
  {
    id: "00000000-0000-0000-0000-000000000206",
    slug: "n5-desu",
    grammarPoint: "〜です",
    jlptLevel: "N5",
    meaning: "表示礼貌判断或说明。",
    formation: "Noun / Na-adjective + です",
    explanation: "用于名词句和な形容词句，是最基础的礼貌体。",
    examples: [
      {
        japanese: "これは日本語の本です。",
        reading: "これは にほんごの ほんです。",
        meaning: "这是日语书。"
      }
    ],
    similarGrammar: ["〜だ", "〜である"],
    notes: "注意普通体是「だ」。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000207",
    slug: "n5-masenka",
    grammarPoint: "〜ませんか",
    jlptLevel: "N5",
    meaning: "表示礼貌邀请。",
    formation: "Verb ます-stem + ませんか",
    explanation: "常用于邀请对方一起做某事，比直接命令更自然。",
    examples: [
      {
        japanese: "一緒に図書館へ行きませんか。",
        reading: "いっしょに としょかんへ いきませんか。",
        meaning: "要不要一起去图书馆？"
      }
    ],
    similarGrammar: ["〜ましょう", "〜ません"],
    notes: "回答时可用「いいですね」「すみません、ちょっと」。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000201",
    slug: "n4-te-shimau",
    grammarPoint: "〜てしまう",
    jlptLevel: "N4",
    meaning: "表示完成、遗憾或不小心做了某事。",
    formation: "Verb て-form + しまう",
    explanation: "根据语境可表示动作完成，也可带有后悔、遗憾的语气。口语中常变为「ちゃう / じゃう」。",
    examples: [
      {
        japanese: "宿題を忘れてしまいました。",
        reading: "しゅくだいを わすれてしまいました。",
        meaning: "我不小心忘记作业了。"
      }
    ],
    similarGrammar: ["〜ておく", "〜てある"],
    notes: "不要把所有「てしまう」都理解成负面。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000208",
    slug: "n4-yotei-da",
    grammarPoint: "〜予定だ",
    jlptLevel: "N4",
    meaning: "表示已经安排好的计划。",
    formation: "Verb dictionary-form / Noun + の + 予定だ",
    explanation: "用于说明日程、旅行、会议、学习计划等。",
    examples: [
      {
        japanese: "来週、京都へ行く予定です。",
        reading: "らいしゅう、きょうとへ いく よていです。",
        meaning: "下周计划去京都。"
      }
    ],
    similarGrammar: ["〜つもりだ", "〜ことになっている"],
    notes: "比单纯的「つもり」更偏客观安排。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    slug: "n3-youni-suru",
    grammarPoint: "〜ようにする",
    jlptLevel: "N3",
    meaning: "表示努力养成或避免某种习惯。",
    formation: "Verb dictionary-form / Verb ない-form + ようにする",
    explanation: "强调有意识地持续做某事，常用于学习、生活习惯和自我管理。",
    examples: [
      {
        japanese: "毎日日本語を聞くようにしています。",
        reading: "まいにち にほんごを きくようにしています。",
        meaning: "我尽量每天听日语。"
      }
    ],
    similarGrammar: ["〜ようになる", "〜ことにする"],
    notes: "「〜ようになる」强调变化结果，「〜ようにする」强调人为努力。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    slug: "n3-bakari",
    grammarPoint: "〜ばかり",
    jlptLevel: "N3",
    meaning: "表示刚刚完成，或只做某事。",
    formation: "Verb た-form + ばかり / Noun + ばかり",
    explanation: "「Vたばかり」表示刚做完；「Nばかり」可表示偏向、过多。",
    examples: [
      {
        japanese: "買ったばかりの本を読みました。",
        reading: "かったばかりの ほんを よみました。",
        meaning: "读了刚买的书。"
      }
    ],
    similarGrammar: ["〜ところ", "〜だけ"],
    notes: "注意和「〜ところ」的语感差异。",
    accessTier: "free"
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    slug: "n2-wake-dewa-nai",
    grammarPoint: "〜わけではない",
    jlptLevel: "N2",
    meaning: "表示并非完全如此。",
    formation: "Plain form + わけではない",
    explanation: "用于缓和否定，说明不是百分之百成立。",
    examples: [
      {
        japanese: "日本語が嫌いなわけではありません。",
        reading: "にほんごが きらいな わけではありません。",
        meaning: "并不是讨厌日语。",
        note: "PRO 例句"
      }
    ],
    similarGrammar: ["〜とは限らない", "〜わけがない"],
    notes: "常与「全部」「必ずしも」等搭配。",
    accessTier: "pro"
  },
  {
    id: "00000000-0000-0000-0000-000000000209",
    slug: "n2-ni-shitagatte",
    grammarPoint: "〜にしたがって",
    jlptLevel: "N2",
    meaning: "表示随着前项变化，后项也随之变化。",
    formation: "Noun / Verb dictionary-form + にしたがって",
    explanation: "用于说明比例变化、阶段变化或趋势。书面语和正式说明中常见。",
    examples: [
      {
        japanese: "経験を積むにしたがって、自信がついてきました。",
        reading: "けいけんを つむにしたがって、じしんが ついてきました。",
        meaning: "随着经验积累，我逐渐有了自信。",
        note: "PRO 例句"
      }
    ],
    similarGrammar: ["〜につれて", "〜とともに"],
    notes: "与「〜につれて」接近，但更正式。",
    accessTier: "pro"
  },
  {
    id: "00000000-0000-0000-0000-000000000205",
    slug: "n1-ni-chigainai",
    grammarPoint: "〜に違いない",
    jlptLevel: "N1",
    meaning: "表示说话人强烈推测。",
    formation: "Plain form + に違いない",
    explanation: "用于根据证据作出较有把握的判断，可用于书面和正式表达。",
    examples: [
      {
        japanese: "彼はもう事情を知っているに違いありません。",
        reading: "かれは もう じじょうを しっているに ちがいありません。",
        meaning: "他一定已经知道情况了。",
        note: "PRO 例句"
      }
    ],
    similarGrammar: ["〜に相違ない", "〜はずだ"],
    notes: "比「〜だろう」更确信。",
    accessTier: "pro"
  },
  {
    id: "00000000-0000-0000-0000-000000000210",
    slug: "n1-to-iedomo",
    grammarPoint: "〜といえども",
    jlptLevel: "N1",
    meaning: "即使是……也……。",
    formation: "Noun / Plain form + といえども",
    explanation: "用于正式或书面语，承认前项身份、条件或事实，但后项仍不例外。",
    examples: [
      {
        japanese: "専門家といえども、間違えることはあります。",
        reading: "せんもんかといえども、まちがえることは あります。",
        meaning: "即使是专家，也会有出错的时候。",
        note: "PRO 例句"
      }
    ],
    similarGrammar: ["〜とはいえ", "〜であっても"],
    notes: "比「〜でも」更正式。",
    accessTier: "pro"
  }
];

export function buildGrammarPracticeChoices(entry: Pick<GrammarEntry, "meaning" | "jlptLevel">) {
  const pool = grammarEntries
    .filter((item) => item.meaning !== entry.meaning && item.jlptLevel === entry.jlptLevel)
    .map((item) => item.meaning);
  const fallback = grammarEntries.filter((item) => item.meaning !== entry.meaning).map((item) => item.meaning);

  return Array.from(new Set([entry.meaning, ...pool, ...fallback])).slice(0, 4).sort((a, b) => a.localeCompare(b, "zh-CN"));
}
