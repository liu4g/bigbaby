export const levels = ["N5", "N4", "N3", "N2", "N1"] as const;

export type Level = (typeof levels)[number];
export type LevelFilter = "all" | Level;

export const levelFilters: LevelFilter[] = ["all", ...levels];

export const appNav = [
  { href: "/dashboard", label: "首页", icon: "layout-dashboard" },
  { href: "/vocabulary", label: "单词", icon: "book-open" },
  { href: "/grammar", label: "语法", icon: "sigma" },
  { href: "/reading", label: "文章", icon: "newspaper" },
  { href: "/practice", label: "练习", icon: "pen-tool" },
  { href: "/jlpt", label: "JLPT", icon: "trophy" },
  { href: "/progress", label: "学习记录", icon: "chart-column" },
  { href: "/profile", label: "个人中心", icon: "user-round" }
] as const;

export const landingHighlights = [
  {
    title: "覆盖 N5 到 N1",
    description: "内容按 JLPT 等级组织，学习路径清晰，适合从入门到备考进阶。"
  },
  {
    title: "原创练习体系",
    description: "使用 JLPT 风格原创题，避免未经授权的官方真题版权风险。"
  },
  {
    title: "进度可视化",
    description: "学习记录、连续天数、复习节奏和目标等级集中展示。"
  },
  {
    title: "为 PRO 预留增长",
    description: "会员、错题本、复习计划和后续 AI 功能都能持续接入。"
  }
] as const;

export function isLevel(value: string | undefined): value is Level {
  return !!value && (levels as readonly string[]).includes(value);
}

export function normalizeLevelFilter(value: string | string[] | undefined): LevelFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return isLevel(candidate) ? candidate : "all";
}

export function buildLevelFilterItems(basePath: string, active: LevelFilter) {
  return levelFilters.map((level) => ({
    label: level === "all" ? "全部" : level,
    href: level === "all" ? basePath : `${basePath}?level=${level}`,
    active: active === level
  }));
}

export function levelTone(level: Level) {
  switch (level) {
    case "N5":
      return "success";
    case "N4":
      return "primary";
    case "N3":
      return "accent";
    case "N2":
      return "warning";
    case "N1":
      return "destructive";
  }
}
