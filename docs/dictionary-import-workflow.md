# Dictionary Import Workflow

This project can use local GoldenDict / MDict dictionaries as internal references, but commercial dictionary content must not be copied directly into the production learning content.

## Allowed Reference Fields

Use dictionary files to cross-check factual or low-copyright-risk fields:

- Headword
- Reading / kana
- Part of speech
- Pitch accent
- Common meaning keywords
- Whether multiple sources agree
- Source confidence and conflict notes

## Restricted Fields

Do not publish these directly from commercial dictionaries:

- Full definitions
- Example sentences
- Long usage notes
- Dictionary article structure
- Audio or media assets unless the license explicitly allows redistribution

## Pipeline

1. Scan GoldenDict sources with `npm run dictionary:scan -- "E:\tokyo\GoldenDict\content\jp"`.
2. Register dictionary files in `dictionary_import_sources`.
3. Parse selected entries into `dictionary_import_entries`.
4. Fuse entries by normalized `word + reading`.
5. Store merged drafts in `vocabulary_fusion_candidates`.
6. Rewrite meanings and examples in original wording.
7. Editor/admin reviews the candidate.
8. Approved candidates are inserted into `vocabulary` and `vocabulary_examples`.

## Example Generation Rules

Examples should be original and level-aware:

- N5: short daily-life sentences, one main grammar point.
- N4: simple clauses, common verbs and particles.
- N3: natural everyday or work/study situations.
- N2: formal study, office, news, and social context.
- N1: abstract, formal, academic, editorial, or debate context.

Every example needs:

- Japanese sentence
- Optional kana reading
- Chinese translation
- JLPT level check
- No direct copy from dictionary examples

## Fusion Heuristics

Suggested confidence score:

- +30 if two or more sources agree on reading
- +25 if a dedicated accent dictionary provides pitch accent
- +20 if part of speech is consistent
- +15 if meaning keywords overlap
- +10 if the source is marked as reviewed/internal trusted
- -30 if reading conflicts
- -20 if part of speech conflicts

Candidates below 60 should stay in `needs_review`.
