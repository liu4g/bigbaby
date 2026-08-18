"use client";

import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, CircleAlert, Clock3, Pause, Play, SendHorizontal } from "lucide-react";
import { submitJlptExamAction } from "@/app/actions/jlpt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  jlptSectionZhLabels,
  type JlptPublicExam,
  type JlptPublicQuestion,
  type JlptPublicSection
} from "@/lib/jlpt-data";
import type { JlptActionState, JlptExamResult, JlptQuestionResult } from "@/lib/jlpt";
import { cn } from "@/lib/utils";
import type { AccountTier } from "@/lib/vocabulary";

const initialState: JlptActionState = {
  status: "idle"
};

type AnswerState = Record<string, { selectedOptionIds: string[]; text: string }>;
type ExamItem = {
  section: JlptPublicSection;
  question: JlptPublicQuestion;
};

export function JlptExamRunner({ exam, plan }: { exam: JlptPublicExam; plan?: AccountTier }) {
  const [state, formAction] = useActionState(submitJlptExamAction, initialState);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [paused, setPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(exam.durationSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const formRef = useRef<HTMLFormElement>(null);
  const submittedByTimerRef = useRef(false);
  const items = useMemo(
    () =>
      exam.sections.flatMap((section) =>
        section.questions.map((question) => ({
          section,
          question
        }))
      ),
    [exam.sections]
  );
  const current = items[currentIndex];
  const answeredCount = items.filter((item) => isAnswered(item.question, answers[item.question.id])).length;

  useEffect(() => {
    if (!started || paused || state.status === "success") {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [paused, started, state.status]);

  useEffect(() => {
    if (!started || remainingSeconds > 0 || submittedByTimerRef.current || state.status === "success") {
      return;
    }

    submittedByTimerRef.current = true;
    formRef.current?.requestSubmit();
  }, [remainingSeconds, started, state.status]);

  if (state.status === "success" && state.result) {
    return <JlptResultPanel result={state.result} />;
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">考试准备</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="考试时长" value={`${Math.round(exam.durationSeconds / 60)} 分钟`} />
            <Info label="题目数量" value={`${items.length} 题`} />
            <Info label="总分" value={`${exam.totalScore} 分`} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {exam.sections.map((section) => (
              <div key={section.id} className="rounded-lg border border-border bg-background p-3">
                <Badge variant="outline">{section.title}</Badge>
                <p className="mt-2 text-sm font-medium">{jlptSectionZhLabels[section.kind]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{section.questions.length} 题</p>
              </div>
            ))}
          </div>
          <Button
            type="button"
            leadingIcon={<Play className="h-4 w-4" />}
            onClick={() => {
              setStarted(true);
              setStartedAt(new Date().toISOString());
            }}
          >
            开始考试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="exam_slug" value={exam.slug} />
        <input type="hidden" name="started_at" value={startedAt} />
        <input type="hidden" name="remaining_seconds" value={remainingSeconds} />
        {plan ? <input type="hidden" name="plan" value={plan} /> : null}
        {items.map(({ question }) => {
          const answer = answers[question.id] ?? { selectedOptionIds: [], text: "" };

          return (
            <Fragment key={question.id}>
              <input type="hidden" name="question_id" value={question.id} />
              {answer.selectedOptionIds.map((optionId) => (
                <input key={optionId} type="hidden" name={`answer_${question.id}`} value={optionId} />
              ))}
              <input type="hidden" name={`text_${question.id}`} value={answer.text} />
            </Fragment>
          );
        })}

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      当前 {currentIndex + 1} / {items.length}
                    </Badge>
                    <Badge variant="muted">{current?.section.title}</Badge>
                    {remainingSeconds === 0 ? <Badge variant="destructive">时间到</Badge> : null}
                  </div>
                  <Progress value={(answeredCount / Math.max(items.length, 1)) * 100} label="答题进度" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 items-center gap-2 rounded-lg bg-muted px-3 text-sm font-semibold">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {formatTime(remainingSeconds)}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    leadingIcon={paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    onClick={() => setPaused((value) => !value)}
                  >
                    {paused ? "继续" : "暂停"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {current ? (
              <QuestionPanel
                item={current}
                answer={answers[current.question.id] ?? { selectedOptionIds: [], text: "" }}
                disabled={paused || remainingSeconds === 0}
                onChange={(nextAnswer) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [current.question.id]: nextAnswer
                  }))
                }
              />
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                >
                  上一题
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentIndex === items.length - 1}
                  onClick={() => setCurrentIndex((value) => Math.min(items.length - 1, value + 1))}
                >
                  下一题
                </Button>
              </div>
              <SubmitButton disabled={paused} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">答题状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {items.map((item, index) => {
                  const answered = isAnswered(item.question, answers[item.question.id]);

                  return (
                    <button
                      key={item.question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-10 rounded-lg border text-sm font-medium transition-colors",
                        index === currentIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : answered
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>开始时间：{startedAt ? new Date(startedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                <p>已答：{answeredCount} 题</p>
                <p>未答：{items.length - answeredCount} 题</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {paused ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">考试已暂停，计时器不会继续减少。</p>
            <Button type="button" variant="outline" onClick={() => setPaused(false)} leadingIcon={<Play className="h-4 w-4" />}>
              继续考试
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.status === "error" ? (
        <ErrorState title="提交失败" description={state.message ?? "请稍后重新提交。"} />
      ) : null}
    </div>
  );
}

function QuestionPanel({
  item,
  answer,
  disabled,
  onChange
}: {
  item: ExamItem;
  answer: { selectedOptionIds: string[]; text: string };
  disabled: boolean;
  onChange: (answer: { selectedOptionIds: string[]; text: string }) => void;
}) {
  const { question, section } = item;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{section.title}</Badge>
          <Badge variant="muted">难度 {question.difficulty}</Badge>
        </div>
        <CardTitle className="text-base leading-7">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.passage ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-7 text-foreground">
            {question.passage}
          </div>
        ) : null}

        {question.audioPrompt ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-7 text-foreground">
            <Badge variant="outline" className="mb-3">
              Listening
            </Badge>
            <p>{question.audioPrompt}</p>
          </div>
        ) : null}

        {question.questionType === "fill_blank" ? (
          <Input
            value={answer.text}
            onChange={(event) => onChange({ ...answer, text: event.target.value })}
            disabled={disabled}
            placeholder="输入答案"
            autoComplete="off"
          />
        ) : (
          <div className="grid gap-2">
            {question.options.map((option) => {
              const isMultiple = question.questionType === "multiple_choice";
              const checked = answer.selectedOptionIds.includes(option.id);

              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-muted",
                    disabled && "cursor-not-allowed opacity-70"
                  )}
                >
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => {
                      if (isMultiple) {
                        onChange({
                          ...answer,
                          selectedOptionIds: event.target.checked
                            ? [...answer.selectedOptionIds, option.id]
                            : answer.selectedOptionIds.filter((id) => id !== option.id)
                        });
                      } else {
                        onChange({
                          ...answer,
                          selectedOptionIds: [option.id]
                        });
                      }
                    }}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="flex min-w-0 flex-1 gap-3">
                    <span className="font-semibold text-foreground">{option.label}</span>
                    <span className="leading-6 text-muted-foreground">{option.text}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} leadingIcon={<SendHorizontal className="h-4 w-4" />}>
      {pending ? "提交中" : "提交考试"}
    </Button>
  );
}

function JlptResultPanel({ result }: { result: JlptExamResult }) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{result.examTitle}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                用时 {formatTime(result.durationSeconds)}，提交于 {new Date(result.submittedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Badge variant={result.accuracy >= 80 ? "success" : "warning"}>
              {result.score} / {result.totalScore}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Progress value={result.accuracy} label="正确率" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {result.sectionResults.map((section) => (
              <div key={section.sectionId} className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold">{section.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.correct} / {section.total} 题
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {section.score}
                  <span className="text-sm text-muted-foreground"> / {section.totalScore}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">薄弱知识点</p>
            {result.weakPoints.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.weakPoints.map((point) => (
                  <Badge key={point.tag} variant="outline">
                    {point.tag} × {point.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">本次没有明显薄弱点。</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">错题与解析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.wrongQuestions.length > 0 ? (
            result.wrongQuestions.map((question) => <QuestionResult key={question.questionId} question={question} />)
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              全部答对，继续保持。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionResult({ question }: { question: JlptQuestionResult }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={question.isCorrect ? "success" : "destructive"}>{question.isCorrect ? "正确" : "错误"}</Badge>
        <Badge variant="muted">{question.sectionTitle}</Badge>
      </div>
      <p className="text-sm font-medium leading-6">{question.question}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ResultLine
          label="你的答案"
          value={question.selectedText || question.selectedLabels.join("、") || "未作答"}
          icon={<CircleAlert className="h-4 w-4 text-destructive" />}
        />
        <ResultLine
          label="正确答案"
          value={question.correctTexts.join("、") || question.correctLabels.join("、") || "见解析"}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.explanation}</p>
      {question.skillTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {question.skillTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResultLine({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function isAnswered(question: JlptPublicQuestion, answer?: { selectedOptionIds: string[]; text: string }) {
  if (!answer) {
    return false;
  }

  return question.questionType === "fill_blank" ? answer.text.trim().length > 0 : answer.selectedOptionIds.length > 0;
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
