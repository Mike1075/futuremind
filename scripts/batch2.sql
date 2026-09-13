
-- Project 7: 第四阶段：意识地理学
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    7,
    '第四阶段：意识地理学',
    'Consciousness Cartography | 18岁以上 | 8周',
    '引入“形态场”、“集体无意识”和“地方精神”（Genus Loci）的概念。通过一个集体参与的、基于移动应用的“地理情绪标记”项目，尝试将特定地理空间的“能量质感”或“信息场”进行数据化和可视化，绘制出属于自己城市的第一张“情绪地图”或“意识地图”。',
    '["引入“形态场”、“集体无意识”和“地方精神”（Genus Loci）的概念", "通过一个集体参与的、基于移动应用的“地理情绪标记”项目，尝试将特定地理空间的“能量质感”或“信息场”进行数据化和可视化，绘制出属于自己城市的第一张“情绪地图”或“意识地图”"]'::jsonb,
    '合作完成一份包含数据可视化地图的《城市意识场初步探测报告》，并参与一次关于“空间、记忆与集体意识”的线上研讨会。 第一周：城市有“灵魂”吗？——内在感知的唤醒 (Days 1-7) 本周目标： 理解“地方精神”（Genus Loci）和“形态场”在地理空间层面的应用。学习并实践基础的“内在感知”或“正念行走”技巧，校准并提升自己作为“人体传感器”的灵敏度。 【第一周 | Day 1-3】理论的基石：从集体无意识到“地方精神” (The Theoretical Bedrock: From Collective Unconscious to Genus Loci) (任务时长：约90分钟，可在3天内完成) 欢迎来到“伊卡洛斯计划”中最具深度体验性的项目之一。在这里，我们将不再局限于个体或小群体，而是将我们的感知力，投向我们生活的整个城市、整片大地。 我们要探索一个古老而又前沿的问题：地方，是否有记忆？城市，是否有“灵魂”？ 心理学大师卡尔·荣格认为，在我们的个体意识之下，存在着一个更深邃的、全人类共享的“集体无意识”海洋。这个海洋中，流淌着人类千百万年积累下来的神话、原型和集体记忆。我们每',
    '18岁以上',
    8,
    '模块二：无形的地图 (The Unseen Leash)',
    7,
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();


-- Project 8: 第一阶段：情绪的颜色
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    8,
    '第一阶段：情绪的颜色',
    'The Color of Emotions | 6-10岁 | 4周',
    '通过一个简单的、游戏化的“心灵感应”实验，引导孩子们探索人与人之间非言语的情绪感知能力。学习并实践基础的实验规则（排除感官干扰），并使用“情绪日记”进行初步的数据记录和分析。',
    '["通过一个简单的、游戏化的“心灵感应”实验，引导孩子们探索人与人之间非言语的情绪感知能力", "学习并实践基础的实验规则（排除感官干扰），并使用“情绪日记”进行初步的数据记录和分析"]'::jsonb,
    '一份包含数据图表的《我的“情绪天线”测试报告》，并录制一个短视频分享自己最神奇的一次“猜心”经历。 第一周：秘密的语言——学习感受情绪 (Days 1-7) 本周目标： 引入“非言语情绪感知”的概念，激发学员的兴趣。学习并亲手制作本次实验的核心工具——“情绪闪卡”。理解并掌握实验的基本规则，并与家人完成第一次充满乐趣的“心灵感应”练习。 【第一周 | Day 1-2】一个新“超能力”：你也能“读心”吗？ (A New ''Superpower'': Can You ''Read'' Minds?) (任务时长：约30分钟，可在2天内完成) 欢迎来到“伊卡洛斯计划”的第三个模块！这一次，我们将探索一个隐藏在我们每个人身上的、最神奇的“超能力”——感受他人情绪的能力。 你有没有过这样的经历：有时候，你的好朋友一句话也没说，但你就是“感觉”到他今天不开心？或者，妈妈走进房间时，你立刻就感到了一种温暖和快乐？ 这种不用语言就能感受到的“悄悄话”，就是我们要探索的秘密。 莉莉和汤姆是最好的朋友。他们有一个秘密：他们总能知道对方在想什么。 有一天，老师在课堂上发回了画画作业。莉莉的画得了一朵小红花，她心里',
    '6-10岁',
    4,
    '模块三：延展的心灵 (The Extended Mind)',
    8,
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();


-- Project 9: 第二阶段：跨越距离的凝视
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    9,
    '第二阶段：跨越距离的凝视',
    'Gaze Across the Distance | 11-15岁 | 6周',
    '深入探索“被凝-视感”（The Sense of Being Stared At）这一普遍的人类体验。通过设计并执行一个使用现代科技（如视频通话）进行物理隔离的、严格随机化的双盲实验，来检验“被凝视感”是否是一种超越了已知感官的、非定域性的感知能力。',
    '["深入探索“被凝-视感”（The Sense of Being Stared At）这一普遍的人类体验", "通过设计并执行一个使用现代科技（如视频通话）进行物理隔离的、严格随机化的双盲实验，来检验“被凝视感”是否是一种超越了已知感官的、非定域性的感知能力"]'::jsonb,
    '一份包含多轮次实验数据和统计分析的《关于“远程被凝视感”现象的初步研究报告》，并参与一次关于“感知边界”的线上辩论会。 第一周：看不见的眼睛——“被凝视感”的科学挑战 (Days 1-7) 本周目标： 了解“被凝视感”的历史、文化普遍性及其在科学上引发的争议。学习并能够阐述支持和反对该现象的“微妙感官线索”假说，并基于此设计一个能够初步排除这些线索的本地实验方案。 【第一周 | Day 1-3】你背后有“眼睛”吗？ (Do You Have ''Eyes'' in the Back of Your Head?) (任务时长：约75分钟，可在3天内完成) 欢迎来到一个全新的探索领域。这次，我们的研究对象既不是宠物，也不是植物，而是我们自己——人类那神秘莫测的感知系统。 请先回想一下，你是否有过这样的经历： 在一个安静的图书馆里，你正在专心阅读。突然，你感到一种难以言喻的不安，感觉好像有人在背后盯着你。你猛地一回头，发现远处真的有一个人正在注视着你。 或者，在一个拥挤的公交车上，你无聊地看着前面一个人的后脑勺。你只是随意地看着，并没有发出任何声音。几秒钟后，那个人却像是被针扎了一下，不自然地摸',
    '11-15岁',
    6,
    '模块三：延展的心灵 (The Extended Mind)',
    9,
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();


-- Project 10: 第三阶段：意念撼动概率
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    10,
    '第三阶段：意念撼动概率',
    'Mind Over Randomness | 16-18岁 | 10周',
    '复现并升级经典的PEAR实验室及全球意识项目的核心实验。通过设计并执行一个基于“真随机数生成器”（RNG）的、严格对照的意念影响实验，来检验人类的个体或集体意念，是否能对纯粹的物理概率事件产生微小但统计显著的影响。 - 最终成果： 一份包含海量数据（数万次试验）统计分析的《关于意念对随机事件影响的探索性研究报告》，并参与一次关于“意识在物理世界中扮演的角色”的线上研讨会。 --- 第一周：掷骰子的上帝——随机性与意识的战场 (Days 1-7) 本周目标： 理解“真随机”与“伪随机”的核心区别，并认识到“量子随机性”作为宇宙底层“纯粹偶然性”的来源。了解意念影响随机数（PK）研究的历史背景（PEAR实验室）及其深刻的哲学挑战。 --- 【第一周 | Day 1-3】宇宙的“硬币”：什么是“真随机”？ (The Universe''s Coin: What is ''True Randomness''?) (任务时长：约90分钟，可在3天内完成) 研究员，在之前的项目中，我们探索了意识能否跨越空间，影响另一个“意识”（人或动物）。现在，我们要问一个更根本、更令人不安的问题： 意识，能否直接撼动',
    '["复现并升级经典的PEAR实验室及全球意识项目的核心实验", "通过设计并执行一个基于“真随机数生成器”（RNG）的、严格对照的意念影响实验，来检验人类的个体或集体意念，是否能对纯粹的物理概率事件产生微小但统计显著的影响", "- 最终成果： 一份包含海量数据（数万次试验）统计分析的《关于意念对随机事件影响的探索性研究报告》，并参与一次关于“意识在物理世界中扮演的角色”的线上研讨会", "--- 第一周：掷骰子的上帝——随机性与意识的战场 (Days 1-7) 本周目标： 理解“真随机”与“伪随机”的核心区别，并认识到“量子随机性”作为宇宙底层“纯粹偶然性”的来源", "了解意念影响随机数（PK）研究的历史背景（PEAR实验室）及其深刻的哲学挑战"]'::jsonb,
    '一份包含海量数据（数万次试验）统计分析的《关于意念对随机事件影响的探索性研究报告》，并参与一次关于“意识在物理世界中扮演的角色”的线上研讨会。',
    '16-18岁',
    10,
    '模块三：延展的心灵 (The Extended Mind)',
    10,
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();


-- Project 11: 第四阶段：幻肢与纠缠
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    11,
    '第四阶段：幻肢与纠缠',
    'Phantom Limbs & Entanglement | 18岁以上 | 12周',
    '深入探索“幻肢”现象及其对“身心二元论”和“大脑中心论”的挑战。将“量子纠缠”的非定域性思想，创造性地应用于构建一个旨在检验“身体部分”之间是否存在超距连接的思想实验方案。本项目高度重视伦理思辨。 - 最终成果： 一份高质量的《关于检验身体部分间非定域性连接的思想实验方案及伦理框架》的研究论文，并参与一场关于“自我边界、身体完整性与后人类主义”的线上深度研讨会。 --- 第一周：“幽灵”之舞——幻肢现象与大脑的“地图” (Days 1-7) 本周目标： 深入了解“幻肢”（Phantom Limb）现象的临床表现、普遍性及其带来的痛苦。学习神经科学中关于“身体地图”（Body Map）的主流理论解释（如大脑皮层重塑），并能清晰地阐述为何这些经典理论仍无法完全解释幻肢的所有奇特属性。 --- 【第一周 | Day 1-4】当身体的一部分“活”在虚空中 (When a Part of the Body ''Lives'' in the Void) (任务时长：约100分钟，可在4天内完成) 研究员，欢迎你进入“伊卡洛斯计划”中最触及“自我”本质的探索。这一次，我们将直面一个深刻的问题：“我”在哪',
    '["深入探索“幻肢”现象及其对“身心二元论”和“大脑中心论”的挑战", "将“量子纠缠”的非定域性思想，创造性地应用于构建一个旨在检验“身体部分”之间是否存在超距连接的思想实验方案", "本项目高度重视伦理思辨", "- 最终成果： 一份高质量的《关于检验身体部分间非定域性连接的思想实验方案及伦理框架》的研究论文，并参与一场关于“自我边界、身体完整性与后人类主义”的线上深度研讨会", "--- 第一周：“幽灵”之舞——幻肢现象与大脑的“地图” (Days 1-7) 本周目标： 深入了解“幻肢”（Phantom Limb）现象的临床表现、普遍性及其带来的痛苦"]'::jsonb,
    '一份高质量的《关于检验身体部分间非定域性连接的思想实验方案及伦理框架》的研究论文，并参与一场关于“自我边界、身体完整性与后人类主义”的线上深度研讨会。',
    '18岁以上',
    12,
    '模块三：延展的心灵 (The Extended Mind)',
    11,
    true,
    NOW(),
    NOW()
) ON CONFLICT (system_id, stage_number)
DO UPDATE SET
    stage_name = EXCLUDED.stage_name,
    stage_description = EXCLUDED.stage_description,
    welcome_message = EXCLUDED.welcome_message,
    core_objectives = EXCLUDED.core_objectives,
    final_outcome = EXCLUDED.final_outcome,
    suggested_age_range = EXCLUDED.suggested_age_range,
    duration_weeks = EXCLUDED.duration_weeks,
    module_category = EXCLUDED.module_category,
    updated_at = NOW();
