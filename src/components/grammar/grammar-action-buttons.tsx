import { AlertCircle, Bookmark, BookmarkCheck, CheckCircle2, RotateCcw } from "lucide-react";
import {
  addGrammarToReviewAction,
  setGrammarStatusAction,
  toggleGrammarBookmarkAction
} from "@/app/actions/grammar";
import { Button } from "@/components/ui/button";
import type { AccountTier } from "@/lib/access-control";
import type { GrammarWithState } from "@/lib/grammar-data";

export function GrammarActionButtons({
  item,
  returnTo,
  plan,
  compact = false
}: {
  item: GrammarWithState;
  returnTo: string;
  plan?: AccountTier;
  compact?: boolean;
}) {
  if (item.isLocked) {
    return (
      <Button type="button" variant="secondary" size={compact ? "sm" : "md"} disabled>
        PRO 解锁
      </Button>
    );
  }

  const size = compact ? "sm" : "md";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={toggleGrammarBookmarkAction}>
        <ActionFields item={item} returnTo={returnTo} plan={plan} />
        <Button
          type="submit"
          variant={item.isBookmarked ? "secondary" : "outline"}
          size={size}
          leadingIcon={item.isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        >
          {item.isBookmarked ? "已收藏" : "收藏"}
        </Button>
      </form>

      <form action={setGrammarStatusAction}>
        <ActionFields item={item} returnTo={returnTo} plan={plan} />
        <input type="hidden" name="status" value="completed" />
        <Button
          type="submit"
          variant={item.status === "completed" ? "accent" : "outline"}
          size={size}
          leadingIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          已掌握
        </Button>
      </form>

      <form action={setGrammarStatusAction}>
        <ActionFields item={item} returnTo={returnTo} plan={plan} />
        <input type="hidden" name="status" value="in_progress" />
        <Button
          type="submit"
          variant={item.status === "in_progress" ? "secondary" : "outline"}
          size={size}
          leadingIcon={<AlertCircle className="h-4 w-4" />}
        >
          不熟悉
        </Button>
      </form>

      <form action={addGrammarToReviewAction}>
        <ActionFields item={item} returnTo={returnTo} plan={plan} />
        <Button type="submit" variant="ghost" size={size} leadingIcon={<RotateCcw className="h-4 w-4" />}>
          加入复习
        </Button>
      </form>
    </div>
  );
}

function ActionFields({ item, returnTo, plan }: { item: GrammarWithState; returnTo: string; plan?: AccountTier }) {
  return (
    <>
      <input type="hidden" name="grammar_id" value={item.id} />
      <input type="hidden" name="return_to" value={returnTo} />
      {plan ? <input type="hidden" name="plan" value={plan} /> : null}
    </>
  );
}
