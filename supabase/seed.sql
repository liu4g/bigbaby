begin;

-- Login-capable demo users for local development.
-- Password for both accounts: Demo123456
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'demo.free@japanweb.local',
    crypt('Demo123456', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"nickname": "Mika Free", "display_name": "Mika Free", "jlpt_level": "N5", "target_jlpt_level": "N3", "daily_study_goal": 30, "timezone": "Asia/Tokyo"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'demo.pro@japanweb.local',
    crypt('Demo123456', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"nickname": "Ren Pro", "display_name": "Ren Pro", "jlpt_level": "N3", "target_jlpt_level": "N2", "daily_study_goal": 45, "timezone": "Asia/Tokyo"}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  aud = excluded.aud,
  role = excluded.role,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "demo.free@japanweb.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "demo.pro@japanweb.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (
  id,
  display_name,
  nickname,
  role,
  jlpt_level,
  target_level,
  target_jlpt_level,
  native_language,
  locale,
  study_goal_minutes,
  daily_study_goal,
  timezone
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Mika Free',
    'Mika Free',
    'student',
    'N5',
    'N3',
    'N3',
    'zh',
    'zh-CN',
    30,
    30,
    'Asia/Tokyo'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Ren Pro',
    'Ren Pro',
    'student',
    'N3',
    'N2',
    'N2',
    'zh',
    'zh-CN',
    45,
    45,
    'Asia/Tokyo'
  )
on conflict (id) do update
set
  display_name = excluded.display_name,
  nickname = excluded.nickname,
  role = excluded.role,
  jlpt_level = excluded.jlpt_level,
  target_level = excluded.target_level,
  target_jlpt_level = excluded.target_jlpt_level,
  native_language = excluded.native_language,
  locale = excluded.locale,
  study_goal_minutes = excluded.study_goal_minutes,
  daily_study_goal = excluded.daily_study_goal,
  timezone = excluded.timezone;

insert into public.subscriptions (
  id,
  user_id,
  tier,
  status,
  provider,
  provider_customer_id,
  provider_subscription_id,
  current_period_start,
  current_period_end,
  started_at,
  metadata
)
values
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'free',
    'active',
    'manual',
    null,
    null,
    null,
    null,
    now(),
    '{"seed": true}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    'pro',
    'active',
    'manual',
    'cus_seed_pro',
    'sub_seed_pro',
    now() - interval '3 days',
    now() + interval '30 days',
    now() - interval '3 days',
    '{"seed": true, "billing": "mock"}'::jsonb
  )
on conflict (user_id) do update
set
  tier = excluded.tier,
  status = excluded.status,
  provider = excluded.provider,
  provider_customer_id = excluded.provider_customer_id,
  provider_subscription_id = excluded.provider_subscription_id,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  started_at = excluded.started_at,
  metadata = excluded.metadata;

insert into public.vocabulary (
  id,
  slug,
  level,
  word,
  kana,
  romaji,
  meaning,
  part_of_speech,
  notes,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'n5-benkyou-suru',
    'N5',
    '勉強する',
    'べんきょうする',
    'benkyou suru',
    '学习',
    'verb',
    '基础动词，常与時間、毎日搭配。',
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'n4-yotei',
    'N4',
    '予定',
    'よてい',
    'yotei',
    '计划；安排',
    'noun',
    '常用于说明日程安排。',
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'n3-haaku-suru',
    'N3',
    '把握する',
    'はあくする',
    'haaku suru',
    '掌握；理解',
    'verb',
    '常用于状況、内容、全体像。',
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'n3-nareru',
    'N3',
    '慣れる',
    'なれる',
    'nareru',
    '习惯；适应',
    'verb',
    '常用于環境、生活、仕事。',
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'n2-moushikomu',
    'N2',
    '申し込む',
    'もうしこむ',
    'moushikomu',
    '申请；报名',
    'verb',
    '较正式表达，常用于手续、活动、课程。',
    'pro',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'n1-kenkai',
    'N1',
    '見解',
    'けんかい',
    'kenkai',
    '见解；观点',
    'noun',
    '用于正式场景中的观点表达。',
    'pro',
    'ai_generated',
    'published',
    '{"reviewed_by": "editor", "model": "gpt-5"}'::jsonb,
    now()
  )
on conflict do nothing;

insert into public.vocabulary_examples (
  id,
  vocabulary_id,
  example_order,
  japanese_text,
  translation,
  notes
)
values
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000101', 1, '毎日30分日本語を勉強します。', '我每天学习 30 分钟日语。', null),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000102', 1, '明日の予定を確認します。', '确认明天的安排。', null),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000103', 1, '状況を正しく把握する必要があります。', '有必要正确掌握情况。', null),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000104', 1, '新しい環境に少しずつ慣れてきました。', '逐渐习惯了新的环境。', null),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000105', 1, '来月の講座に申し込みました。', '我报名了下个月的课程。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000106', 1, '専門家の見解を参考にします。', '参考专家的见解。', 'PRO 例句')
on conflict do nothing;

insert into public.grammar (
  id,
  slug,
  level,
  title,
  pattern,
  meaning,
  usage_notes,
  notes,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at
)
values
  ('00000000-0000-0000-0000-000000000201', 'n4-te-shimau', 'N4', '〜てしまう', 'Vて + しまう', '表示完成、遗憾或不小心。', '口语中常缩略为 ちゃう / じゃう。', null, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000202', 'n3-youni-suru', 'N3', '〜ようにする', 'V辞書形 / Vない + ようにする', '表示尽量、努力养成某种行为。', '强调有意识地持续行动。', null, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000203', 'n3-bakari', 'N3', '〜ばかり', 'Vた + ばかり', '表示刚刚完成，也可表示只做某事。', '注意与 ところ 的语感差异。', null, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000204', 'n2-wake-dewa-nai', 'N2', '〜わけではない', '普通形 + わけではない', '表示并非完全如此。', '常用于缓和否定。', null, 'pro', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000205', 'n1-ni-chigainai', 'N1', '〜に違いない', '普通形 + に違いない', '表示说话人强烈推测。', '正式表达，可用于书面语。', null, 'pro', 'ai_generated', 'published', '{"reviewed_by": "editor", "model": "gpt-5"}'::jsonb, now())
on conflict do nothing;

insert into public.grammar_examples (
  id,
  grammar_id,
  example_order,
  japanese_text,
  translation,
  notes
)
values
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000201', 1, '宿題を忘れてしまいました。', '我不小心忘记了作业。', null),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000202', 1, '毎日日本語を聞くようにしています。', '我尽量每天听日语。', null),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000203', 1, '買ったばかりの本を読みました。', '读了刚买的书。', null),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000204', 1, '日本語が嫌いなわけではありません。', '并不是讨厌日语。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000205', 1, '彼はもう事情を知っているに違いありません。', '他一定已经知道情况了。', 'PRO 例句')
on conflict do nothing;

insert into public.articles (
  id,
  slug,
  level,
  title,
  summary,
  body_markdown,
  estimated_read_time_minutes,
  word_count,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    'n4-konbini-culture',
    'N4',
    '日本のコンビニ文化',
    '通过便利店场景练习 N4 阅读。',
    '日本のコンビニはとても便利です。食べ物だけでなく、チケットや荷物のサービスもあります。',
    6,
    520,
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'n5-morning-routine',
    'N5',
    '朝の学習ルーティン',
    '用简短日常叙事练习基础阅读。',
    '私は朝七時に起きます。朝ご飯のあとで、日本語を少し勉強します。',
    4,
    280,
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'n3-interview-preparation',
    'N3',
    '面接前の準備',
    '面试前准备流程，适合 N3 学习者。',
    '面接の前に会社の情報を把握しておくことが大切です。話す内容を整理するようにしましょう。',
    7,
    610,
    'free',
    'manual',
    'published',
    '{}'::jsonb,
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'n2-workplace-alignment',
    'N2',
    '職場での調整と合意形成',
    '商务场景中的沟通、协调与语气。',
    '職場では相手の見解を尊重しながら、自分の意見を伝える必要があります。合意形成には時間がかかる場合があります。',
    9,
    760,
    'pro',
    'ai_generated',
    'published',
    '{"reviewed_by": "editor", "model": "gpt-5"}'::jsonb,
    now()
  )
on conflict do nothing;

insert into public.article_sentences (
  id,
  article_id,
  sentence_order,
  japanese_text,
  translation,
  notes
)
values
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000301', 1, '日本のコンビニはとても便利です。', '日本的便利店非常方便。', null),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000301', 2, '食べ物だけでなく、チケットや荷物のサービスもあります。', '不仅有食物，也有票务和包裹服务。', null),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000302', 1, '私は朝七時に起きます。', '我早上七点起床。', null),
  ('00000000-0000-0000-0000-000000000314', '00000000-0000-0000-0000-000000000302', 2, '朝ご飯のあとで、日本語を少し勉強します。', '早饭后学习一点日语。', null),
  ('00000000-0000-0000-0000-000000000315', '00000000-0000-0000-0000-000000000303', 1, '面接の前に会社の情報を把握しておくことが大切です。', '面试前掌握公司信息很重要。', null),
  ('00000000-0000-0000-0000-000000000316', '00000000-0000-0000-0000-000000000303', 2, '話す内容を整理するようにしましょう。', '尽量整理好要说的内容。', null),
  ('00000000-0000-0000-0000-000000000317', '00000000-0000-0000-0000-000000000304', 1, '職場では相手の見解を尊重しながら、自分の意見を伝える必要があります。', '在职场中，需要尊重对方见解并表达自己的意见。', 'PRO 句子'),
  ('00000000-0000-0000-0000-000000000318', '00000000-0000-0000-0000-000000000304', 2, '合意形成には時間がかかる場合があります。', '达成共识有时需要时间。', 'PRO 句子')
on conflict do nothing;

insert into public.article_vocabulary (
  id,
  article_id,
  vocabulary_id,
  sort_order,
  note
)
values
  ('00000000-0000-0000-0000-000000000321', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101', 1, '日常学习场景'),
  ('00000000-0000-0000-0000-000000000322', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103', 1, '面试准备关键词'),
  ('00000000-0000-0000-0000-000000000323', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000104', 2, '适应面试流程'),
  ('00000000-0000-0000-0000-000000000324', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000106', 1, 'PRO 商务词汇')
on conflict do nothing;

insert into public.article_grammar (
  id,
  article_id,
  grammar_id,
  sort_order,
  note
)
values
  ('00000000-0000-0000-0000-000000000331', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000202', 1, '行动建议句型'),
  ('00000000-0000-0000-0000-000000000332', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000203', 2, '补充辨析'),
  ('00000000-0000-0000-0000-000000000333', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000204', 1, 'PRO 缓和表达')
on conflict do nothing;

insert into public.practice_sets (
  id,
  slug,
  level,
  title,
  description,
  kind,
  is_jlpt_style,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at
)
values
  ('00000000-0000-0000-0000-000000000401', 'n5-vocabulary-warmup', 'N5', 'N5 词汇热身', '10 题快速选择，巩固基础高频词。', 'vocabulary', false, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000402', 'n3-grammar-mixed', 'N3', 'N3 语法综合练习', '选择题与填空题，训练句型辨析。', 'grammar', false, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000403', 'n2-reading-training', 'N2', 'N2 阅读理解训练', '原创长篇阅读，模拟考试节奏。', 'reading', true, 'pro', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000404', 'n1-original-mock', 'N1', 'JLPT N1 原创模拟卷', '按 JLPT 风格组织的原创模考内容。', 'jlpt_mock', true, 'pro', 'ai_generated', 'published', '{"model": "gpt-5", "prompt_version": "mock-v1", "reviewed_by": "editor"}'::jsonb, now())
on conflict do nothing;

insert into public.questions (
  id,
  practice_set_id,
  sort_order,
  question_type,
  prompt,
  hint,
  explanation,
  answer_key,
  difficulty,
  source_article_id,
  source_vocabulary_id,
  source_grammar_id,
  source_type,
  status,
  generation_metadata
)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', 1, 'single_choice', '「勉強する」の意味として正しいものはどれですか。', null, '勉強する 表示学习。', '{"correct_option_label": "B"}'::jsonb, 1, null, '00000000-0000-0000-0000-000000000101', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000401', 2, 'single_choice', '「予定」に近い意味はどれですか。', null, '予定 表示计划或安排。', '{"correct_option_label": "A"}'::jsonb, 2, null, '00000000-0000-0000-0000-000000000102', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000402', 1, 'single_choice', '文を完成させてください。毎日日本語を聞く＿＿しています。', null, 'ようにする 表示尽量养成行为。', '{"correct_option_label": "C"}'::jsonb, 3, null, null, '00000000-0000-0000-0000-000000000202', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000402', 2, 'single_choice', '「買ったばかりの本」の意味に近いものはどれですか。', null, 'Vたばかり 表示刚刚完成。', '{"correct_option_label": "D"}'::jsonb, 3, null, null, '00000000-0000-0000-0000-000000000203', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000403', 1, 'single_choice', '本文によると、面接前に大切なことは何ですか。', null, '文章指出面试前要掌握公司信息。', '{"correct_option_label": "A"}'::jsonb, 4, '00000000-0000-0000-0000-000000000303', null, null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000404', 1, 'single_choice', '「見解」の使い方として最も自然なものはどれですか。', null, '見解 是正式场景中的观点表达。', '{"correct_option_label": "B"}'::jsonb, 5, null, '00000000-0000-0000-0000-000000000106', null, 'ai_generated', 'published', '{"model": "gpt-5", "prompt_version": "mock-v1", "reviewed_by": "editor"}'::jsonb)
on conflict do nothing;

insert into public.question_options (
  id,
  question_id,
  option_order,
  option_label,
  option_text,
  is_correct,
  explanation
)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 1, 'A', '休む', false, null),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000501', 2, 'B', '学习', true, null),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000501', 3, 'C', '购买', false, null),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000501', 4, 'D', '移动', false, null),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000502', 1, 'A', '计划', true, null),
  ('00000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000502', 2, 'B', '天气', false, null),
  ('00000000-0000-0000-0000-000000000607', '00000000-0000-0000-0000-000000000502', 3, 'C', '价格', false, null),
  ('00000000-0000-0000-0000-000000000608', '00000000-0000-0000-0000-000000000502', 4, 'D', '速度', false, null),
  ('00000000-0000-0000-0000-000000000609', '00000000-0000-0000-0000-000000000503', 1, 'A', 'ために', false, null),
  ('00000000-0000-0000-0000-000000000610', '00000000-0000-0000-0000-000000000503', 2, 'B', 'ばかり', false, null),
  ('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000503', 3, 'C', 'ように', true, null),
  ('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000503', 4, 'D', 'わけで', false, null),
  ('00000000-0000-0000-0000-000000000613', '00000000-0000-0000-0000-000000000504', 1, 'A', '很久以前买的书', false, null),
  ('00000000-0000-0000-0000-000000000614', '00000000-0000-0000-0000-000000000504', 2, 'B', '别人买的书', false, null),
  ('00000000-0000-0000-0000-000000000615', '00000000-0000-0000-0000-000000000504', 3, 'C', '即将买的书', false, null),
  ('00000000-0000-0000-0000-000000000616', '00000000-0000-0000-0000-000000000504', 4, 'D', '刚买的书', true, null),
  ('00000000-0000-0000-0000-000000000617', '00000000-0000-0000-0000-000000000505', 1, 'A', '会社の情報を把握すること', true, null),
  ('00000000-0000-0000-0000-000000000618', '00000000-0000-0000-0000-000000000505', 2, 'B', '朝ご飯を食べること', false, null),
  ('00000000-0000-0000-0000-000000000619', '00000000-0000-0000-0000-000000000505', 3, 'C', '荷物を送ること', false, null),
  ('00000000-0000-0000-0000-000000000620', '00000000-0000-0000-0000-000000000505', 4, 'D', 'チケットを買うこと', false, null),
  ('00000000-0000-0000-0000-000000000621', '00000000-0000-0000-0000-000000000506', 1, 'A', '予定を見解する', false, null),
  ('00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-000000000506', 2, 'B', '専門家の見解を聞く', true, null),
  ('00000000-0000-0000-0000-000000000623', '00000000-0000-0000-0000-000000000506', 3, 'C', '見解に申し込む', false, null),
  ('00000000-0000-0000-0000-000000000624', '00000000-0000-0000-0000-000000000506', 4, 'D', '見解に慣れる', false, null)
on conflict do nothing;

insert into public.wrong_answers (
  id,
  user_id,
  question_id,
  selected_option_id,
  wrong_count,
  last_wrong_at,
  resolved_at,
  notes
)
values
  (
    '00000000-0000-0000-0000-000000000631',
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000503',
    '00000000-0000-0000-0000-000000000609',
    2,
    now() - interval '2 hours',
    null,
    'ようにする と ために の混同'
  ),
  (
    '00000000-0000-0000-0000-000000000632',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000506',
    '00000000-0000-0000-0000-000000000621',
    1,
    now() - interval '4 hours',
    null,
    'N1 語彙の自然な共起'
  )
on conflict do nothing;

insert into public.study_plans (
  id,
  user_id,
  title,
  target_level,
  kind,
  daily_target_minutes,
  days_per_week,
  start_date,
  target_date,
  status,
  source_type,
  generation_metadata
)
values
  ('00000000-0000-0000-0000-000000000701', '11111111-1111-1111-1111-111111111111', 'N3 基础巩固计划', 'N3', 'jlpt', 30, 6, current_date, current_date + 90, 'active', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000702', '22222222-2222-2222-2222-222222222222', 'N2 冲刺计划', 'N2', 'ai_generated', 45, 7, current_date, current_date + 60, 'active', 'ai_generated', '{"model": "gpt-5", "prompt_version": "study-plan-v1"}'::jsonb)
on conflict do nothing;

insert into public.user_vocabulary (
  id,
  user_id,
  vocabulary_id,
  status,
  srs_level,
  correct_count,
  incorrect_count,
  mastery_score,
  last_studied_at,
  next_review_at
)
values
  ('00000000-0000-0000-0000-000000000711', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000101', 'completed', 4, 12, 1, 92, now() - interval '1 hour', now() + interval '3 days'),
  ('00000000-0000-0000-0000-000000000712', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000103', 'in_progress', 2, 5, 2, 58, now() - interval '2 hours', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000000713', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000105', 'in_progress', 3, 8, 3, 71, now() - interval '3 hours', now() + interval '2 days')
on conflict do nothing;

insert into public.user_grammar (
  id,
  user_id,
  grammar_id,
  status,
  srs_level,
  correct_count,
  incorrect_count,
  mastery_score,
  last_studied_at,
  next_review_at
)
values
  ('00000000-0000-0000-0000-000000000721', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000202', 'in_progress', 2, 6, 2, 66, now() - interval '1 day', now() + interval '1 day'),
  ('00000000-0000-0000-0000-000000000722', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000204', 'in_progress', 2, 4, 1, 62, now() - interval '6 hours', now() + interval '1 day')
on conflict do nothing;

insert into public.user_bookmarks (
  id,
  user_id,
  content_type,
  vocabulary_id,
  grammar_id,
  article_id,
  practice_set_id
)
values
  ('00000000-0000-0000-0000-000000000731', '11111111-1111-1111-1111-111111111111', 'vocabulary', '00000000-0000-0000-0000-000000000103', null, null, null),
  ('00000000-0000-0000-0000-000000000732', '11111111-1111-1111-1111-111111111111', 'article', null, null, '00000000-0000-0000-0000-000000000303', null),
  ('00000000-0000-0000-0000-000000000733', '22222222-2222-2222-2222-222222222222', 'practice_set', null, null, null, '00000000-0000-0000-0000-000000000403')
on conflict do nothing;

insert into public.user_progress (
  id,
  user_id,
  content_type,
  vocabulary_id,
  grammar_id,
  article_id,
  practice_set_id,
  status,
  mastery_score,
  review_stage,
  last_studied_at,
  next_review_at,
  completed_at
)
values
  ('00000000-0000-0000-0000-000000000741', '11111111-1111-1111-1111-111111111111', 'vocabulary', '00000000-0000-0000-0000-000000000101', null, null, null, 'completed', 92, 4, now() - interval '1 hour', now() + interval '3 days', now() - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000742', '11111111-1111-1111-1111-111111111111', 'grammar', null, '00000000-0000-0000-0000-000000000202', null, null, 'in_progress', 66, 2, now() - interval '1 day', now() + interval '1 day', null),
  ('00000000-0000-0000-0000-000000000743', '11111111-1111-1111-1111-111111111111', 'article', null, null, '00000000-0000-0000-0000-000000000303', null, 'in_progress', 48, 1, now() - interval '2 days', null, null),
  ('00000000-0000-0000-0000-000000000744', '22222222-2222-2222-2222-222222222222', 'practice_set', null, null, null, '00000000-0000-0000-0000-000000000403', 'in_progress', 36, 1, now() - interval '4 hours', null, null)
on conflict do nothing;

insert into public.study_sessions (
  id,
  user_id,
  study_plan_id,
  practice_set_id,
  session_type,
  target_level,
  started_at,
  ended_at,
  duration_seconds,
  items_completed,
  correct_count,
  incorrect_count,
  notes,
  session_summary
)
values
  ('00000000-0000-0000-0000-000000000751', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000401', 'practice', 'N5', now() - interval '1 day 20 minutes', now() - interval '1 day', 1200, 12, 10, 2, 'N5 词汇热身', '{"accuracy": 83}'::jsonb),
  ('00000000-0000-0000-0000-000000000752', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000701', null, 'study', 'N3', now() - interval '2 hours', now() - interval '90 minutes', 1800, 8, 0, 0, '语法与文章学习', '{"modules": ["grammar", "reading"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000753', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000403', 'practice', 'N2', now() - interval '4 hours', now() - interval '3 hours 15 minutes', 2700, 18, 15, 3, 'N2 阅读理解训练', '{"accuracy": 83, "pro": true}'::jsonb)
on conflict do nothing;

insert into public.daily_study_tasks (
  id,
  user_id,
  task_date,
  task_type,
  title,
  description,
  target_level,
  target_count,
  completed_count,
  target_minutes,
  completed_minutes,
  status,
  accuracy,
  href,
  source_type,
  generation_metadata
)
values
  ('00000000-0000-0000-0000-000000000761', '11111111-1111-1111-1111-111111111111', current_date, 'vocabulary', 'N3 单词 20 个', '先复习高频单词，再标记不熟悉词。', 'N3', 20, 10, 11, 6, 'in_progress', 88, '/vocabulary?level=N3', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000762', '11111111-1111-1111-1111-111111111111', current_date, 'grammar', 'N3 语法 3 个', '学习结构、例句和相近语法。', 'N3', 3, 1, 8, 4, 'in_progress', 82, '/grammar?level=N3', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000763', '11111111-1111-1111-1111-111111111111', current_date, 'reading', 'N3 阅读 1 篇', '用一篇短文把词汇和语法放回语境。', 'N3', 1, 0, 6, 0, 'not_started', null, '/reading?level=N3', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000764', '11111111-1111-1111-1111-111111111111', current_date, 'practice', 'N3 练习 10 题', '完成基础练习并记录正确率。', 'N3', 10, 0, 5, 0, 'not_started', null, '/practice?level=N3', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000765', '22222222-2222-2222-2222-222222222222', current_date, 'vocabulary', 'N2 单词 20 个', '先复习高频单词，再标记不熟悉词。', 'N2', 20, 16, 16, 14, 'in_progress', 91, '/vocabulary?level=N2', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000766', '22222222-2222-2222-2222-222222222222', current_date, 'grammar', 'N2 语法 3 个', '学习结构、例句和相近语法。', 'N2', 3, 2, 11, 8, 'in_progress', 86, '/grammar?level=N2', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000767', '22222222-2222-2222-2222-222222222222', current_date, 'reading', 'N2 阅读 1 篇', '用一篇短文把词汇和语法放回语境。', 'N2', 1, 0, 9, 0, 'not_started', null, '/reading?level=N2', 'manual', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000768', '22222222-2222-2222-2222-222222222222', current_date, 'practice', 'N2 练习 10 题', '完成进阶练习并记录正确率。', 'N2', 10, 0, 9, 0, 'not_started', null, '/practice?level=N2', 'manual', '{}'::jsonb)
on conflict (user_id, task_date, task_type) do update
set
  title = excluded.title,
  description = excluded.description,
  target_level = excluded.target_level,
  target_count = excluded.target_count,
  completed_count = excluded.completed_count,
  target_minutes = excluded.target_minutes,
  completed_minutes = excluded.completed_minutes,
  status = excluded.status,
  accuracy = excluded.accuracy,
  href = excluded.href,
  source_type = excluded.source_type,
  generation_metadata = excluded.generation_metadata;

insert into public.vocabulary (
  id,
  slug,
  level,
  word,
  kana,
  reading,
  romaji,
  meaning,
  part_of_speech,
  notes,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at,
  pitch_accent,
  category,
  synonyms,
  antonyms
)
values
  ('00000000-0000-0000-0000-000000000101', 'n5-benkyou-suru', 'N5', '勉強する', 'べんきょうする', 'べんきょうする', 'benkyou suru', '学习；用功', 'verb', '基础动词，常用于日常学习场景。', 'free', 'manual', 'published', '{}'::jsonb, now(), '0', 'verbs', array['学ぶ'], array[]::text[]),
  ('00000000-0000-0000-0000-000000000107', 'n5-taberu', 'N5', '食べる', 'たべる', 'たべる', 'taberu', '吃', 'verb', '一段动词，N5 高频基础词。', 'free', 'manual', 'published', '{}'::jsonb, now(), '2', 'verbs', array['食事する'], array[]::text[]),
  ('00000000-0000-0000-0000-000000000102', 'n4-yotei', 'N4', '予定', 'よてい', 'よてい', 'yotei', '计划；安排', 'noun', '常用于说明日程安排。', 'free', 'manual', 'published', '{}'::jsonb, now(), '0', 'nouns', array['計画', 'スケジュール'], array[]::text[]),
  ('00000000-0000-0000-0000-000000000108', 'n4-tetsudau', 'N4', '手伝う', 'てつだう', 'てつだう', 'tetsudau', '帮助；帮忙', 'verb', '五段动词，常用于请求和日常协作。', 'free', 'manual', 'published', '{}'::jsonb, now(), '3', 'verbs', array['助ける'], array['邪魔する']),
  ('00000000-0000-0000-0000-000000000103', 'n3-haaku-suru', 'N3', '把握する', 'はあくする', 'はあくする', 'haaku suru', '掌握；理解', 'verb', '常用于状况、内容、整体情况的理解。', 'free', 'manual', 'published', '{}'::jsonb, now(), '0', 'verbs', array['理解する', 'つかむ'], array[]::text[]),
  ('00000000-0000-0000-0000-000000000104', 'n3-nareru', 'N3', '慣れる', 'なれる', 'なれる', 'nareru', '习惯；适应', 'verb', '常用于环境、生活、工作适应。', 'free', 'manual', 'published', '{}'::jsonb, now(), '2', 'verbs', array['適応する'], array['戸惑う']),
  ('00000000-0000-0000-0000-000000000105', 'n2-moushikomu', 'N2', '申し込む', 'もうしこむ', 'もうしこむ', 'moushikomu', '申请；报名', 'verb', '较正式表达，常用于手续、活动、课程。', 'pro', 'manual', 'published', '{}'::jsonb, now(), '4', 'verbs', array['申請する', '応募する'], array['取り消す']),
  ('00000000-0000-0000-0000-000000000109', 'n2-sakugen', 'N2', '削減', 'さくげん', 'さくげん', 'sakugen', '削减；缩减', 'noun', '常用于成本、时间、人力等正式语境。', 'pro', 'manual', 'published', '{}'::jsonb, now(), '0', 'nouns', array['縮小', 'カット'], array['増加']),
  ('00000000-0000-0000-0000-000000000106', 'n1-kenkai', 'N1', '見解', 'けんかい', 'けんかい', 'kenkai', '见解；观点', 'noun', '用于正式场景中的观点表达。', 'pro', 'ai_generated', 'published', '{"reviewed_by": "editor", "model": "gpt-5"}'::jsonb, now(), '0', 'nouns', array['意見', '見方'], array[]::text[]),
  ('00000000-0000-0000-0000-000000000110', 'n1-hanron', 'N1', '反論', 'はんろん', 'はんろん', 'hanron', '反驳；反论', 'noun', '议论文、讨论和商务会议中常见。', 'pro', 'manual', 'published', '{}'::jsonb, now(), '0', 'nouns', array['異議', '抗弁'], array['賛成'])
on conflict (id) do update
set
  slug = excluded.slug,
  level = excluded.level,
  word = excluded.word,
  kana = excluded.kana,
  reading = excluded.reading,
  romaji = excluded.romaji,
  meaning = excluded.meaning,
  part_of_speech = excluded.part_of_speech,
  notes = excluded.notes,
  access_tier = excluded.access_tier,
  source_type = excluded.source_type,
  status = excluded.status,
  generation_metadata = excluded.generation_metadata,
  published_at = excluded.published_at,
  pitch_accent = excluded.pitch_accent,
  category = excluded.category,
  synonyms = excluded.synonyms,
  antonyms = excluded.antonyms;

insert into public.vocabulary_examples (
  id,
  vocabulary_id,
  example_order,
  japanese_text,
  translation,
  notes
)
values
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000101', 1, '毎日30分日本語を勉強します。', '我每天学习 30 分钟日语。', null),
  ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000107', 1, '朝ご飯を食べました。', '我吃了早饭。', null),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000102', 1, '明日の予定を確認します。', '确认明天的安排。', null),
  ('00000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000108', 1, '友達の引っ越しを手伝いました。', '我帮朋友搬家了。', null),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000103', 1, '状況を正しく把握する必要があります。', '有必要正确掌握情况。', null),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000104', 1, '新しい環境に少しずつ慣れてきました。', '逐渐习惯了新的环境。', null),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000105', 1, '来月の講座に申し込みました。', '我报名了下个月的课程。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000109', 1, '会議の時間を削減する方針です。', '方针是缩短会议时间。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000106', 1, '専門家の見解を参考にします。', '参考专家的见解。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000110', 1, '彼の意見に対して反論しました。', '我对他的意见提出了反驳。', 'PRO 例句')
on conflict (id) do update
set
  vocabulary_id = excluded.vocabulary_id,
  example_order = excluded.example_order,
  japanese_text = excluded.japanese_text,
  translation = excluded.translation,
  notes = excluded.notes;

insert into public.grammar (
  id,
  slug,
  level,
  title,
  pattern,
  meaning,
  usage_notes,
  notes,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at,
  similar_grammar
)
values
  ('00000000-0000-0000-0000-000000000206', 'n5-desu', 'N5', '〜です', 'Noun / Na-adjective + です', '表示礼貌判断或说明。', '用于名词句和な形容词句，是最基础的礼貌体。', '注意普通体是「だ」。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜だ', '〜である']),
  ('00000000-0000-0000-0000-000000000207', 'n5-masenka', 'N5', '〜ませんか', 'Verb ます-stem + ませんか', '表示礼貌邀请。', '常用于邀请对方一起做某事，比直接命令更自然。', '回答时可用「いいですね」「すみません、ちょっと」。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜ましょう', '〜ません']),
  ('00000000-0000-0000-0000-000000000201', 'n4-te-shimau', 'N4', '〜てしまう', 'Verb て-form + しまう', '表示完成、遗憾或不小心做了某事。', '根据语境可表示动作完成，也可带有后悔、遗憾的语气。口语中常变为「ちゃう / じゃう」。', '不要把所有「てしまう」都理解成负面。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜ておく', '〜てある']),
  ('00000000-0000-0000-0000-000000000208', 'n4-yotei-da', 'N4', '〜予定だ', 'Verb dictionary-form / Noun + の + 予定だ', '表示已经安排好的计划。', '用于说明日程、旅行、会议、学习计划等。', '比单纯的「つもり」更偏客观安排。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜つもりだ', '〜ことになっている']),
  ('00000000-0000-0000-0000-000000000202', 'n3-youni-suru', 'N3', '〜ようにする', 'Verb dictionary-form / Verb ない-form + ようにする', '表示努力养成或避免某种习惯。', '强调有意识地持续做某事，常用于学习、生活习惯和自我管理。', '「〜ようになる」强调变化结果，「〜ようにする」强调人为努力。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜ようになる', '〜ことにする']),
  ('00000000-0000-0000-0000-000000000203', 'n3-bakari', 'N3', '〜ばかり', 'Verb て-form + ばかり / Noun + ばかり', '表示刚刚完成，或只做某事。', '「Vたばかり」表示刚做完；「Nばかり」可表示偏向、过多。', '注意和「〜ところ」的语感差异。', 'free', 'manual', 'published', '{}'::jsonb, now(), array['〜ところ', '〜だけ']),
  ('00000000-0000-0000-0000-000000000204', 'n2-wake-dewa-nai', 'N2', '〜わけではない', 'Plain form + わけではない', '表示并非完全如此。', '用于缓和否定，说明不是百分之百成立。', '常与「全部」「必ずしも」等搭配。', 'pro', 'manual', 'published', '{}'::jsonb, now(), array['〜とは限らない', '〜わけがない']),
  ('00000000-0000-0000-0000-000000000209', 'n2-ni-shitagatte', 'N2', '〜にしたがって', 'Noun / Verb dictionary-form + にしたがって', '表示随着前项变化，后项也随之变化。', '用于说明比例变化、阶段变化或趋势。书面语和正式说明中常见。', '与「〜につれて」接近，但更正式。', 'pro', 'manual', 'published', '{}'::jsonb, now(), array['〜につれて', '〜とともに']),
  ('00000000-0000-0000-0000-000000000205', 'n1-ni-chigainai', 'N1', '〜に違いない', 'Plain form + に違いない', '表示说话人强烈推测。', '用于根据证据作出较有把握的判断，可用于书面和正式表达。', '比「〜だろう」更确信。', 'pro', 'manual', 'published', '{"reviewed_by": "editor", "model": "gpt-5"}'::jsonb, now(), array['〜に相違ない', '〜はずだ']),
  ('00000000-0000-0000-0000-000000000210', 'n1-to-iedomo', 'N1', '〜といえども', 'Noun / Plain form + といえども', '即使是……也……。', '用于正式或书面语，承认前项身份、条件或事实，但后项仍不例外。', '比「〜でも」更正式。', 'pro', 'manual', 'published', '{}'::jsonb, now(), array['〜とはいえ', '〜であっても'])
on conflict (id) do update
set
  slug = excluded.slug,
  level = excluded.level,
  title = excluded.title,
  pattern = excluded.pattern,
  meaning = excluded.meaning,
  usage_notes = excluded.usage_notes,
  notes = excluded.notes,
  access_tier = excluded.access_tier,
  source_type = excluded.source_type,
  status = excluded.status,
  generation_metadata = excluded.generation_metadata,
  published_at = excluded.published_at,
  similar_grammar = excluded.similar_grammar;

insert into public.grammar_examples (
  id,
  grammar_id,
  example_order,
  japanese_text,
  translation,
  notes
)
values
  ('00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000206', 1, 'これは日本語の本です。', '这是日语书。', null),
  ('00000000-0000-0000-0000-000000000217', '00000000-0000-0000-0000-000000000207', 1, '一緒に図書館へ行きませんか。', '要不要一起去图书馆？', null),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000201', 1, '宿題を忘れてしまいました。', '我不小心忘记作业了。', null),
  ('00000000-0000-0000-0000-000000000218', '00000000-0000-0000-0000-000000000208', 1, '来週、京都へ行く予定です。', '下周计划去京都。', null),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000202', 1, '毎日日本語を聞くようにしています。', '我尽量每天听日语。', null),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000203', 1, '買ったばかりの本を読みました。', '读了刚买的书。', null),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000204', 1, '日本語が嫌いなわけではありません。', '并不是讨厌日语。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000219', '00000000-0000-0000-0000-000000000209', 1, '経験を積むにしたがって、自信がついてきました。', '随着经验积累，我逐渐有了自信。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000205', 1, '彼はもう事情を知っているに違いありません。', '他一定已经知道情况了。', 'PRO 例句'),
  ('00000000-0000-0000-0000-000000000220', '00000000-0000-0000-0000-000000000210', 1, '専門家といえども、間違えることはあります。', '即使是专家，也会有出错的时候。', 'PRO 例句')
on conflict (id) do update
set
  grammar_id = excluded.grammar_id,
  example_order = excluded.example_order,
  japanese_text = excluded.japanese_text,
  translation = excluded.translation,
  notes = excluded.notes;

insert into public.practice_sets (
  id,
  slug,
  level,
  title,
  description,
  kind,
  is_jlpt_style,
  access_tier,
  source_type,
  status,
  generation_metadata,
  published_at
)
values
  ('00000000-0000-0000-0000-000000000401', 'n5-vocabulary-warmup', 'N5', 'N5 词汇热身', '用高频基础词做快速选择和填空，适合每日开场练习。', 'vocabulary', false, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000402', 'n3-grammar-mixed', 'N3', 'N3 语法综合练习', '围绕常见句型做辨析、填空和语境判断。', 'grammar', false, 'free', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000403', 'n2-reading-training', 'N2', 'N2 阅读理解训练', '原创短文阅读，训练信息定位、主旨判断和语法线索。', 'reading', true, 'pro', 'manual', 'published', '{}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000404', 'n1-original-mock', 'N1', 'JLPT N1 原创专项', '按 JLPT 风格组织的原创高阶词汇和语法练习。', 'jlpt_mock', true, 'pro', 'ai_generated', 'published', '{"model": "gpt-5", "prompt_version": "mock-v1", "reviewed_by": "editor"}'::jsonb, now()),
  ('00000000-0000-0000-0000-000000000405', 'n4-mixed-basics', 'N4', 'N4 综合基础练习', '把词汇、语法和短阅读组合在一套轻量练习里。', 'mixed', false, 'free', 'manual', 'published', '{}'::jsonb, now())
on conflict (id) do update
set
  slug = excluded.slug,
  level = excluded.level,
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  is_jlpt_style = excluded.is_jlpt_style,
  access_tier = excluded.access_tier,
  source_type = excluded.source_type,
  status = excluded.status,
  generation_metadata = excluded.generation_metadata,
  published_at = excluded.published_at;

insert into public.questions (
  id,
  practice_set_id,
  sort_order,
  question_type,
  prompt,
  hint,
  explanation,
  answer_key,
  difficulty,
  source_article_id,
  source_vocabulary_id,
  source_grammar_id,
  source_type,
  status,
  generation_metadata
)
values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', 1, 'single_choice', '「勉強する」の意味として正しいものはどれですか。', null, '「勉強する」は学习、用功的意思。', '{"correct_option_labels": ["B"]}'::jsonb, 1, null, '00000000-0000-0000-0000-000000000101', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000401', 2, 'single_choice', '「予定」に近い意味はどれですか。', null, '「予定」は计划、安排的意思。', '{"correct_option_labels": ["A"]}'::jsonb, 2, null, '00000000-0000-0000-0000-000000000102', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000402', 1, 'single_choice', '文を完成させてください。毎日日本語を聞く＿＿しています。', null, '「ようにする」表示努力养成或避免某种习惯。', '{"correct_option_labels": ["C"]}'::jsonb, 3, null, null, '00000000-0000-0000-0000-000000000202', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000402', 2, 'single_choice', '「買ったばかりの本」の意味に近いものはどれですか。', null, '「Vたばかり」表示刚刚完成某个动作。', '{"correct_option_labels": ["D"]}'::jsonb, 3, null, null, '00000000-0000-0000-0000-000000000203', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000403', 1, 'reading_comprehension', '本文によると、面接前に大切なことは何ですか。', '面接の前には、会社の事業内容だけでなく、自分がその会社で何をしたいのかを整理しておくことが大切です。準備が十分であれば、質問に落ち着いて答えられます。', '短文中明确提到，面试前要整理公司信息以及自己想在公司做什么。', '{"correct_option_labels": ["A"]}'::jsonb, 4, '00000000-0000-0000-0000-000000000303', null, null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000404', 1, 'single_choice', '「見解」の使い方として最も自然なものはどれですか。', null, '「見解」は正式场景中表示观点、看法的名词。', '{"correct_option_labels": ["B"]}'::jsonb, 5, null, '00000000-0000-0000-0000-000000000106', null, 'ai_generated', 'published', '{"model": "gpt-5", "prompt_version": "mock-v1", "reviewed_by": "editor"}'::jsonb),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000401', 3, 'fill_blank', '文を完成させてください。朝ごはんを＿＿。', '答えは普通形でも丁寧形でもかまいません。', '「食べる / 食べます」は吃的意思，和「朝ごはん」搭配自然。', '{"correct_text": ["食べます", "食べる"]}'::jsonb, 1, null, '00000000-0000-0000-0000-000000000107', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000402', 3, 'fill_blank', '文を完成させてください。忘れない＿＿、メモしておきます。', null, '「忘れないように」表示为了避免忘记而采取行动。', '{"correct_text": ["ように"]}'::jsonb, 3, null, null, '00000000-0000-0000-0000-000000000202', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000405', 1, 'multiple_choice', '予定や安排に近い意味で使えるものをすべて選んでください。', null, '「予定」と「スケジュール」は计划、安排に近い意味で使えます。', '{"correct_option_labels": ["A", "C"]}'::jsonb, 2, null, '00000000-0000-0000-0000-000000000102', null, 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000405', 2, 'reading_comprehension', '本文の内容と合っているものはどれですか。', '来週の発表に向けて、ミカさんは毎日少しずつ資料を確認しています。難しい言葉はノートにまとめ、発表の日までに説明できるように練習しています。', '文章说她每天确认资料、整理难词，并练习到能说明。', '{"correct_option_labels": ["C"]}'::jsonb, 2, null, null, '00000000-0000-0000-0000-000000000202', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000403', 2, 'fill_blank', '文を完成させてください。経験を積む＿＿、自信がついてきました。', null, '「にしたがって」表示随着前项变化，后项也发生变化。', '{"correct_text": ["にしたがって", "に従って"]}'::jsonb, 4, null, null, '00000000-0000-0000-0000-000000000209', 'manual', 'published', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000404', 2, 'multiple_choice', '「といえども」の使い方として自然なものをすべて選んでください。', null, '「といえども」は即使是某种身份或条件，也不例外。正式语体中常见。', '{"correct_option_labels": ["B", "D"]}'::jsonb, 5, null, null, '00000000-0000-0000-0000-000000000210', 'ai_generated', 'published', '{"model": "gpt-5", "prompt_version": "mock-v1", "reviewed_by": "editor"}'::jsonb)
on conflict (id) do update
set
  practice_set_id = excluded.practice_set_id,
  sort_order = excluded.sort_order,
  question_type = excluded.question_type,
  prompt = excluded.prompt,
  hint = excluded.hint,
  explanation = excluded.explanation,
  answer_key = excluded.answer_key,
  difficulty = excluded.difficulty,
  source_article_id = excluded.source_article_id,
  source_vocabulary_id = excluded.source_vocabulary_id,
  source_grammar_id = excluded.source_grammar_id,
  source_type = excluded.source_type,
  status = excluded.status,
  generation_metadata = excluded.generation_metadata;

insert into public.question_options (
  id,
  question_id,
  option_order,
  option_label,
  option_text,
  is_correct,
  explanation
)
values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 1, 'A', '休む', false, null),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000501', 2, 'B', '学习', true, '勉強する = 学习、用功。'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000501', 3, 'C', '购买', false, null),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000501', 4, 'D', '移动', false, null),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000502', 1, 'A', '计划', true, '予定 = 计划、安排。'),
  ('00000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000502', 2, 'B', '天气', false, null),
  ('00000000-0000-0000-0000-000000000607', '00000000-0000-0000-0000-000000000502', 3, 'C', '价格', false, null),
  ('00000000-0000-0000-0000-000000000608', '00000000-0000-0000-0000-000000000502', 4, 'D', '速度', false, null),
  ('00000000-0000-0000-0000-000000000609', '00000000-0000-0000-0000-000000000503', 1, 'A', 'ために', false, null),
  ('00000000-0000-0000-0000-000000000610', '00000000-0000-0000-0000-000000000503', 2, 'B', 'ばかり', false, null),
  ('00000000-0000-0000-0000-000000000611', '00000000-0000-0000-0000-000000000503', 3, 'C', 'ように', true, '「聞くようにしています」表示努力养成听日语的习惯。'),
  ('00000000-0000-0000-0000-000000000612', '00000000-0000-0000-0000-000000000503', 4, 'D', 'わけ', false, null),
  ('00000000-0000-0000-0000-000000000613', '00000000-0000-0000-0000-000000000504', 1, 'A', '很久以前买的书', false, null),
  ('00000000-0000-0000-0000-000000000614', '00000000-0000-0000-0000-000000000504', 2, 'B', '别人买的书', false, null),
  ('00000000-0000-0000-0000-000000000615', '00000000-0000-0000-0000-000000000504', 3, 'C', '即将买的书', false, null),
  ('00000000-0000-0000-0000-000000000616', '00000000-0000-0000-0000-000000000504', 4, 'D', '刚买的书', true, 'Vたばかり = 刚刚做完某事。'),
  ('00000000-0000-0000-0000-000000000617', '00000000-0000-0000-0000-000000000505', 1, 'A', '整理公司信息和自己的目标', true, '文章中同时提到公司信息和自己想做的事。'),
  ('00000000-0000-0000-0000-000000000618', '00000000-0000-0000-0000-000000000505', 2, 'B', '提前决定早餐内容', false, null),
  ('00000000-0000-0000-0000-000000000619', '00000000-0000-0000-0000-000000000505', 3, 'C', '把行李寄到公司', false, null),
  ('00000000-0000-0000-0000-000000000620', '00000000-0000-0000-0000-000000000505', 4, 'D', '取消所有问题准备', false, null),
  ('00000000-0000-0000-0000-000000000621', '00000000-0000-0000-0000-000000000506', 1, 'A', '予定を見解する', false, null),
  ('00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-000000000506', 2, 'B', '専門家の見解を聞く', true, '「見解を聞く」は自然な搭配。'),
  ('00000000-0000-0000-0000-000000000623', '00000000-0000-0000-0000-000000000506', 3, 'C', '見解に申し込む', false, null),
  ('00000000-0000-0000-0000-000000000624', '00000000-0000-0000-0000-000000000506', 4, 'D', '見解に慣れる', false, null),
  ('00000000-0000-0000-0000-000000000625', '00000000-0000-0000-0000-000000000509', 1, 'A', '予定', true, null),
  ('00000000-0000-0000-0000-000000000626', '00000000-0000-0000-0000-000000000509', 2, 'B', '天気', false, null),
  ('00000000-0000-0000-0000-000000000627', '00000000-0000-0000-0000-000000000509', 3, 'C', 'スケジュール', true, null),
  ('00000000-0000-0000-0000-000000000628', '00000000-0000-0000-0000-000000000509', 4, 'D', '値段', false, null),
  ('00000000-0000-0000-0000-000000000629', '00000000-0000-0000-0000-000000000510', 1, 'A', 'ミカさんは発表をやめました。', false, null),
  ('00000000-0000-0000-0000-000000000630', '00000000-0000-0000-0000-000000000510', 2, 'B', 'ミカさんは資料を一度も確認していません。', false, null),
  ('00000000-0000-0000-0000-000000000631', '00000000-0000-0000-0000-000000000510', 3, 'C', 'ミカさんは説明できるように練習しています。', true, null),
  ('00000000-0000-0000-0000-000000000632', '00000000-0000-0000-0000-000000000510', 4, 'D', 'ミカさんは難しい言葉を避けています。', false, null),
  ('00000000-0000-0000-0000-000000000633', '00000000-0000-0000-0000-000000000512', 1, 'A', '駅といえども、切符を買いました。', false, null),
  ('00000000-0000-0000-0000-000000000634', '00000000-0000-0000-0000-000000000512', 2, 'B', '専門家といえども、間違えることはあります。', true, null),
  ('00000000-0000-0000-0000-000000000635', '00000000-0000-0000-0000-000000000512', 3, 'C', '雨といえども、かばんを読みました。', false, null),
  ('00000000-0000-0000-0000-000000000636', '00000000-0000-0000-0000-000000000512', 4, 'D', '新人といえども、基本的な確認は必要です。', true, null)
on conflict (id) do update
set
  question_id = excluded.question_id,
  option_order = excluded.option_order,
  option_label = excluded.option_label,
  option_text = excluded.option_text,
  is_correct = excluded.is_correct,
  explanation = excluded.explanation;

insert into public.wrong_answers (
  id,
  user_id,
  question_id,
  selected_option_id,
  wrong_count,
  last_wrong_at,
  resolved_at,
  notes
)
values
  ('00000000-0000-0000-0000-000000000631', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000508', null, 2, now() - interval '2 hours', null, 'text=ために'),
  ('00000000-0000-0000-0000-000000000632', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000633', 1, now() - interval '4 hours', null, 'options=A')
on conflict (id) do update
set
  user_id = excluded.user_id,
  question_id = excluded.question_id,
  selected_option_id = excluded.selected_option_id,
  wrong_count = excluded.wrong_count,
  last_wrong_at = excluded.last_wrong_at,
  resolved_at = excluded.resolved_at,
  notes = excluded.notes;

commit;
