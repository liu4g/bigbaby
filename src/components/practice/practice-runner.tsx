"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, CircleAlert, RotateCcw, SendHorizontal } from "lucide-react";
import { submitPracticeAction } from "@/app/actions/practice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  questionTypeLabels,
  type PracticePublicQuestion,
  type PracticePublicSet
} from "@/lib/practice-data";
import type { PracticeActionState, PracticeQuestionResult } from "@/lib/practice";
import type { AccountTier } from "@/lib/vocabulary";

const initialState: PracticeActionState = {
  status: "idle"
};

export function PracticeRunner({ practiceSet, plan }: { practiceSet: PracticePublicSet; plan?: AccountTier }) {
  const [state, formAction] = useActionState(submitPracticeAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="practice_slug" value={practiceSet.slug} />
        {plan ? <input type="hidden" name="plan" value={plan} /> : null}
        {practiceSet.questions.map((question, index) => (
          <QuestionCard key={question.id} question={question} index={index} />
        ))}
        <SubmitButton />
      </form>

      {state.status === "error" ? (
        <ErrorState title="提交失败" description={state.message ?? "请稍后重新提交。"} />
      ) : null}

      {state.status === "success" && state.result ? <PracticeResultPanel result={state.result} /> : null}
    </div>
  );
}

function QuestionCard({ question, index }: { question: PracticePublicQuestion; index: number }) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">第 {index + 1} 题</Badge>
          <Badge variant="muted">{questionTypeLabels[question.questionType]}</Badge>
          <Badge variant="outline">难度 {question.difficulty}</Badge>
        </div>
        <CardTitle className="text-base leading-7">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="hidden" name="question_id" value={question.id} />

        {question.passage ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-7 text-foreground">
            {question.passage}
          </div>
        ) : null}

        {question.hint ? <p className="text-sm leading-6 text-muted-foreground">{question.hint}</p> : null}

        {question.questionType === "fill_blank" || question.questionType === "text_input" ? (
          <Input name={`text_${question.id}`} placeholder="输入答案" autoComplete="off" />
        ) : (
          <div className="grid gap-2">
            {question.options.map((option) => {
              const inputType = question.questionType === "multiple_choice" ? "checkbox" : "radio";
              const inputId = `${question.id}-${option.id}`;

              return (
                <label
                  key={option.id}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-muted"
                >
                  <input
                    id={inputId}
                    type={inputType}
                    name={`answer_${question.id}`}
                    value={option.id}
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button type="submit" disabled={pending} leadingIcon={<SendHorizontal className="h-4 w-4" />} className="sm:w-auto">
        {pending ? "提交中" : "提交答案"}
      </Button>
      <Button href="/practice/wrong-answers" variant="outline" leadingIcon={<RotateCcw className="h-4 w-4" />}>
        错题本
      </Button>
    </div>
  );
}

function PracticeResultPanel({ result }: { result: NonNullable<PracticeActionState["result"]> }) {
  const wrongQuestions = result.questions.filter((question) => !question.isCorrect);

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{result.practiceSetTitle}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              正确 {result.correct} / {result.total}，错题 {result.wrong}
            </p>
          </div>
          <Badge variant={result.accuracy >= 80 ? "success" : "warning"}>{Math.round(result.accuracy)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={result.accuracy} label="本次正确率" />

        <div className="rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">{result.recommendation}</div>

        <div className="grid gap-3">
          {result.questions.map((question) => (
            <QuestionResult key={question.questionId} question={question} />
          ))}
        </div>

        {wrongQuestions.length > 0 ? (
          <Button href="/practice/wrong-answers" variant="outline" leadingIcon={<RotateCcw className="h-4 w-4" />}>
            查看错题本
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QuestionResult({ question }: { question: PracticeQuestionResult }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={question.isCorrect ? "success" : "destructive"}>
          {question.isCorrect ? "正确" : "错误"}
        </Badge>
        <Badge variant="muted">{questionTypeLabels[question.questionType]}</Badge>
      </div>
      <p className="text-sm font-medium leading-6 text-foreground">{question.question}</p>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <ResultLine
          label="你的答案"
          value={question.selectedText || question.selectedLabels.join("、") || "未作答"}
          icon={question.isCorrect ? <CheckCircle2 className="h-4 w-4 text-success" /> : <CircleAlert className="h-4 w-4 text-destructive" />}
        />
        <ResultLine
          label="正确答案"
          value={question.correctTexts.join("、") || question.correctLabels.join("、") || "见解析"}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.explanation}</p>
      {!question.isCorrect ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.reviewSuggestion}</p>
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
