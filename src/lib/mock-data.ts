import type { Level } from "@/lib/site";

export type StudyItem = {
  title: string;
  type: string;
  level: Level;
  time: string;
  progress: number;
  href: string;
  locked?: boolean;
};

export const dashboardStats = {
  todayTarget: 35,
  todayDone: 24,
  streak: 18,
  completion: 68,
  jlptTarget: "N2",
  activeLevel: "N3" as Level,
  weeklyMinutes: [18, 26, 12, 34, 28, 40, 24]
};

export const dashboardQuickStart: StudyItem[] = [
  {
    title: "继续 N3 语法「〜ようにする」",
    type: "语法",
    level: "N3",
    time: "10 分钟前",
    progress: 72,
    href: "/grammar?level=N3"
  },
  {
    title: "复习 20 个 N3 高频单词",
    type: "单词",
    level: "N3",
    time: "今天",
    progress: 58,
    href: "/vocabulary?level=N3"
  },
  {
    title: "阅读一篇 N4 短文章",
    type: "文章",
    level: "N4",
    time: "推荐",
    progress: 18,
    href: "/reading?level=N4"
  }
];

export const dashboardRecommendations: StudyItem[] = [
  {
    title: "N3 高频词：把握する / 慣れる / 予定",
    type: "单词",
    level: "N3",
    time: "适合 5 分钟",
    progress: 46,
    href: "/vocabulary?level=N3"
  },
  {
    title: "语法辨析：〜てしまう / 〜ようにする",
    type: "语法",
    level: "N3",
    time: "适合 8 分钟",
    progress: 62,
    href: "/grammar?level=N3"
  },
  {
    title: "N4 阅读：日本便利店文化",
    type: "文章",
    level: "N4",
    time: "适合 10 分钟",
    progress: 27,
    href: "/reading?level=N4"
  }
];

export const recentStudy = [
  {
    title: "N3 语法：〜ばかり",
    detail: "已完成 8 题，正确率 88%",
    time: "今天 08:20"
  },
  {
    title: "N3 单词：学习计划",
    detail: "完成 20 个词条复习",
    time: "昨天 21:40"
  },
  {
    title: "N4 阅读：短篇文章",
    detail: "阅读并标记 4 个重点词汇",
    time: "昨天 19:05"
  }
];

export const vocabularyItems = [
  {
    word: "勉強する",
    kana: "べんきょうする",
    meaning: "学习",
    example: "毎日30分勉強します。",
    level: "N5" as Level,
    progress: 92,
    locked: false
  },
  {
    word: "予定",
    kana: "よてい",
    meaning: "计划；安排",
    example: "明日の予定を確認します。",
    level: "N4" as Level,
    progress: 74,
    locked: false
  },
  {
    word: "把握する",
    kana: "はあくする",
    meaning: "掌握；理解",
    example: "状況を正しく把握する。",
    level: "N3" as Level,
    progress: 58,
    locked: false
  },
  {
    word: "慣れる",
    kana: "なれる",
    meaning: "习惯；适应",
    example: "新しい環境に慣れる。",
    level: "N3" as Level,
    progress: 61,
    locked: false
  },
  {
    word: "申し込む",
    kana: "もうしこむ",
    meaning: "申请；报名",
    example: "講座に申し込む。",
    level: "N2" as Level,
    progress: 24,
    locked: true
  },
  {
    word: "見解",
    kana: "けんかい",
    meaning: "见解；观点",
    example: "先生の見解を聞く。",
    level: "N1" as Level,
    progress: 12,
    locked: true
  }
] as const;

export const grammarPoints = [
  {
    title: "〜てしまう",
    pattern: "Vて + しまう",
    meaning: "表示完成、遗憾或不小心",
    example: "宿題を忘れてしまった。",
    level: "N4" as Level,
    progress: 83,
    locked: false
  },
  {
    title: "〜ようにする",
    pattern: "V辞書形 / Vない + ようにする",
    meaning: "尽量、努力去做",
    example: "毎日日本語を聞くようにする。",
    level: "N3" as Level,
    progress: 66,
    locked: false
  },
  {
    title: "〜ばかり",
    pattern: "Vた + ばかり",
    meaning: "刚刚……、只……",
    example: "買ったばかりの本。",
    level: "N3" as Level,
    progress: 51,
    locked: false
  },
  {
    title: "〜わけではない",
    pattern: "普通形 + わけではない",
    meaning: "并非全部……；并不是说……",
    example: "忙しいわけではない。",
    level: "N2" as Level,
    progress: 29,
    locked: true
  },
  {
    title: "〜に違いない",
    pattern: "普通形 + に違いない",
    meaning: "一定是、准是",
    example: "彼はもう知っているに違いない。",
    level: "N1" as Level,
    progress: 15,
    locked: true
  }
] as const;

export const readingArticles = [
  {
    title: "日本のコンビニ文化",
    summary: "从便利店服务到日常消费场景，练习 N4 阅读理解。",
    level: "N4" as Level,
    readTime: "6 分钟",
    words: "520 词",
    progress: 64,
    locked: false
  },
  {
    title: "朝の学習ルーティン",
    summary: "用简短叙事提升 N5-N3 的阅读流畅度。",
    level: "N5" as Level,
    readTime: "4 分钟",
    words: "280 词",
    progress: 89,
    locked: false
  },
  {
    title: "面接前の準備",
    summary: "面试前的准备流程，适合 N3 学习者。",
    level: "N3" as Level,
    readTime: "7 分钟",
    words: "610 词",
    progress: 48,
    locked: false
  },
  {
    title: "職場での調整と合意形成",
    summary: "N2 深度阅读：商务场景中的表达与语气。",
    level: "N2" as Level,
    readTime: "9 分钟",
    words: "760 词",
    progress: 22,
    locked: true
  }
] as const;

export const practiceSets = [
  {
    title: "N5 词汇热身",
    description: "10 题快速选择，巩固基础高频词。",
    level: "N5" as Level,
    questions: 10,
    minutes: 5,
    progress: 100,
    locked: false
  },
  {
    title: "N3 语法综合练习",
    description: "选择题 + 填空题，训练句型辨析。",
    level: "N3" as Level,
    questions: 15,
    minutes: 8,
    progress: 76,
    locked: false
  },
  {
    title: "N2 阅读理解训练",
    description: "原创长篇阅读，模拟考试节奏。",
    level: "N2" as Level,
    questions: 12,
    minutes: 12,
    progress: 33,
    locked: true
  },
  {
    title: "JLPT 原创模拟卷",
    description: "按等级组卷的原创模考内容。",
    level: "N1" as Level,
    questions: 40,
    minutes: 50,
    progress: 12,
    locked: true
  }
] as const;

export const jlptTracks = [
  {
    level: "N5" as Level,
    title: "JLPT N5 基础起步",
    description: "词汇、语法、短文和基础练习。",
    modules: ["单词", "语法", "文章", "基础练习"],
    locked: false
  },
  {
    level: "N3" as Level,
    title: "JLPT N3 核心强化",
    description: "适合从基础过渡到中级的学习者。",
    modules: ["高频词", "语法辨析", "阅读理解", "综合练习"],
    locked: false
  },
  {
    level: "N2" as Level,
    title: "JLPT N2 进阶挑战",
    description: "原创题型、长文阅读与高强度训练。",
    modules: ["原创模考", "错题本", "复习计划", "专项训练"],
    locked: true
  },
  {
    level: "N1" as Level,
    title: "JLPT N1 高阶冲刺",
    description: "面向高阶学习者的深度内容。",
    modules: ["高级语法", "高阶阅读", "模拟考试", "复盘"],
    locked: true
  }
] as const;

export const progressSummary = {
  masteredWords: 426,
  masteredGrammar: 132,
  readArticles: 58,
  practiceAccuracy: 87,
  reviewDue: 18,
  masteryByModule: [
    { label: "单词", value: 82 },
    { label: "语法", value: 74 },
    { label: "阅读", value: 68 },
    { label: "练习", value: 81 }
  ]
};

export const profileSummary = {
  name: "Yuki Chen",
  email: "yuki@example.com",
  plan: "FREE",
  target: "JLPT N2",
  joinedAt: "2026-05-18",
  studyStyle: ["每日 30 分钟", "单词优先", "晚间复习"],
  bookmarks: 24
};
