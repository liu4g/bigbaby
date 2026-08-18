import type { Level } from "@/lib/site";

export type JlptSectionKind = "vocabulary" | "grammar" | "reading" | "listening";
export type JlptQuestionType = "single_choice" | "multiple_choice" | "fill_blank";
export type JlptAccessTier = "free" | "pro";
export type JlptDeliveryType = "file_upload" | "external_link";
export type JlptResourceStatus = "available" | "coming_soon" | "draft";

export type JlptOption = {
  id: string;
  label: string;
  text: string;
};

export type JlptQuestion = {
  id: string;
  questionType: JlptQuestionType;
  prompt: string;
  passage?: string;
  audioPrompt?: string;
  options: JlptOption[];
  correctOptionIds?: string[];
  correctTexts?: string[];
  explanation: string;
  points: number;
  difficulty: number;
  skillTags: string[];
};

export type JlptSection = {
  id: string;
  kind: JlptSectionKind;
  title: string;
  description: string;
  durationSeconds: number;
  questions: JlptQuestion[];
};

export type JlptExam = {
  id: string;
  slug: string;
  level: Level;
  title: string;
  description: string;
  accessTier: JlptAccessTier;
  isOriginal: boolean;
  durationSeconds: number;
  totalScore: number;
  sections: JlptSection[];
};

export type JlptExamWithState = JlptExam & {
  canAccess: boolean;
  isLocked: boolean;
  bestScore: number;
  lastAttemptAt: string | null;
};

export type JlptPublicQuestion = Omit<JlptQuestion, "correctOptionIds" | "correctTexts">;
export type JlptPublicSection = Omit<JlptSection, "questions"> & {
  questions: JlptPublicQuestion[];
};
export type JlptPublicExam = Omit<JlptExamWithState, "sections"> & {
  sections: JlptPublicSection[];
};

export type JlptLevelTrack = {
  level: Level;
  title: string;
  description: string;
  modules: Array<{
    kind: JlptSectionKind | "mock_exam";
    title: string;
    description: string;
  }>;
};

export type JlptDownloadResource = {
  id: string;
  slug: string;
  level: Level;
  title: string;
  description: string;
  accessTier: JlptAccessTier;
  deliveryTypes: JlptDeliveryType[];
  priceCents: number | null;
  currency: "CNY";
  status: JlptResourceStatus;
  licenseStatus: "requires_authorization" | "authorized";
};

export const jlptSectionLabels: Record<JlptSectionKind, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening"
};

export const jlptSectionZhLabels: Record<JlptSectionKind, string> = {
  vocabulary: "文字词汇",
  grammar: "文法",
  reading: "阅读",
  listening: "听力"
};

export const jlptLevels: JlptLevelTrack[] = [
  {
    level: "N5",
    title: "JLPT N5 基础起步",
    description: "适合刚进入考试体系的学习者，重点是基础词汇、基本句型和短句理解。",
    modules: [
      { kind: "vocabulary", title: "Vocabulary", description: "假名、基础名词、动词和日常表达。" },
      { kind: "grammar", title: "Grammar", description: "です、ます、助词和基础句型。" },
      { kind: "reading", title: "Reading", description: "短通知、日常对话和简单说明文。" },
      { kind: "listening", title: "Listening", description: "生活场景中的短问答。" },
      { kind: "mock_exam", title: "Mock Exam", description: "原创 N5 模拟考试。" }
    ]
  },
  {
    level: "N4",
    title: "JLPT N4 基础巩固",
    description: "从日常表达进入更完整的语境，强化动词变化、基础阅读和听力场景。",
    modules: [
      { kind: "vocabulary", title: "Vocabulary", description: "常见动词、形容词和生活主题词汇。" },
      { kind: "grammar", title: "Grammar", description: "て形、ない形、意向和请求表达。" },
      { kind: "reading", title: "Reading", description: "邮件、通知和短篇说明文。" },
      { kind: "listening", title: "Listening", description: "学校、商店、交通等场景。" },
      { kind: "mock_exam", title: "Mock Exam", description: "原创 N4 模拟考试。" }
    ]
  },
  {
    level: "N3",
    title: "JLPT N3 中级核心",
    description: "连接基础和高级内容，训练句型辨析、段落理解和信息整合。",
    modules: [
      { kind: "vocabulary", title: "Vocabulary", description: "抽象词、复合动词和同义辨析。" },
      { kind: "grammar", title: "Grammar", description: "中级接续、目的、原因、让步和变化表达。" },
      { kind: "reading", title: "Reading", description: "短文主旨、细节定位和作者意图。" },
      { kind: "listening", title: "Listening", description: "任务选择、原因判断和会话理解。" },
      { kind: "mock_exam", title: "Mock Exam", description: "原创 N3 模拟考试。" }
    ]
  },
  {
    level: "N2",
    title: "JLPT N2 进阶挑战",
    description: "面向高阶阅读和复杂语法，训练更长文本和商务、社会话题。",
    modules: [
      { kind: "vocabulary", title: "Vocabulary", description: "正式表达、书面词和语义细分。" },
      { kind: "grammar", title: "Grammar", description: "高级句型、逻辑连接和语气控制。" },
      { kind: "reading", title: "Reading", description: "评论、说明文和长段落结构。" },
      { kind: "listening", title: "Listening", description: "综合理解、即时判断和重点捕捉。" },
      { kind: "mock_exam", title: "Mock Exam", description: "原创 N2 模拟考试。" }
    ]
  },
  {
    level: "N1",
    title: "JLPT N1 高阶冲刺",
    description: "强化复杂文本、正式语汇、抽象论述和考试节奏。",
    modules: [
      { kind: "vocabulary", title: "Vocabulary", description: "高级书面词、搭配和语域判断。" },
      { kind: "grammar", title: "Grammar", description: "让步、强调、限定、推量和文体差异。" },
      { kind: "reading", title: "Reading", description: "长文结构、观点推断和抽象主题。" },
      { kind: "listening", title: "Listening", description: "即时综合、语气判断和谈话目的。" },
      { kind: "mock_exam", title: "Mock Exam", description: "原创 N1 模拟考试。" }
    ]
  }
];

export const jlptExams: JlptExam[] = [
  createExam({
    id: "10000000-0000-0000-0000-000000000501",
    slug: "n5-mock-exam-01",
    level: "N5",
    title: "N5 Mock Exam 01",
    description: "基础词汇、句型、短阅读和生活听力的轻量原创模拟考试。",
    accessTier: "free",
    totalScore: 100,
    durationSeconds: 20 * 60,
    questions: {
      vocabulary: {
        prompt: "「あした」の意味として正しいものはどれですか。",
        options: ["今天", "明天", "昨天", "早上"],
        correct: [1],
        explanation: "「あした」表示明天。",
        tags: ["基础时间词", "假名词汇"]
      },
      grammar: {
        prompt: "文を完成させてください。これは日本語の本＿＿。",
        options: ["です", "ます", "ました", "ません"],
        correct: [0],
        explanation: "名词句的礼貌判断用「です」。",
        tags: ["です", "名词句"]
      },
      reading: {
        passage: "田中さんは毎朝七時に起きます。朝ごはんを食べて、八時に学校へ行きます。",
        prompt: "田中さんは何時に学校へ行きますか。",
        options: ["七時", "八時", "九時", "十時"],
        correct: [1],
        explanation: "文中写着「八時に学校へ行きます」。",
        tags: ["时间定位", "短文细节"]
      },
      listening: {
        audioPrompt: "女の人は駅で友だちに会います。二人はカフェへ行きます。",
        prompt: "二人はどこへ行きますか。",
        options: ["学校", "駅", "カフェ", "図書館"],
        correct: [2],
        explanation: "听力文本中说两个人去咖啡店。",
        tags: ["地点判断", "生活场景"]
      }
    }
  }),
  createExam({
    id: "10000000-0000-0000-0000-000000000502",
    slug: "n4-mock-exam-01",
    level: "N4",
    title: "N4 Mock Exam 01",
    description: "围绕日程、请求、短文信息和听力任务的原创模拟考试。",
    accessTier: "free",
    totalScore: 100,
    durationSeconds: 24 * 60,
    questions: {
      vocabulary: {
        prompt: "「手伝う」の意味として正しいものはどれですか。",
        options: ["帮助", "忘记", "选择", "迟到"],
        correct: [0],
        explanation: "「手伝う」表示帮助、帮忙。",
        tags: ["常用动词", "生活表达"]
      },
      grammar: {
        prompt: "文を完成させてください。雨が降っていますから、傘を＿＿ください。",
        options: ["持って", "持つ", "持った", "持たない"],
        correct: [0],
        explanation: "请求对方做某事时用「てください」。",
        tags: ["て形", "请求表达"]
      },
      reading: {
        passage: "明日の会議は午後二時から三階の部屋で行います。資料は受付で受け取ってください。",
        prompt: "資料はどこで受け取りますか。",
        options: ["三階の部屋", "受付", "駅", "食堂"],
        correct: [1],
        explanation: "文中写着「資料は受付で受け取ってください」。",
        tags: ["通知阅读", "地点定位"]
      },
      listening: {
        audioPrompt: "男の人は午後、郵便局へ行ってからスーパーで牛乳を買います。",
        prompt: "男の人はスーパーで何を買いますか。",
        options: ["切手", "牛乳", "本", "傘"],
        correct: [1],
        explanation: "听力文本中说在超市买牛奶。",
        tags: ["任务顺序", "物品判断"]
      }
    }
  }),
  createExam({
    id: "10000000-0000-0000-0000-000000000503",
    slug: "n3-mock-exam-01",
    level: "N3",
    title: "N3 Mock Exam 01",
    description: "训练中级语法辨析、段落理解和会话重点的原创模拟考试。",
    accessTier: "free",
    totalScore: 100,
    durationSeconds: 28 * 60,
    questions: {
      vocabulary: {
        prompt: "「把握する」の意味として最も近いものはどれですか。",
        options: ["休息する", "正しく理解する", "予約する", "急に変える"],
        correct: [1],
        explanation: "「把握する」表示掌握、正确理解整体情况。",
        tags: ["抽象动词", "语义辨析"]
      },
      grammar: {
        prompt: "文を完成させてください。毎日日本語を聞く＿＿しています。",
        options: ["ばかり", "ために", "ように", "わけで"],
        correct: [2],
        explanation: "「ようにする」表示努力养成某种习惯。",
        tags: ["ようにする", "习惯表达"]
      },
      reading: {
        passage: "新しい職場に慣れるには時間がかかる。しかし、分からないことを早めに質問すれば、不安は少しずつ減っていく。",
        prompt: "筆者がすすめていることは何ですか。",
        options: ["分からないことを質問する", "すぐに仕事を辞める", "一人で全部決める", "不安を隠す"],
        correct: [0],
        explanation: "文章建议遇到不懂的事情尽早提问。",
        tags: ["主旨判断", "建议表达"]
      },
      listening: {
        audioPrompt: "女の人は資料をコピーしたあと、会議室の机に置いておくように頼まれました。",
        prompt: "女の人は資料をどうしますか。",
        options: ["家へ持って帰る", "会議室に置く", "駅で渡す", "捨てる"],
        correct: [1],
        explanation: "任务是复印后把资料放在会议室桌上。",
        tags: ["任务听取", "动作顺序"]
      }
    }
  }),
  createExam({
    id: "10000000-0000-0000-0000-000000000504",
    slug: "n2-mock-exam-01",
    level: "N2",
    title: "N2 Mock Exam 01",
    description: "包含 Vocabulary、Grammar、Reading、Listening 的原创 N2 风格模拟考试。",
    accessTier: "pro",
    totalScore: 100,
    durationSeconds: 35 * 60,
    questions: {
      vocabulary: {
        prompt: "「削減」の使い方として最も自然なものはどれですか。",
        options: ["時間を削減する", "花を削減する", "駅を削減する", "友だちを削減する"],
        correct: [0],
        explanation: "「削減」常用于成本、时间、人力等可量化资源的减少。",
        tags: ["正式词汇", "搭配判断"]
      },
      grammar: {
        prompt: "文を完成させてください。経験を積む＿＿、自信がついてきました。",
        options: ["にしたがって", "に対して", "をめぐって", "からすると"],
        correct: [0],
        explanation: "「にしたがって」表示随着前项变化，后项也随之变化。",
        tags: ["变化关系", "N2 语法"]
      },
      reading: {
        passage:
          "働き方が多様になるにつれて、会社には一人ひとりの事情に合わせた制度が求められている。ただし、制度を作るだけでは十分ではない。利用しやすい雰囲気を整えることも重要である。",
        prompt: "筆者の考えに合っているものはどれですか。",
        options: ["制度だけで問題は解決する", "利用しやすい環境も必要だ", "働き方は一つに戻すべきだ", "個人の事情は考えなくてよい"],
        correct: [1],
        explanation: "文章末尾で制度だけでなく利用しやすい雰囲気も重要だと述べています。",
        tags: ["观点判断", "长文结构"]
      },
      listening: {
        audioPrompt:
          "会議では新しい広告案について話し合っています。男の人は費用を抑えられる点を評価していますが、対象者がはっきりしていない点を心配しています。",
        prompt: "男の人は何を心配していますか。",
        options: ["費用が高すぎること", "対象者が明確でないこと", "広告の色が多いこと", "会議の時間が短いこと"],
        correct: [1],
        explanation: "男性は対象者がはっきりしていない点を心配しています。",
        tags: ["要点把握", "商务场景"]
      }
    }
  }),
  createExam({
    id: "10000000-0000-0000-0000-000000000505",
    slug: "n1-mock-exam-01",
    level: "N1",
    title: "N1 Mock Exam 01",
    description: "高阶书面语、抽象阅读和综合听力的原创 N1 风格模拟考试。",
    accessTier: "pro",
    totalScore: 100,
    durationSeconds: 40 * 60,
    questions: {
      vocabulary: {
        prompt: "「反論」の使い方として最も自然なものはどれですか。",
        options: ["意見に反論する", "駅に反論する", "朝食を反論する", "荷物で反論する"],
        correct: [0],
        explanation: "「反論する」は观点、意见、主张などに対して用います。",
        tags: ["高级名词", "搭配判断"]
      },
      grammar: {
        prompt: "文を完成させてください。専門家＿＿、間違えることはあります。",
        options: ["といえども", "にすぎない", "を皮切りに", "ばかりに"],
        correct: [0],
        explanation: "「といえども」表示即使是某身份或条件，也不例外。",
        tags: ["让步表达", "书面语"]
      },
      reading: {
        passage:
          "情報が瞬時に共有される時代において、速さは大きな価値を持つ。しかし、速さだけを優先すれば、確認の不足によって誤解が広がる危険もある。必要なのは、速く伝える技術と、立ち止まって確かめる姿勢の両立である。",
        prompt: "筆者が最も言いたいことは何ですか。",
        options: ["情報は遅いほどよい", "速さと確認の両方が重要だ", "技術は使わないほうがよい", "誤解は自然に消える"],
        correct: [1],
        explanation: "最終文で速く伝える技術と確認する姿勢の両立が必要だと述べています。",
        tags: ["抽象主旨", "对比结构"]
      },
      listening: {
        audioPrompt:
          "講演者は、便利な道具ほど使い方を考える必要があると述べています。道具そのものより、使う人の判断が結果を左右するという見解です。",
        prompt: "講演者の見解に合うものはどれですか。",
        options: ["道具は便利なら何でもよい", "使う人の判断が重要だ", "便利な道具は避けるべきだ", "結果は道具だけで決まる"],
        correct: [1],
        explanation: "講演者は使う人の判断が結果を左右すると述べています。",
        tags: ["观点听取", "抽象论述"]
      }
    }
  })
];

export const jlptDownloadResources: JlptDownloadResource[] = [
  {
    id: "10000000-0000-0000-0000-000000000701",
    slug: "n5-authorized-past-paper-resource",
    level: "N5",
    title: "N5 授权真题资料入口",
    description: "管理员可上传已获授权的 PDF 文件，或配置官方/授权方允许分发的外部链接。",
    accessTier: "free",
    deliveryTypes: ["file_upload", "external_link"],
    priceCents: 0,
    currency: "CNY",
    status: "coming_soon",
    licenseStatus: "requires_authorization"
  },
  {
    id: "10000000-0000-0000-0000-000000000702",
    slug: "n3-authorized-past-paper-resource",
    level: "N3",
    title: "N3 授权真题资料入口",
    description: "支持管理员设置价格、上传文件或贴出网盘链接；未审核授权前不会开放下载。",
    accessTier: "free",
    deliveryTypes: ["file_upload", "external_link"],
    priceCents: 900,
    currency: "CNY",
    status: "coming_soon",
    licenseStatus: "requires_authorization"
  },
  {
    id: "10000000-0000-0000-0000-000000000703",
    slug: "n2-authorized-past-paper-resource",
    level: "N2",
    title: "N2 授权真题资料入口",
    description: "未来可作为单独购买资源包；当前仅保留入口和管理字段，不提供未授权文件。",
    accessTier: "pro",
    deliveryTypes: ["file_upload", "external_link"],
    priceCents: 2900,
    currency: "CNY",
    status: "coming_soon",
    licenseStatus: "requires_authorization"
  },
  {
    id: "10000000-0000-0000-0000-000000000704",
    slug: "n1-authorized-past-paper-resource",
    level: "N1",
    title: "N1 授权真题资料入口",
    description: "管理员审核授权后，可配置文件下载或外部网盘链接，并设置单独售价。",
    accessTier: "pro",
    deliveryTypes: ["file_upload", "external_link"],
    priceCents: 3900,
    currency: "CNY",
    status: "coming_soon",
    licenseStatus: "requires_authorization"
  }
];

function createExam(input: {
  id: string;
  slug: string;
  level: Level;
  title: string;
  description: string;
  accessTier: JlptAccessTier;
  totalScore: number;
  durationSeconds: number;
  questions: Record<JlptSectionKind, {
    prompt: string;
    passage?: string;
    audioPrompt?: string;
    options: string[];
    correct: number[];
    explanation: string;
    tags: string[];
  }>;
}): JlptExam {
  const sectionKinds: JlptSectionKind[] = ["vocabulary", "grammar", "reading", "listening"];
  const points = Math.round(input.totalScore / sectionKinds.length);

  return {
    id: input.id,
    slug: input.slug,
    level: input.level,
    title: input.title,
    description: input.description,
    accessTier: input.accessTier,
    isOriginal: true,
    durationSeconds: input.durationSeconds,
    totalScore: input.totalScore,
    sections: sectionKinds.map((kind, sectionIndex) => {
      const source = input.questions[kind];
      const questionId = `${input.id.slice(0, 24)}${String(sectionIndex + 1).padStart(12, "0")}`;

      return {
        id: `${input.id}-section-${kind}`,
        kind,
        title: jlptSectionLabels[kind],
        description: jlptSectionZhLabels[kind],
        durationSeconds: Math.round(input.durationSeconds / sectionKinds.length),
        questions: [
          {
            id: questionId,
            questionType: "single_choice",
            prompt: source.prompt,
            passage: source.passage,
            audioPrompt: source.audioPrompt,
            options: source.options.map((text, optionIndex) => ({
              id: `${questionId}-${String.fromCharCode(65 + optionIndex)}`,
              label: String.fromCharCode(65 + optionIndex),
              text
            })),
            correctOptionIds: source.correct.map((optionIndex) => `${questionId}-${String.fromCharCode(65 + optionIndex)}`),
            explanation: source.explanation,
            points,
            difficulty: input.level === "N1" ? 5 : input.level === "N2" ? 4 : input.level === "N3" ? 3 : 2,
            skillTags: source.tags
          }
        ]
      };
    })
  };
}
