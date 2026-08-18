import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Level } from "@/lib/site";
import { levels } from "@/lib/site";
import type { UserProfile } from "@/lib/auth";
import { canAccessFeature, type AccountTier } from "@/lib/access-control";

export const dailyTaskTypes = ["vocabulary", "grammar", "reading", "practice", "jlpt", "review"] as const;

export type DailyTaskType = (typeof dailyTaskTypes)[number];
export type DailyTaskStatus = "not_started" | "in_progress" | "completed" | "suspended";

export type DailyStudyTask = {
  id: string;
  taskDate: string;
  taskType: DailyTaskType;
  title: string;
  description: string;
  targetLevel: Level;
  targetCount: number;
  completedCount: number;
  targetMinutes: number;
  completedMinutes: number;
  status: DailyTaskStatus;
  accuracy: number | null;
  href: string;
};

export type WeeklyStudyDay = {
  date: string;
  label: string;
  minutes: number;
  isToday: boolean;
};

export type LearningSessionItem = {
  id: string;
  title: string;
  module: string;
  targetLevel: Level | null;
  startedAt: string;
  durationMinutes: number;
  itemsCompleted: number;
  accuracy: number | null;
};

export type MasteryItem = {
  label: string;
  value: number;
  detail: string;
};

export type LearningMetrics = {
  todayMinutes: number;
  weeklyMinutes: number;
  totalStudyMinutes: number;
  streakDays: number;
  averageAccuracy: number;
  masteredVocabulary: number;
  masteredGrammar: number;
  vocabularyMastery: number;
  grammarMastery: number;
  dailyTargetMinutes: number;
  dailyCompletedItems: number;
  dailyTargetItems: number;
  dailyPlanPercent: number;
};

export type LearningOverview = {
  accountTier: AccountTier;
  isLocked: boolean;
  lockedFeature?: "learning_records" | "study_plan";
  todayKey: string;
  tasks: DailyStudyTask[];
  week: WeeklyStudyDay[];
  sessions: LearningSessionItem[];
  metrics: LearningMetrics;
  masteryByModule: MasteryItem[];
  pathSummary: string;
};

type DailyStudyTaskRow = {
  id: string;
  task_date: string;
  task_type: DailyTaskType;
  title: string;
  description: string | null;
  target_level: Level | null;
  target_count: number;
  completed_count: number;
  target_minutes: number;
  completed_minutes: number;
  status: DailyTaskStatus;
  accuracy: number | string | null;
  href: string | null;
};

type StudySessionRow = {
  id: string;
  session_type: "study" | "review" | "practice" | "jlpt_mock";
  target_level: Level | null;
  started_at: string;
  duration_seconds: number;
  items_completed: number;
  correct_count: number;
  incorrect_count: number;
  notes: string | null;
  session_summary: Record<string, unknown> | null;
};

type UserMasteryRow = {
  status: DailyTaskStatus;
  mastery_score: number | string | null;
};

type PreviewTaskPatch = Partial<Pick<DailyStudyTask, "completedCount" | "completedMinutes" | "status" | "accuracy">>;

export type PreviewLearningState = {
  taskDate: string;
  tasks: Partial<Record<DailyTaskType, PreviewTaskPatch>>;
};

const previewLearningCookie = "japanweb_learning_tasks";
const levelSet = new Set<string>(levels);

export function normalizeDailyTaskType(value: FormDataEntryValue | string | null | undefined): DailyTaskType | null {
  return typeof value === "string" && dailyTaskTypes.includes(value as DailyTaskType) ? (value as DailyTaskType) : null;
}

export function getTodayDateKey(timezone = "Asia/Tokyo") {
  return getDateKey(new Date(), timezone);
}

export function getDateKey(date: Date, timezone = "Asia/Tokyo") {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    return date.toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export function addDaysToDateKey(dateKey: string, deltaDays: number) {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays));

  return date.toISOString().slice(0, 10);
}

export function buildDefaultDailyTasks(profile: UserProfile, taskDate = getTodayDateKey(profile.timezone)): DailyStudyTask[] {
  const targetLevel = profile.target_jlpt_level;
  const [vocabularyMinutes, grammarMinutes, readingMinutes, practiceMinutes] = allocateDailyMinutes(profile.daily_study_goal);

  return [
    {
      id: `${taskDate}-vocabulary`,
      taskDate,
      taskType: "vocabulary",
      title: `${targetLevel} 单词 20 个`,
      description: "先用高频词建立今天的输入量，优先复习不熟悉和待复习词。",
      targetLevel,
      targetCount: 20,
      completedCount: 0,
      targetMinutes: vocabularyMinutes,
      completedMinutes: 0,
      status: "not_started",
      accuracy: null,
      href: `/vocabulary?level=${targetLevel}`
    },
    {
      id: `${taskDate}-grammar`,
      taskDate,
      taskType: "grammar",
      title: `${targetLevel} 语法 3 个`,
      description: "阅读用法、结构和例句，重点区分相近语法。",
      targetLevel,
      targetCount: 3,
      completedCount: 0,
      targetMinutes: grammarMinutes,
      completedMinutes: 0,
      status: "not_started",
      accuracy: null,
      href: `/grammar?level=${targetLevel}`
    },
    {
      id: `${taskDate}-reading`,
      taskDate,
      taskType: "reading",
      title: `${targetLevel} 阅读 1 篇`,
      description: "用一篇短文把单词和语法放回语境里理解。",
      targetLevel,
      targetCount: 1,
      completedCount: 0,
      targetMinutes: readingMinutes,
      completedMinutes: 0,
      status: "not_started",
      accuracy: null,
      href: `/reading?level=${targetLevel}`
    },
    {
      id: `${taskDate}-practice`,
      taskDate,
      taskType: "practice",
      title: `${targetLevel} 练习 10 题`,
      description: "最后用练习检测吸收情况，错题自动进入后续复习队列。",
      targetLevel,
      targetCount: 10,
      completedCount: 0,
      targetMinutes: practiceMinutes,
      completedMinutes: 0,
      status: "not_started",
      accuracy: null,
      href: `/practice?level=${targetLevel}`
    }
  ];
}

export async function getLearningOverview(
  supabase: SupabaseClient | null,
  user: User,
  profile: UserProfile,
  accountTier: AccountTier
): Promise<LearningOverview> {
  const todayKey = getTodayDateKey(profile.timezone);
  const defaultTasks = buildDefaultDailyTasks(profile, todayKey);

  if (!canAccessFeature(accountTier, "learning_records") && !canAccessFeature(accountTier, "study_plan")) {
    return buildLockedLearningOverview(todayKey, accountTier);
  }

  if (!supabase) {
    const previewState = await readPreviewLearningState();
    const tasks = applyPreviewTaskState(defaultTasks, previewState, todayKey);
    const sessions = buildPreviewSessions(profile, todayKey, tasks);

    return buildOverviewFromRows({
      accountTier,
      todayKey,
      timezone: profile.timezone,
      dailyTargetMinutes: profile.daily_study_goal,
      tasks,
      sessions,
      vocabularyRows: buildPreviewVocabularyRows(),
      grammarRows: buildPreviewGrammarRows()
    });
  }

  const sixtyDaysAgo = `${addDaysToDateKey(todayKey, -59)}T00:00:00.000Z`;
  const [tasksResult, sessionsResult, vocabularyResult, grammarResult] = await Promise.all([
    supabase
      .from("daily_study_tasks")
      .select(
        "id,task_date,task_type,title,description,target_level,target_count,completed_count,target_minutes,completed_minutes,status,accuracy,href"
      )
      .eq("user_id", user.id)
      .eq("task_date", todayKey)
      .order("created_at", { ascending: true }),
    supabase
      .from("study_sessions")
      .select("id,session_type,target_level,started_at,duration_seconds,items_completed,correct_count,incorrect_count,notes,session_summary")
      .eq("user_id", user.id)
      .gte("started_at", sixtyDaysAgo)
      .order("started_at", { ascending: false })
      .limit(80),
    supabase.from("user_vocabulary").select("status,mastery_score").eq("user_id", user.id),
    supabase.from("user_grammar").select("status,mastery_score").eq("user_id", user.id)
  ]);

  const storedTasks = Array.isArray(tasksResult.data) ? (tasksResult.data as DailyStudyTaskRow[]).map((row) => normalizeTaskRow(row, profile)) : [];
  const tasks = mergeDailyTasks(defaultTasks, storedTasks);
  const sessions = Array.isArray(sessionsResult.data) ? (sessionsResult.data as StudySessionRow[]).map((row) => normalizeSessionRow(row)) : [];

  return buildOverviewFromRows({
    accountTier,
    todayKey,
    timezone: profile.timezone,
    dailyTargetMinutes: profile.daily_study_goal,
    tasks,
    sessions,
    vocabularyRows: Array.isArray(vocabularyResult.data) ? (vocabularyResult.data as UserMasteryRow[]) : [],
    grammarRows: Array.isArray(grammarResult.data) ? (grammarResult.data as UserMasteryRow[]) : []
  });
}

function buildLockedLearningOverview(todayKey: string, accountTier: AccountTier): LearningOverview {
  return {
    accountTier,
    isLocked: true,
    lockedFeature: "learning_records",
    todayKey,
    tasks: [],
    week: Array.from({ length: 7 }, (_, index) => {
      const date = addDaysToDateKey(todayKey, index - 6);

      return {
        date,
        label: ["一", "二", "三", "四", "五", "六", "日"][index],
        minutes: 0,
        isToday: date === todayKey
      };
    }),
    sessions: [],
    metrics: {
      todayMinutes: 0,
      weeklyMinutes: 0,
      totalStudyMinutes: 0,
      streakDays: 0,
      averageAccuracy: 0,
      masteredVocabulary: 0,
      masteredGrammar: 0,
      vocabularyMastery: 0,
      grammarMastery: 0,
      dailyTargetMinutes: 0,
      dailyCompletedItems: 0,
      dailyTargetItems: 0,
      dailyPlanPercent: 0
    },
    masteryByModule: [
      { label: "单词掌握度", value: 0, detail: "PRO 可查看" },
      { label: "语法掌握度", value: 0, detail: "PRO 可查看" },
      { label: "今日任务完成度", value: 0, detail: "PRO 可查看" }
    ],
    pathSummary: "学习记录和每日学习计划属于 PRO 功能。升级后可以查看今日学习、本周趋势、连续天数和学习目标。"
  };
}

export async function readPreviewLearningState(): Promise<PreviewLearningState> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(previewLearningCookie)?.value;

  if (!raw) {
    return { taskDate: "", tasks: {} };
  }

  try {
    const parsed = JSON.parse(raw) as PreviewLearningState;

    if (!parsed || typeof parsed !== "object" || !parsed.tasks || typeof parsed.tasks !== "object") {
      return { taskDate: "", tasks: {} };
    }

    return parsed;
  } catch {
    return { taskDate: "", tasks: {} };
  }
}

export async function writePreviewLearningState(state: PreviewLearningState) {
  const cookieStore = await cookies();

  cookieStore.set(previewLearningCookie, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function completionAccuracyForTask(taskType: DailyTaskType) {
  switch (taskType) {
    case "vocabulary":
      return 92;
    case "grammar":
      return 88;
    case "reading":
      return 100;
    case "practice":
      return 84;
    case "jlpt":
      return 78;
    case "review":
      return 90;
  }
}

export function sessionTypeForTask(taskType: DailyTaskType): "study" | "review" | "practice" | "jlpt_mock" {
  switch (taskType) {
    case "practice":
      return "practice";
    case "jlpt":
      return "jlpt_mock";
    case "review":
      return "review";
    case "vocabulary":
    case "grammar":
    case "reading":
      return "study";
  }
}

function allocateDailyMinutes(goalMinutes: number) {
  const target = Math.max(goalMinutes, 20);
  const vocabulary = Math.max(8, Math.round(target * 0.35));
  const grammar = Math.max(6, Math.round(target * 0.25));
  const reading = Math.max(5, Math.round(target * 0.2));
  const practice = Math.max(5, target - vocabulary - grammar - reading);

  return [vocabulary, grammar, reading, practice] as const;
}

function applyPreviewTaskState(defaultTasks: DailyStudyTask[], state: PreviewLearningState, todayKey: string) {
  const seededTasks = defaultTasks.map((task) => {
    if (state.taskDate === todayKey && state.tasks[task.taskType]) {
      return applyTaskPatch(task, state.tasks[task.taskType]);
    }

    return applyTaskPatch(task, getDefaultPreviewPatch(task.taskType, task.targetMinutes));
  });

  return seededTasks.map(clampTaskProgress);
}

function getDefaultPreviewPatch(taskType: DailyTaskType, targetMinutes: number): PreviewTaskPatch {
  switch (taskType) {
    case "vocabulary":
      return { completedCount: 12, completedMinutes: Math.min(targetMinutes, 12), status: "in_progress", accuracy: 91 };
    case "grammar":
      return { completedCount: 1, completedMinutes: Math.min(targetMinutes, 8), status: "in_progress", accuracy: 86 };
    case "reading":
      return { completedCount: 0, completedMinutes: 0, status: "not_started", accuracy: null };
    case "practice":
      return { completedCount: 0, completedMinutes: 0, status: "not_started", accuracy: null };
    case "jlpt":
    case "review":
      return { completedCount: 0, completedMinutes: 0, status: "not_started", accuracy: null };
  }
}

function applyTaskPatch(task: DailyStudyTask, patch: PreviewTaskPatch | undefined) {
  if (!patch) {
    return task;
  }

  return {
    ...task,
    completedCount: patch.completedCount ?? task.completedCount,
    completedMinutes: patch.completedMinutes ?? task.completedMinutes,
    status: patch.status ?? task.status,
    accuracy: patch.accuracy ?? task.accuracy
  };
}

function mergeDailyTasks(defaultTasks: DailyStudyTask[], storedTasks: DailyStudyTask[]) {
  const storedByType = new Map(storedTasks.map((task) => [task.taskType, task]));

  return defaultTasks.map((task) => clampTaskProgress(storedByType.get(task.taskType) ?? task));
}

function normalizeTaskRow(row: DailyStudyTaskRow, profile: UserProfile): DailyStudyTask {
  const targetLevel = normalizeLevel(row.target_level, profile.target_jlpt_level);

  return clampTaskProgress({
    id: row.id,
    taskDate: row.task_date,
    taskType: row.task_type,
    title: row.title,
    description: row.description ?? "",
    targetLevel,
    targetCount: Math.max(1, Number(row.target_count ?? 1)),
    completedCount: Math.max(0, Number(row.completed_count ?? 0)),
    targetMinutes: Math.max(1, Number(row.target_minutes ?? 1)),
    completedMinutes: Math.max(0, Number(row.completed_minutes ?? 0)),
    status: normalizeTaskStatus(row.status),
    accuracy: row.accuracy === null ? null : Math.round(Number(row.accuracy)),
    href: row.href || `/${row.task_type}?level=${targetLevel}`
  });
}

function normalizeSessionRow(row: StudySessionRow): LearningSessionItem {
  const totalAnswers = Number(row.correct_count ?? 0) + Number(row.incorrect_count ?? 0);
  const summaryTitle = typeof row.session_summary?.title === "string" ? row.session_summary.title : null;

  return {
    id: row.id,
    title: row.notes || summaryTitle || sessionTitle(row.session_type),
    module: sessionModule(row.session_type, row.session_summary),
    targetLevel: normalizeNullableLevel(row.target_level),
    startedAt: row.started_at,
    durationMinutes: minutesFromSeconds(row.duration_seconds),
    itemsCompleted: Number(row.items_completed ?? 0),
    accuracy: totalAnswers > 0 ? Math.round((Number(row.correct_count ?? 0) / totalAnswers) * 100) : null
  };
}

function buildOverviewFromRows({
  accountTier,
  todayKey,
  timezone,
  dailyTargetMinutes,
  tasks,
  sessions,
  vocabularyRows,
  grammarRows
}: {
  accountTier: AccountTier;
  todayKey: string;
  timezone: string;
  dailyTargetMinutes: number;
  tasks: DailyStudyTask[];
  sessions: LearningSessionItem[];
  vocabularyRows: UserMasteryRow[];
  grammarRows: UserMasteryRow[];
}): LearningOverview {
  const week = buildWeeklyStudy(sessions, tasks, todayKey, timezone);
  const todayTaskMinutes = tasks.reduce((total, task) => total + task.completedMinutes, 0);
  const todaySessionMinutes = sessions
    .filter((session) => getDateKey(new Date(session.startedAt), timezone) === todayKey)
    .reduce((total, session) => total + session.durationMinutes, 0);
  const todayMinutes = Math.max(todayTaskMinutes, todaySessionMinutes);
  const weeklyMinutes = week.reduce((total, day) => total + day.minutes, 0);
  const totalStudyMinutes = sessions.reduce((total, session) => total + session.durationMinutes, 0);
  const answerStats = sessions.reduce(
    (stats, session) => {
      if (session.accuracy !== null && session.itemsCompleted > 0) {
        const correct = Math.round((session.itemsCompleted * session.accuracy) / 100);
        stats.correct += correct;
        stats.total += session.itemsCompleted;
      }

      return stats;
    },
    { correct: 0, total: 0 }
  );
  const taskAccuracy = average(
    tasks
      .map((task) => task.accuracy)
      .filter((value): value is number => typeof value === "number")
  );
  const averageAccuracy = answerStats.total > 0 ? Math.round((answerStats.correct / answerStats.total) * 100) : taskAccuracy;
  const vocabularyMastery = average(vocabularyRows.map((item) => toNumber(item.mastery_score)));
  const grammarMastery = average(grammarRows.map((item) => toNumber(item.mastery_score)));
  const masteredVocabulary = vocabularyRows.filter((item) => isMastered(item)).length;
  const masteredGrammar = grammarRows.filter((item) => isMastered(item)).length;
  const dailyCompletedItems = tasks.reduce((total, task) => total + Math.min(task.completedCount, task.targetCount), 0);
  const dailyTargetItems = tasks.reduce((total, task) => total + task.targetCount, 0);
  const dailyPlanPercent = dailyTargetItems > 0 ? Math.round((dailyCompletedItems / dailyTargetItems) * 100) : 0;
  const activeDates = new Set(sessions.filter((session) => session.durationMinutes > 0).map((session) => getDateKey(new Date(session.startedAt), timezone)));

  if (todayMinutes > 0) {
    activeDates.add(todayKey);
  }

  return {
    accountTier,
    isLocked: false,
    todayKey,
    tasks,
    week,
    sessions: sessions.slice(0, 8),
    metrics: {
      todayMinutes,
      weeklyMinutes,
      totalStudyMinutes,
      streakDays: calculateStreak(activeDates, todayKey),
      averageAccuracy,
      masteredVocabulary,
      masteredGrammar,
      vocabularyMastery,
      grammarMastery,
      dailyTargetMinutes,
      dailyCompletedItems,
      dailyTargetItems,
      dailyPlanPercent
    },
    masteryByModule: [
      {
        label: "单词掌握度",
        value: vocabularyMastery,
        detail: `${masteredVocabulary} 个已掌握`
      },
      {
        label: "语法掌握度",
        value: grammarMastery,
        detail: `${masteredGrammar} 个已掌握`
      },
      {
        label: "今日任务完成度",
        value: dailyPlanPercent,
        detail: `${dailyCompletedItems}/${dailyTargetItems} 项学习量`
      }
    ],
    pathSummary: "今日路径：先单词输入，再学习语法，随后阅读一篇文章，最后用练习题检查吸收情况。"
  };
}

function buildWeeklyStudy(sessions: LearningSessionItem[], tasks: DailyStudyTask[], todayKey: string, timezone: string) {
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysToDateKey(todayKey, index - 6);

    return {
      date,
      label: ["一", "二", "三", "四", "五", "六", "日"][index],
      minutes: 0,
      isToday: date === todayKey
    };
  });
  const byDate = new Map(week.map((day) => [day.date, day]));

  for (const session of sessions) {
    const dateKey = getDateKey(new Date(session.startedAt), timezone);
    const day = byDate.get(dateKey);

    if (day) {
      day.minutes += session.durationMinutes;
    }
  }

  const today = byDate.get(todayKey);

  if (today) {
    today.minutes = Math.max(today.minutes, tasks.reduce((total, task) => total + task.completedMinutes, 0));
  }

  return week;
}

function calculateStreak(activeDates: Set<string>, todayKey: string) {
  let cursor = activeDates.has(todayKey) ? todayKey : addDaysToDateKey(todayKey, -1);
  let streak = 0;

  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}

function buildPreviewSessions(profile: UserProfile, todayKey: string, tasks: DailyStudyTask[]): LearningSessionItem[] {
  const todayMinutes = tasks.reduce((total, task) => total + task.completedMinutes, 0);
  const now = new Date();

  return [
    {
      id: "preview-session-today",
      title: "今日单词与语法学习",
      module: "study",
      targetLevel: profile.target_jlpt_level,
      startedAt: now.toISOString(),
      durationMinutes: todayMinutes,
      itemsCompleted: tasks.reduce((total, task) => total + task.completedCount, 0),
      accuracy: 89
    },
    {
      id: "preview-session-yesterday",
      title: `${profile.target_jlpt_level} 综合练习`,
      module: "practice",
      targetLevel: profile.target_jlpt_level,
      startedAt: isoForDateKey(addDaysToDateKey(todayKey, -1), 20),
      durationMinutes: 38,
      itemsCompleted: 24,
      accuracy: 83
    },
    {
      id: "preview-session-two-days",
      title: "阅读与错题复习",
      module: "review",
      targetLevel: profile.target_jlpt_level,
      startedAt: isoForDateKey(addDaysToDateKey(todayKey, -2), 19),
      durationMinutes: 32,
      itemsCompleted: 16,
      accuracy: 87
    },
    {
      id: "preview-session-three-days",
      title: "JLPT 风格专项训练",
      module: "jlpt_mock",
      targetLevel: profile.target_jlpt_level,
      startedAt: isoForDateKey(addDaysToDateKey(todayKey, -3), 21),
      durationMinutes: 45,
      itemsCompleted: 30,
      accuracy: 78
    }
  ];
}

function buildPreviewVocabularyRows(): UserMasteryRow[] {
  return Array.from({ length: 426 }, (_, index) => ({
    status: index < 382 ? "completed" : "in_progress",
    mastery_score: index < 382 ? 92 : 58
  }));
}

function buildPreviewGrammarRows(): UserMasteryRow[] {
  return Array.from({ length: 132 }, (_, index) => ({
    status: index < 108 ? "completed" : "in_progress",
    mastery_score: index < 108 ? 88 : 62
  }));
}

function isoForDateKey(dateKey: string, hour: number) {
  return `${dateKey}T${String(hour).padStart(2, "0")}:00:00.000+09:00`;
}

function sessionTitle(sessionType: StudySessionRow["session_type"]) {
  switch (sessionType) {
    case "study":
      return "内容学习";
    case "review":
      return "复习";
    case "practice":
      return "练习";
    case "jlpt_mock":
      return "JLPT 模拟训练";
  }
}

function sessionModule(sessionType: StudySessionRow["session_type"], summary: Record<string, unknown> | null) {
  if (typeof summary?.task_type === "string") {
    return summary.task_type;
  }

  return sessionType;
}

function clampTaskProgress(task: DailyStudyTask): DailyStudyTask {
  const completedCount = Math.min(Math.max(0, task.completedCount), task.targetCount);
  const completedMinutes = Math.min(Math.max(0, task.completedMinutes), task.targetMinutes);
  const status = completedCount >= task.targetCount || task.status === "completed" ? "completed" : completedCount > 0 ? "in_progress" : task.status;

  return {
    ...task,
    completedCount,
    completedMinutes,
    status
  };
}

function minutesFromSeconds(seconds: number) {
  return Math.round(Number(seconds ?? 0) / 60);
}

function normalizeTaskStatus(value: string | null | undefined): DailyTaskStatus {
  return value === "completed" || value === "in_progress" || value === "suspended" || value === "not_started" ? value : "not_started";
}

function normalizeNullableLevel(value: string | null | undefined): Level | null {
  return typeof value === "string" && levelSet.has(value) ? (value as Level) : null;
}

function normalizeLevel(value: string | null | undefined, fallback: Level): Level {
  return normalizeNullableLevel(value) ?? fallback;
}

function average(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));

  if (usable.length === 0) {
    return 0;
  }

  return Math.round(usable.reduce((total, value) => total + value, 0) / usable.length);
}

function toNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) ? parsed : 0;
}

function isMastered(item: UserMasteryRow) {
  return item.status === "completed" || toNumber(item.mastery_score) >= 80;
}
