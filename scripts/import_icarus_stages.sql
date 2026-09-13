-- Import Icarus Projects - course_stages


-- Project 1: 第一阶段：宠物侦探
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    1,
    '第一阶段：宠物侦探',
    'The Pet Detectives | 6-10岁 | 4周',
    '培养孩子们的细致观察力、同理心、以及基础的数据记录习惯。让他们在与宠物的日常互动中，埋下科学探究和超越纯物质世界观的种子。',
    '["培养孩子们的细致观察力、同理心、以及基础的数据记录习惯", "让他们在与宠物的日常互动中，埋下科学探究和超越纯物质世界观的种子"]'::jsonb,
    '一份图文并茂的《宠物第六感观察报告》，并参与一次全球在线“宠物侦探报告会”。 第一周：成为观察家 (Days 1-7) 本周目标： 激发兴趣，建立科学观察的基本概念，并制作完成核心研究工具——《第六感日记》。成功记录至少三次“主人回家”事件。 【第一周 | Day 1】项目启动：杰提的神秘故事 (Project Kick-off: The Mystery of Jaytee) (任务时长：约30分钟) 欢迎加入“伊卡洛斯计划”的第一个任务！从今天起，你将成为一名“宠物侦探”。你的任务，是去发现一个隐藏在我们毛茸茸、黏乎乎或者有羽毛的朋友身上的大秘密！ 在我们开始之前，请先阅读一个真实的故事。这是一个关于一只名叫“杰提”（Jaytee）的小狗的传奇故事。 在一个叫做英格兰的地方，有一位女士叫帕姆（Pam），她有一只非常可爱的狗狗，名叫杰提。帕姆发现了一件很奇怪的事：每次她要下班回家的时候，不管她离家有多远，也不管她是不是准时回家，杰提好像总能提前知道！ 杰提会在帕姆回家的确切时间前几分钟，就跑到窗户边，安静地坐下，眼睛望着窗外，好像在说：“我的主人就要回来啦！” 帕姆觉得这太神奇了！她想',
    '6-10岁',
    4,
    '模块一：无形的纽带 (The Unseen Leash)',
    1,
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


-- Project 2: 第二阶段：杰提计划
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    2,
    '第二阶段：杰提计划',
    'The Jaytee Project | 11-15岁 | 8周',
    '引入严谨的科学方法论（随机化、盲法、对照），引导学员设计并执行一个初步的原创性实验，开始挑战经典的因果律观念，探索“意念”作为独立变量的可能性。',
    '["引入严谨的科学方法论（随机化、盲法、对照），引导学员设计并执行一个初步的原创性实验，开始挑战经典的因果律观念，探索“意念”作为独立变量的可能性"]'::jsonb,
    '一份包含原创实验设计的《关于“意念非定域性”在人与动物间连接的初步研究报告》，并有机会在线上学生期刊发表。 第二周：成为实验建筑师 (Days 8-14) 本周目标： 学习科学实验设计的核心原则——变量控制、随机化、盲法与数据记录。基于上周提出的研究问题，设计出一套完整的、可以在自己家庭环境中执行的原创实验方案。 【第二周 | Day 8-9】科学方法论入门（上）：控制你的“变量” (Scientific Methodology 101 (Part 1): Controlling Your Variables) (任务时长：约60分钟，可在2天内完成) 青年研究员，上周我们提出了一个绝妙的核心问题。但这就像有了一张藏宝图，我们还需要建造一艘坚固的船才能出海寻宝。这艘船，就是我们的**“实验设计方案”**。 建造这艘船的第一块龙骨，叫做**“变量控制”**。 在科学实验中，“变量”指的是那些可能会改变的东西。为了让我们的实验可信，我们必须像侦探一样，把所有可能影响结果的“嫌疑变量”都控制住，只留下我们真正想研究的那一个。 自变量 (Independent Variable): 这是我们主',
    '11-15岁',
    8,
    '模块一：无形的纽带 (The Unseen Leash)',
    2,
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


-- Project 3: 第三阶段：贝尔不等式与生命系统
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    3,
    '第三阶段：贝尔不等式与生命系统',
    'Bell''s Inequality & Living Systems | 16岁以上 | 16周',
    '深入理解量子力学中“非定域性”的实验验证基础——贝尔不等式。挑战性地将这一物理学中最深刻的思想工具，应用于设计一个（思想或可执行的）生物学实验方案，以区分生命系统间的连接是经典的“隐藏变量”还是量子的“非定域纠缠”。',
    '["深入理解量子力学中“非定域性”的实验验证基础——贝尔不等式", "挑战性地将这一物理学中最深刻的思想工具，应用于设计一个（思想或可执行的）生物学实验方案，以区分生命系统间的连接是经典的“隐藏变量”还是量子的“非定域纠缠”"]'::jsonb,
    '一份高质量的、具有前沿水平的《应用贝尔不等式思想检验生命系统非定域性的实验设计方案》论文，并有机会参与线上学术研讨会。 第一周：爱因斯坦的“噩梦”——定域实在论与EPR佯谬 (Days 1-7) 本周目标： 理解20世纪物理学最核心的一场思想论战。掌握“定域性”和“实在性”这两个基本概念，并能清晰地阐述爱因斯坦等人提出的EPR佯谬为何对当时的量子力学构成了巨大的挑战。 【第一周 | Day 1-3】物理学的基石：什么是“定域实在论”？ (The Bedrock of Physics: What is ''Local Realism''?) (任务时长：约90分钟，可在3天内完成) 研究员，欢迎你进入“伊卡洛斯计划”中最具挑战性的项目之一。在这里，我们将不再仅仅是观察现象，而是要探究现象背后最底层的实在（Reality）结构。 在我们尝试将物理学工具用于生命科学之前，我们必须首先理解这件工具本身。我们的旅程，始于阿尔伯特·爱因斯坦的一个深刻信念，以及他认为量子力学是一个“不完备”理论的理由。这个信念，被称为**“定域实在论”（Local Realism）**。 这个词听起来很复杂，但它是由两',
    '16岁以上',
    16,
    '模块一：无形的纽带 (The Unseen Leash)',
    3,
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


-- Project 4: 第一阶段：植物的悄悄话
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    4,
    '第一阶段：植物的悄悄话',
    'The Plant Whisperers | 6-10岁 | 4周',
    '将对“无形连接”的探索从动物扩展到植物。通过一个简单的对照实验，培养孩子们的责任心、耐心和基础的实验思维（对照组概念），并引导他们思考人类的“意念”和“爱”是否可能成为影响其他生命生长的“养分”。',
    '["将对“无形连接”的探索从动物扩展到植物", "通过一个简单的对照实验，培养孩子们的责任心、耐心和基础的实验思维（对照组概念），并引导他们思考人类的“意念”和“爱”是否可能成为影响其他生命生长的“养分”"]'::jsonb,
    '一份图文并茂的《植物生长观察报告》，对比记录两株植物的生长差异，并分享自己与植物“沟通”的心得。 第一周：播种希望与爱的种子 (Days 1-7) 本周目标： 理解“对照实验”的基本概念。亲手种植两盆完全相同的植物，并将它们命名和分组。制作一份专门的《植物观察日记》，并开始对植物进行差异化的“爱的关注”。 【第一周 | Day 1-2】新的任务：植物能“听”到我们的爱吗？ (New Mission: Can Plants ''Hear'' Our Love?) (任务时长：约45分钟，可在2天内完成) 欢迎加入“伊卡洛斯计划”的第二个模块！这一次，我们的探险伙伴不再是毛茸茸的动物，而是安静、充满生命力的植物。 你有没有想过，你每天经过的花草树木，它们能感觉到你的存在吗？如果我们对一棵植物充满爱意，对另一棵却视而不见，它们的长势会有什么不同吗？ 在很久以前，有一位名叫克里夫·巴克斯特（Cleve Backster）的专家，他平时的工作是使用一种叫做“测谎仪”的神奇机器。有一天，他突发奇想，把测谎仪的电极连接到了一盆龙舌兰植物的叶子上。 他想看看，如果给植物浇水，测谎仪的指针会不会动。结果，指',
    '6-10岁',
    4,
    '模块二：无形的地图 (The Unseen Leash)',
    4,
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


-- Project 5: 第二阶段：远程蚁巢
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    5,
    '第二阶段：远程蚁巢',
    'The Phantom Hive | 11-15岁 | 8周',
    '引入“超个体”和“形态场”的概念，探索社会性昆虫群体的整体性与协同机制。通过设计并执行一个物理分割蚁巢的对照实验，初步检验群体组织性是否依赖于一种超越已知感官的、类似场的连接。',
    '["引入“超个体”和“形态场”的概念，探索社会性昆虫群体的整体性与协同机制", "通过设计并执行一个物理分割蚁巢的对照实验，初步检验群体组织性是否依赖于一种超越已知感官的、类似场的连接"]'::jsonb,
    '一份包含原创实验设计与数据分析的《关于蚁巢群体协同性的非定域性探究报告》，并绘制一份“蚁巢隧道模式对比图”。 第一周：进入“超个体”的世界 (Days 1-7) 本周目标： 理解“超个体”的概念，认识到社会性昆虫群落（如蚁巢、蜂巢）本身可以被视为一个单一的、分散式的“生物”。学习蚂蚁社会的基本结构和信息交流方式，并提出本项目的核心研究问题。 【第一周 | Day 1-3】认知跃迁：一个蚁巢，一个“生物”？ (Cognitive Leap: One Colony, One ''Organism''?) (任务时长：约90分钟，可在3天内完成) 研究员，在之前的项目中，我们探索了个体生命之间的连接。现在，我们要进入一个更复杂、更迷人的领域。想象一下，你眼前的整个蚁巢，成千上万只蚂蚁，它们不是“一群”蚂蚁，而只是“一个”生物的不同细胞。 这个惊人的想法，就是**“超个体”（Superorganism）**理论。 在南非广袤的草原上，矗立着许多巨大的白蚁丘，它们像一座座小型的黏土教堂。这些建筑内部结构极其复杂，有育儿室、真菌农场、储藏室，甚至还有一套能自动调节温度和湿度的“中央空调系统”。 这一切',
    '11-15岁',
    8,
    '模块二：无形的地图 (The Unseen Leash)',
    5,
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


-- Project 6: 第三阶段：记忆的水实验
INSERT INTO course_stages (
    system_id, stage_number, stage_name, stage_description,
    welcome_message, core_objectives, final_outcome,
    suggested_age_range, duration_weeks, module_category, stage_order,
    is_published, created_at, updated_at
) VALUES (
    '9da7c347-fe63-4c81-81e1-df576bcd2e6c'::uuid,
    6,
    '第三阶段：记忆的水实验',
    'The Water Memory Experiment | 16岁以上 | 12周',
    '深入探索备受争议的“水记忆”假说。通过学习相关的科学史、正反方论据，并设计一个极其严谨的、基于生物指示剂（如鱼群行为）的双盲实验，来亲手检验“场”或“信息”是否可以被水这样的介质“储存”和“携带”。',
    '["深入探索备受争议的“水记忆”假说", "通过学习相关的科学史、正反方论据，并设计一个极其严谨的、基于生物指示剂（如鱼群行为）的双盲实验，来亲手检验“场”或“信息”是否可以被水这样的介质“储存”和“携带”"]'::jsonb,
    '一份具有高度科学素养的《关于“水信息储存”假说的实验验证方案及初步探索报告》，并参与一次关于“科学边界与范式革命”的线上深度研讨会。 第一周：踏入“禁区”——“水记忆”的科学争议史 (Days 1-7) 本周目标： 了解“水记忆”假说的起源（顺势疗法）及其在科学史上的著名争议事件（本韦尼斯特事件）。学习并能够阐述支持和反对该假说的主要科学论据，并理解为何这个想法在传统化学框架下是“不可能的”，但在量子场论等前沿物理学视角下，又似乎“并非完全不可能”。 【第一周 | Day 1-3】历史的漩涡：从顺势疗法到“本韦尼斯特事件” (Vortex of History: From Homeopathy to the ''Benveniste Affair'') (任务时长：约90分钟，可在3天内完成) 研究员，欢迎你选择“伊卡洛斯计划”中最为大胆和前沿的项目。在这里，我们将直面一个被主流科学界普遍视为“禁区”或“伪科学”的领域——“水记忆”（Water Memory）。 在开始我们自己的探索之前，我们必须像历史学家一样，回顾这场长达数十年的激烈科学战争。 “水记忆”假说的思想根源，可以追溯到18世',
    '16岁以上',
    12,
    '模块二：无形的地图 (The Unseen Leash)',
    6,
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
