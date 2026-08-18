import type { Level } from "@/lib/site";

export type PracticeKind = "vocabulary" | "grammar" | "reading" | "mixed" | "jlpt_mock";
export type QuestionType = "single_choice" | "multiple_choice" | "fill_blank" | "reading_comprehension" | "text_input";
export type PracticeAccessTier = "free" | "pro";

export type PracticeOption = {
  id: string;
  label: string;
  text: string;
  explanation?: string;
};

export type PracticeQuestion = {
  id: string;
  questionType: QuestionType;
  question: string;
  passage?: string;
  hint?: string;
  explanation: string;
  difficulty: number;
  jlptLevel: Level;
  options: PracticeOption[];
  correctOptionIds?: string[];
  correctTexts?: string[];
  source?: {
    type: "vocabulary" | "grammar" | "article" | "practice";
    title: string;
    href?: string;
  };
  reviewSuggestion: string;
};

export type PracticeSetEntry = {
  id: string;
  slug: string;
  title: string;
  description: string;
  jlptLevel: Level;
  kind: PracticeKind;
  isJlptStyle: boolean;
  accessTier: PracticeAccessTier;
  estimatedMinutes: number;
  questions: PracticeQuestion[];
};

export type PracticeSetWithState = PracticeSetEntry & {
  canAccess: boolean;
  isLocked: boolean;
  wrongCount: number;
  lastPracticedAt: string | null;
  bestAccuracy: number;
};

export type PracticePublicQuestion = Omit<PracticeQuestion, "correctOptionIds" | "correctTexts">;

export type PracticePublicSet = Omit<PracticeSetWithState, "questions"> & {
  questions: PracticePublicQuestion[];
};

export const practiceKindLabels: Record<PracticeKind | "all", string> = {
  all: "全部类型",
  vocabulary: "单词",
  grammar: "语法",
  reading: "阅读",
  mixed: "综合练习",
  jlpt_mock: "JLPT"
};

export const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: "单选",
  multiple_choice: "多选",
  fill_blank: "填空",
  reading_comprehension: "阅读理解",
  text_input: "填空"
};

export const difficultyLabels: Record<number, string> = {
  1: "入门",
  2: "基础",
  3: "标准",
  4: "进阶",
  5: "高阶"
};

export const practiceSets: PracticeSetEntry[] = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    slug: "n5-vocabulary-warmup",
    title: "N5 词汇热身",
    description: "用高频基础词做快速选择和填空，适合每日开场练习。",
    jlptLevel: "N5",
    kind: "vocabulary",
    isJlptStyle: false,
    accessTier: "free",
    estimatedMinutes: 8,
    questions: [
      {
        id: "00000000-0000-0000-0000-000000000501",
        questionType: "single_choice",
        question: "「勉強する」の意味として正しいものはどれですか。",
        explanation: "「勉強する」は学习、用功的意思。",
        difficulty: 1,
        jlptLevel: "N5",
        options: [
          { id: "00000000-0000-0000-0000-000000000601", label: "A", text: "休む" },
          { id: "00000000-0000-0000-0000-000000000602", label: "B", text: "学习", explanation: "勉強する = 学习、用功。" },
          { id: "00000000-0000-0000-0000-000000000603", label: "C", text: "购买" },
          { id: "00000000-0000-0000-0000-000000000604", label: "D", text: "移动" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000602"],
        source: { type: "vocabulary", title: "勉強する", href: "/vocabulary/n5-benkyou-suru" },
        reviewSuggestion: "回到单词详情，重点复习词义和例句搭配。"
      },
      {
        id: "00000000-0000-0000-0000-000000000502",
        questionType: "single_choice",
        question: "「予定」に近い意味はどれですか。",
        explanation: "「予定」は计划、安排的意思。",
        difficulty: 2,
        jlptLevel: "N5",
        options: [
          { id: "00000000-0000-0000-0000-000000000605", label: "A", text: "计划", explanation: "予定 = 计划、安排。" },
          { id: "00000000-0000-0000-0000-000000000606", label: "B", text: "天气" },
          { id: "00000000-0000-0000-0000-000000000607", label: "C", text: "价格" },
          { id: "00000000-0000-0000-0000-000000000608", label: "D", text: "速度" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000605"],
        source: { type: "vocabulary", title: "予定", href: "/vocabulary/n4-yotei" },
        reviewSuggestion: "复习「予定」和时间、计划相关表达。"
      },
      {
        id: "00000000-0000-0000-0000-000000000507",
        questionType: "fill_blank",
        question: "文を完成させてください。朝ごはんを＿＿。",
        hint: "答えは普通形でも丁寧形でもかまいません。",
        explanation: "「食べる / 食べます」は吃的意思，和「朝ごはん」搭配自然。",
        difficulty: 1,
        jlptLevel: "N5",
        options: [],
        correctTexts: ["食べます", "食べる"],
        source: { type: "vocabulary", title: "食べる", href: "/vocabulary/n5-taberu" },
        reviewSuggestion: "复习基础动词和常见宾语搭配。"
      }
    ]
  },
  {
    id: "00000000-0000-0000-0000-000000000405",
    slug: "n4-mixed-basics",
    title: "N4 综合基础练习",
    description: "把词汇、语法和短阅读组合在一套轻量练习里。",
    jlptLevel: "N4",
    kind: "mixed",
    isJlptStyle: false,
    accessTier: "free",
    estimatedMinutes: 10,
    questions: [
      {
        id: "00000000-0000-0000-0000-000000000509",
        questionType: "multiple_choice",
        question: "予定や安排に近い意味で使えるものをすべて選んでください。",
        explanation: "「予定」と「スケジュール」は计划、安排に近い意味で使えます。",
        difficulty: 2,
        jlptLevel: "N4",
        options: [
          { id: "00000000-0000-0000-0000-000000000625", label: "A", text: "予定" },
          { id: "00000000-0000-0000-0000-000000000626", label: "B", text: "天気" },
          { id: "00000000-0000-0000-0000-000000000627", label: "C", text: "スケジュール" },
          { id: "00000000-0000-0000-0000-000000000628", label: "D", text: "値段" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000625", "00000000-0000-0000-0000-000000000627"],
        source: { type: "vocabulary", title: "予定", href: "/vocabulary/n4-yotei" },
        reviewSuggestion: "整理时间安排类名词，注意近义词。"
      },
      {
        id: "00000000-0000-0000-0000-000000000510",
        questionType: "reading_comprehension",
        question: "本文の内容と合っているものはどれですか。",
        passage:
          "来週の発表に向けて、ミカさんは毎日少しずつ資料を確認しています。難しい言葉はノートにまとめ、発表の日までに説明できるように練習しています。",
        explanation: "文章说她每天确认资料、整理难词，并练习到能说明。",
        difficulty: 2,
        jlptLevel: "N4",
        options: [
          { id: "00000000-0000-0000-0000-000000000629", label: "A", text: "ミカさんは発表をやめました。" },
          { id: "00000000-0000-0000-0000-000000000630", label: "B", text: "ミカさんは資料を一度も確認していません。" },
          { id: "00000000-0000-0000-0000-000000000631", label: "C", text: "ミカさんは説明できるように練習しています。" },
          { id: "00000000-0000-0000-0000-000000000632", label: "D", text: "ミカさんは難しい言葉を避けています。" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000631"],
        source: { type: "grammar", title: "〜ようにする", href: "/grammar/n3-youni-suru" },
        reviewSuggestion: "复习短文中动作目的和准备过程的表达。"
      }
    ]
  },
  {
    id: "00000000-0000-0000-0000-000000000402",
    slug: "n3-grammar-mixed",
    title: "N3 语法综合练习",
    description: "围绕常见句型做辨析、填空和语境判断。",
    jlptLevel: "N3",
    kind: "grammar",
    isJlptStyle: false,
    accessTier: "free",
    estimatedMinutes: 12,
    questions: [
      {
        id: "00000000-0000-0000-0000-000000000503",
        questionType: "single_choice",
        question: "文を完成させてください。毎日日本語を聞く＿＿しています。",
        explanation: "「ようにする」表示努力养成或避免某种习惯。",
        difficulty: 3,
        jlptLevel: "N3",
        options: [
          { id: "00000000-0000-0000-0000-000000000609", label: "A", text: "ために" },
          { id: "00000000-0000-0000-0000-000000000610", label: "B", text: "ばかり" },
          { id: "00000000-0000-0000-0000-000000000611", label: "C", text: "ように" },
          { id: "00000000-0000-0000-0000-000000000612", label: "D", text: "わけ" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000611"],
        source: { type: "grammar", title: "〜ようにする", href: "/grammar/n3-youni-suru" },
        reviewSuggestion: "回到语法详情，复习「ようにする」的接续。"
      },
      {
        id: "00000000-0000-0000-0000-000000000504",
        questionType: "single_choice",
        question: "「買ったばかりの本」の意味に近いものはどれですか。",
        explanation: "「Vたばかり」表示刚刚完成某个动作。",
        difficulty: 3,
        jlptLevel: "N3",
        options: [
          { id: "00000000-0000-0000-0000-000000000613", label: "A", text: "很久以前买的书" },
          { id: "00000000-0000-0000-0000-000000000614", label: "B", text: "别人买的书" },
          { id: "00000000-0000-0000-0000-000000000615", label: "C", text: "即将买的书" },
          { id: "00000000-0000-0000-0000-000000000616", label: "D", text: "刚买的书" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000616"],
        source: { type: "grammar", title: "〜ばかり", href: "/grammar/n3-bakari" },
        reviewSuggestion: "复习「たばかり」和「ところ」的语感差异。"
      },
      {
        id: "00000000-0000-0000-0000-000000000508",
        questionType: "fill_blank",
        question: "文を完成させてください。忘れない＿＿、メモしておきます。",
        explanation: "「忘れないように」表示为了避免忘记而采取行动。",
        difficulty: 3,
        jlptLevel: "N3",
        options: [],
        correctTexts: ["ように"],
        source: { type: "grammar", title: "〜ようにする", href: "/grammar/n3-youni-suru" },
        reviewSuggestion: "重点复习「ように」表示目的、目标和习惯的用法。"
      }
    ]
  },
  {
    id: "00000000-0000-0000-0000-000000000403",
    slug: "n2-reading-training",
    title: "N2 阅读理解训练",
    description: "原创短文阅读，训练信息定位、主旨判断和语法线索。",
    jlptLevel: "N2",
    kind: "reading",
    isJlptStyle: true,
    accessTier: "pro",
    estimatedMinutes: 15,
    questions: [
      {
        id: "00000000-0000-0000-0000-000000000505",
        questionType: "reading_comprehension",
        question: "本文によると、面接前に大切なことは何ですか。",
        passage:
          "面接の前には、会社の事業内容だけでなく、自分がその会社で何をしたいのかを整理しておくことが大切です。準備が十分であれば、質問に落ち着いて答えられます。",
        explanation: "短文中明确提到，面试前要整理公司信息以及自己想在公司做什么。",
        difficulty: 4,
        jlptLevel: "N2",
        options: [
          { id: "00000000-0000-0000-0000-000000000617", label: "A", text: "整理公司信息和自己的目标" },
          { id: "00000000-0000-0000-0000-000000000618", label: "B", text: "提前决定早餐内容" },
          { id: "00000000-0000-0000-0000-000000000619", label: "C", text: "把行李寄到公司" },
          { id: "00000000-0000-0000-0000-000000000620", label: "D", text: "取消所有问题准备" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000617"],
        source: { type: "article", title: "面接前の準備" },
        reviewSuggestion: "重读短文，标记原因、目的和结论句。"
      },
      {
        id: "00000000-0000-0000-0000-000000000511",
        questionType: "fill_blank",
        question: "文を完成させてください。経験を積む＿＿、自信がついてきました。",
        explanation: "「にしたがって」表示随着前项变化，后项也发生变化。",
        difficulty: 4,
        jlptLevel: "N2",
        options: [],
        correctTexts: ["にしたがって", "に従って"],
        source: { type: "grammar", title: "〜にしたがって", href: "/grammar/n2-ni-shitagatte" },
        reviewSuggestion: "复习变化关系句型，比较「につれて」「とともに」。"
      }
    ]
  },
  {
    id: "00000000-0000-0000-0000-000000000404",
    slug: "n1-original-mock",
    title: "JLPT N1 原创专项",
    description: "按 JLPT 风格组织的原创高阶词汇和语法练习。",
    jlptLevel: "N1",
    kind: "jlpt_mock",
    isJlptStyle: true,
    accessTier: "pro",
    estimatedMinutes: 18,
    questions: [
      {
        id: "00000000-0000-0000-0000-000000000506",
        questionType: "single_choice",
        question: "「見解」の使い方として最も自然なものはどれですか。",
        explanation: "「見解」は正式场景中表示观点、看法的名词。",
        difficulty: 5,
        jlptLevel: "N1",
        options: [
          { id: "00000000-0000-0000-0000-000000000621", label: "A", text: "予定を見解する" },
          { id: "00000000-0000-0000-0000-000000000622", label: "B", text: "専門家の見解を聞く" },
          { id: "00000000-0000-0000-0000-000000000623", label: "C", text: "見解に申し込む" },
          { id: "00000000-0000-0000-0000-000000000624", label: "D", text: "見解に慣れる" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000622"],
        source: { type: "vocabulary", title: "見解", href: "/vocabulary/n1-kenkai" },
        reviewSuggestion: "复习正式名词和常见搭配。"
      },
      {
        id: "00000000-0000-0000-0000-000000000512",
        questionType: "multiple_choice",
        question: "「といえども」の使い方として自然なものをすべて選んでください。",
        explanation: "「といえども」は即使是某种身份或条件，也不例外。正式语体中常见。",
        difficulty: 5,
        jlptLevel: "N1",
        options: [
          { id: "00000000-0000-0000-0000-000000000633", label: "A", text: "駅といえども、切符を買いました。" },
          { id: "00000000-0000-0000-0000-000000000634", label: "B", text: "専門家といえども、間違えることはあります。" },
          { id: "00000000-0000-0000-0000-000000000635", label: "C", text: "雨といえども、かばんを読みました。" },
          { id: "00000000-0000-0000-0000-000000000636", label: "D", text: "新人といえども、基本的な確認は必要です。" }
        ],
        correctOptionIds: ["00000000-0000-0000-0000-000000000634", "00000000-0000-0000-0000-000000000636"],
        source: { type: "grammar", title: "〜といえども", href: "/grammar/n1-to-iedomo" },
        reviewSuggestion: "复习 N1 让步表达，注意书面语色彩。"
      }
    ]
  }
];
