# Dictionary Reference Selection

This is the first curated reference set from `E:\tokyo\GoldenDict\content\jp`.

The goal is not to copy dictionary content. These sources are used for internal cross-checking, then the platform publishes rewritten meanings and original examples.

## S Tier

| Source | Use | Notes |
| --- | --- | --- |
| `NHK日本語発音アクセント新辞典/NHK日本語発音アクセント新辞典.mdx` | Pitch accent, reading | Best accent reference. Do not publish audio or raw article content. |
| `[其他语种] ◆日英英日双向辞典【匿名原创】【版本日期未注明】.mdx` | Base lexeme, reading, part of speech | Header title is `JMDict`. Prefer official JMdict data if we move toward production imports. |
| `daijirin2.mdx` | Japanese sense boundaries | Use to understand meaning, not to copy definitions. |
| `smk8.mdx` | Japanese nuance and usage | Useful for natural interpretation and sense distinction. |

## A Tier

| Source | Use | Notes |
| --- | --- | --- |
| `新世纪日汉双解/xsjrihanshuangjie.mdx` | Chinese meaning keywords | Strong Chinese reference; final wording must be rewritten. |
| `日汉双解词典_20231101/日汉双解词典_20231101.mdx` | Secondary Chinese keyword check | Helps catch translation conflicts. |
| `日本語動詞辞典.mdx` | Verb group and conjugation hints | Use for verbs only. |
| `実用日本語表現辞典.mdx` | Expressions and phrase-like vocabulary | Useful when words behave like fixed expressions. |

## B Tier

| Source | Use | Notes |
| --- | --- | --- |
| `日本語表現文型辞典.mdx` | Grammar pattern cross-check | Use for expression-like entries. |
| `日本語表現活用辞典.mdx` | Expression/conjugation cross-check | Secondary helper. |
| `名称发音大辞典.mdx` | Proper-name readings | Names/places only, not core JLPT vocabulary. |
| `精選版 日本国語大辞典/精選版 日本国語大辞典.mdx` | Advanced/historical sense check | Use sparingly for N1 and advanced wording. |

## Lower Priority

- `[4日语新明解国语辞典.mdx`: likely duplicate/older Shinmeikai; prefer `smk8`.
- `三省堂大辭林日日辭典(Vina網友求的)[379725].mdx`: likely duplicate/older Daijirin; prefer `daijirin2`.
- `小学馆日本大百科.mdx`: encyclopedia, too broad for JLPT vocabulary.
- `《英辞郎v86英和辞典》[090412].mdx` and `《英辞郎日英辞典》.mdx`: useful later, not first for Chinese-facing vocabulary.
- `[其他语种] ◆日汉27万大辞典【wonthen原创】【版本日期未注明】.mdx`: broad but unclear provenance; use only for conflict checks.

## First Parser Batch

Start with only these five:

1. `NHK日本語発音アクセント新辞典/NHK日本語発音アクセント新辞典.mdx`
2. `[其他语种] ◆日英英日双向辞典【匿名原创】【版本日期未注明】.mdx`
3. `daijirin2.mdx`
4. `smk8.mdx`
5. `新世纪日汉双解/xsjrihanshuangjie.mdx`

This gives a balanced signal:

- reading and pitch accent
- base lexical identity
- Japanese sense validation
- Chinese meaning keywords
- enough redundancy to detect conflicts
