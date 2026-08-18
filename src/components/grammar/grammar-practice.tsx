"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GrammarPractice({
  grammarPoint,
  formation,
  correctMeaning,
  choices
}: {
  grammarPoint: string;
  formation: string;
  correctMeaning: string;
  choices: string[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const stableChoices = useMemo(() => choices, [choices]);
  const answered = selected !== null;
  const correct = selected === correctMeaning;

  return (
    <div id="practice">
      <Card>
      <CardHeader>
        <CardTitle className="text-base">语法练习</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Meaning</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{grammarPoint}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formation}</p>
        </div>

        <div className="grid gap-2">
          {stableChoices.map((choice) => {
            const isSelected = selected === choice;
            const isCorrectChoice = choice === correctMeaning;

            return (
              <button
                key={choice}
                type="button"
                onClick={() => setSelected(choice)}
                disabled={answered}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                  isSelected && correct ? "border-success bg-success/10 text-foreground" : "",
                  isSelected && !correct ? "border-destructive bg-destructive/10 text-foreground" : "",
                  answered && isCorrectChoice ? "border-success bg-success/10" : "",
                  !answered ? "border-border hover:bg-muted" : "border-border"
                )}
              >
                <span>{choice}</span>
                {answered && isCorrectChoice ? <CheckCircle2 className="h-4 w-4 text-success" /> : null}
                {isSelected && !correct ? <XCircle className="h-4 w-4 text-destructive" /> : null}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={cn("text-sm font-medium", correct ? "text-success" : "text-destructive")}>
              {correct ? "回答正确" : `正确答案：${correctMeaning}`}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leadingIcon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setSelected(null)}
            >
              再试一次
            </Button>
          </div>
        ) : null}
      </CardContent>
      </Card>
    </div>
  );
}
