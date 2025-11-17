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

