// @ts-nocheck
// PBL Explorer Alliance - Data Types and Mock Service
// Directly ported from D:\CursorWork\FutureMindInstitute\PBL\src\lib\supabase.ts

// PBL项目的数据类型定义
export interface PBLUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  bio?: string
  interests: string[]
  skills: string[]
  consciousness_level?: number
  created_at: string
  updated_at: string
}

export interface PBLProject {
  id: string
  title: string
  description: string
  category: 'consciousness' | 'science' | 'creative' | 'guidance'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  status: 'recruiting' | 'active' | 'completed' | 'paused'
  max_participants: number
  current_participants: number
  duration_weeks: number
  learning_objectives: string[]
  requirements: string[]
  tags: string[]
  creator_id: string
  created_at: string
  updated_at: string
  start_date?: string
  end_date?: string
}

export interface PBLParticipation {
  id: string
  user_id: string
  project_id: string
  role: 'creator' | 'participant' | 'mentor'
  status: 'pending' | 'approved' | 'active' | 'completed' | 'withdrawn'
  joined_at: string
  contribution_score?: number
}

export interface PBLTask {
  id: string
  project_id: string
  title: string
  description: string
  type: 'exploration' | 'experiment' | 'collaboration' | 'reflection'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
}

// 模拟数据服务 - 用于开发阶段 (完全复制自PBL项目)
export class MockDataService {
  static async getProjects(): Promise<PBLProject[]> {
    // 基于伊卡洛斯计划文档的完整项目体系 - 12个完整项目
    return [
      // 模块一：无形的纽带 - 从心灵感应到量子纠缠

      // 小学阶段 (6-10岁)
      {
        id: '1',
        title: '我的宠物的第六感日记：小小探索者计划',
        description: '基于伊卡洛斯计划模块一的儿童版本。通过观察和记录宠物的"超能力"，培养孩子们的观察力、同理心和基础的数据记录习惯。让孩子们在与宠物的日常互动中，埋下科学探究和超越物质主义世界观的种子。',
        category: 'guidance',
        difficulty_level: 'beginner',
        status: 'recruiting',
        max_participants: 25,
        current_participants: 18,
        duration_weeks: 4,
        learning_objectives: [
          '培养敏锐的观察力和记录习惯',
          '学会设计简单的"心灵游戏"实验',
          '体验科学探究的乐趣和严谨性',
          '在心中种下"世界比我们看到的要神奇得多"的种子'
        ],
        requirements: [
          '年龄6-10岁，有宠物陪伴',
          '家长支持和参与',
          '愿意每天观察和记录15-30分钟',
          '具备基础的读写能力'
        ],
        tags: ['儿童教育', '宠物观察', '科学启蒙', '伊卡洛斯计划', '心灵感应'],
        creator_id: 'child_educator1',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z'
      },

      // 初中阶段 (11-15岁)
      {
        id: '2',
        title: '薛定谔的猫砂盆：测试意念的非定域性',
        description: '伊卡洛斯计划模块一的初中版本。引入严谨的科学方法论（随机化、盲法、对照），引导学生设计并执行原创性实验，测试宠物感应到的究竟是主人"开始回家"这个物理行为，还是"决定回家"这个纯粹的意念。',
        category: 'science',
        difficulty_level: 'intermediate',
        status: 'active',
        max_participants: 12,
        current_participants: 8,
        duration_weeks: 8,
        learning_objectives: [
          '掌握科学方法论的核心概念',
          '设计严谨的对照实验',
          '理解量子随机性的哲学意义',
          '体验挑战经典因果律的勇气'
        ],
        requirements: [
          '年龄11-15岁，有宠物',
          '具备基础的数学和科学素养',
          '家中有摄像设备',
          '每周投入6-8小时实验和分析'
        ],
        tags: ['科学方法', '量子随机', '意念实验', '伊卡洛斯计划', '非定域性'],
        creator_id: 'science_teacher1',
        created_at: '2024-01-19T14:30:00Z',
        updated_at: '2024-01-19T14:30:00Z'
      },

      // 高中阶段 (16岁以上)
      {
        id: '3',
        title: '生物贝尔实验：量子纠缠在生命系统中的探索',
        description: '伊卡洛斯计划的高级版本。挑战现代科学最深的根基，尝试将意识现象与量子物理进行理论和实验层面的连接。设计思想实验来区分经典关联和量子纠缠，这不仅是科学研究，更是参与新范式构建的哲学实践。',
        category: 'science',
        difficulty_level: 'expert',
        status: 'recruiting',
        max_participants: 8,
        current_participants: 3,
        duration_weeks: 16,
        learning_objectives: [
          '深度理解贝尔不等式和非定域性',
          '设计生物版贝尔实验方案',
          '掌握量子纠缠与经典关联的区别',
          '参与新科学范式的构建'
        ],
        requirements: [
          '物理学或相关专业背景',
          '熟悉量子力学基础理论',
          '有实验设计经验',
          '每周投入10-15小时深度研究'
        ],
        tags: ['贝尔实验', '量子纠缠', '生物物理', '伊卡洛斯计划', '范式革命'],
        creator_id: 'quantum_biologist1',
        created_at: '2024-01-20T16:45:00Z',
        updated_at: '2024-01-20T16:45:00Z'
      },

      // 成人阶段 - 全球协作项目
      {
        id: '4',
        title: '全球意识场项目：集体意念的实时探测',
        description: '伊卡洛斯计划的终极实验。通过全球协作，在同一时刻进行集体意念实验，探测人类集体意识对物理世界的影响。使用真随机数生成器网络，实时监测全球意识场的波动，见证意识与物质世界的深层互动。',
        category: 'consciousness',
        difficulty_level: 'expert',
        status: 'active',
        max_participants: 1000,
        current_participants: 234,
        duration_weeks: 52,
        learning_objectives: [
          '参与史上最大规模的意识实验',
          '理解集体意识的涌现特性',
          '掌握大数据分析和可视化技术',
          '见证新科学范式的诞生时刻'
        ],
        requirements: [
          '对意识科学有深度兴趣',
          '愿意参与全球同步实验',
          '具备网络协作能力',
          '承诺长期参与和数据贡献'
        ],
        tags: ['全球协作', '集体意识', '随机数生成器', '伊卡洛斯计划', '意识场'],
        creator_id: 'global_consciousness_lab',
        created_at: '2024-01-21T12:00:00Z',
        updated_at: '2024-01-21T12:00:00Z'
      },

      // 模块二：无形的地图 - 探索空间记忆与形态场

      // 小学阶段
      {
        id: '5',
        title: '植物的悄悄话：我的植物认识我吗？',
        description: '基于伊卡洛斯计划模块二的儿童版本。学生养两株完全相同的植物，对其中一株倾注爱意和它说话，对另一株完全忽略。通过AI图像识别定期记录两株植物的生长状态，探索意识意图对生命形式的潜在影响。',
        category: 'consciousness',
        difficulty_level: 'beginner',
        status: 'recruiting',
        max_participants: 20,
        current_participants: 12,
        duration_weeks: 6,
        learning_objectives: [
          '学会设计对照实验',
          '培养对植物生命的敬畏和关爱',
          '理解意识与生命的连接可能性',
          '掌握基础的数据记录和观察技能'
        ],
        requirements: [
          '年龄6-12岁',
          '有种植空间和基础园艺条件',
          '家长协助和监督',
          '每天投入15-20分钟观察和记录'
        ],
        tags: ['植物实验', '意识连接', '对照实验', '伊卡洛斯计划', '生命科学'],
        creator_id: 'plant_educator1',
        created_at: '2024-01-22T09:00:00Z',
        updated_at: '2024-01-22T09:00:00Z'
      },

      // 初中阶段
      {
        id: '6',
        title: '远程蚁巢：构建虚拟家园的实验',
        description: '将蚁巢分为A、B两部分，大部分蚂蚁和蚁后在A巢，B巢移动到完全隔离的地点但放置来自A巢的土壤和信息素。观察B巢的蚂蚁是否仍能与A巢保持组织协同性，探索"家"的物理实体与信息化学特征的关系。',
        category: 'science',
        difficulty_level: 'intermediate',
        status: 'active',
        max_participants: 10,
        current_participants: 6,
        duration_weeks: 8,
        learning_objectives: [
          '理解生物组织的协同机制',
          '探索信息场与物理场的关系',
          '掌握生物行为观察方法',
          '设计严谨的隔离实验'
        ],
        requirements: [
          '年龄12-16岁',
          '有生物学基础知识',
          '能够维护蚂蚁群落',
          '每周投入5-7小时观察和记录'
        ],
        tags: ['生物行为', '组织场', '信息传递', '伊卡洛斯计划', '群体智能'],
        creator_id: 'biology_teacher1',
        created_at: '2024-01-23T11:30:00Z',
        updated_at: '2024-01-23T11:30:00Z'
      },

      // 高中阶段
      {
        id: '7',
        title: '记忆的水实验：水能记住家的位置吗？',
        description: '基于"水记忆"假说的高度争议性实验。将水族箱中的鱼分为两组，一半的水转移到新水族箱，原水族箱移动到新位置。观察被放入"实验组水"中的鱼是否会倾向于游向原水族箱"应该在"的方向，探索"场"是否可以被水储存和携带。',
        category: 'science',
        difficulty_level: 'advanced',
        status: 'recruiting',
        max_participants: 6,
        current_participants: 2,
        duration_weeks: 12,
        learning_objectives: [
          '设计极其严格的盲法实验',
          '掌握动物行为分析技术',
          '理解争议性科学假说的研究方法',
          '培养批判性思维和开放心态'
        ],
        requirements: [
          '年龄16岁以上',
          '有生物学或物理学背景',
          '具备实验设计能力',
          '每周投入8-10小时研究'
        ],
        tags: ['水记忆', '争议科学', '动物行为', '伊卡洛斯计划', '场论'],
        creator_id: 'water_researcher1',
        created_at: '2024-01-24T14:15:00Z',
        updated_at: '2024-01-24T14:15:00Z'
      },

      // 成人阶段
      {
        id: '8',
        title: '意识地理学：绘制城市的情绪地图',
        description: '志愿者团队使用AI设计的App，在城市不同地点（教堂、医院、古战场、新生儿病房）进行冥想，实时标记感受到的"场"的能量质感。AI汇集所有数据，生成可视化的城市"形态场"地图，探索地理空间的能量记忆。',
        category: 'consciousness',
        difficulty_level: 'intermediate',
        status: 'active',
        max_participants: 50,
        current_participants: 28,
        duration_weeks: 16,
        learning_objectives: [
          '掌握冥想和能量感知技术',
          '学会使用数据可视化工具',
          '理解集体主观体验的客观化方法',
          '探索地理空间的意识维度'
        ],
        requirements: [
          '有冥想或能量工作经验',
          '愿意在不同地点进行实地调研',
          '具备智能手机和移动能力',
          '每周投入4-6小时实地探索'
        ],
        tags: ['意识地理', '能量地图', '集体感知', '伊卡洛斯计划', '城市研究'],
        creator_id: 'consciousness_mapper1',
        created_at: '2024-01-25T16:20:00Z',
        updated_at: '2024-01-25T16:20:00Z'
      },

      // 模块三：延展的心灵 - 意识作为非定域场

      // 小学阶段
      {
        id: '9',
        title: '情绪的颜色：我能感觉到你的心情吗？',
        description: '基于伊卡洛斯计划模块三的儿童版本。两人一组背对背坐着，一人随机看AI展示的不同情绪图片并努力感受这种情绪，另一人猜测对方正在感受哪种情绪。从"被凝视"转向对更复杂"情绪状态"的非感官感知探索。',
        category: 'consciousness',
        difficulty_level: 'beginner',
        status: 'recruiting',
        max_participants: 30,
        current_participants: 22,
        duration_weeks: 3,
        learning_objectives: [
          '培养情绪感知和共情能力',
          '体验非感官信息传递的可能性',
          '学会记录和分析主观体验',
          '理解意识延展的基础概念'
        ],
        requirements: [
          '年龄6-12岁',
          '需要搭档参与',
          '家长陪同和指导',
          '每次练习20-30分钟'
        ],
        tags: ['情绪感知', '共情训练', '意识延展', '伊卡洛斯计划', '儿童心理'],
        creator_id: 'emotion_educator1',
        created_at: '2024-01-26T10:30:00Z',
        updated_at: '2024-01-26T10:30:00Z'
      },

      // 初中阶段
      {
        id: '10',
        title: '跨越距离的凝视：互联网能传递凝视吗？',
        description: '全球性的"数字凝视"实验。招募世界各地的参与者，在同一时刻让数千人通过网络直播同时注视中心实验室里的被试者，测量其生理指标变化。与只有少数本地人注视时的数据对比，探究"凝视效应"的场性质。',
        category: 'science',
        difficulty_level: 'intermediate',
        status: 'active',
        max_participants: 15,
        current_participants: 11,
        duration_weeks: 10,
        learning_objectives: [
          '理解生理指标测量技术',
          '掌握大规模在线实验设计',
          '分析距离和人数对效应的影响',
          '探索数字时代的意识连接'
        ],
        requirements: [
          '年龄12-18岁',
          '有基础的生物学知识',
          '能够使用生理监测设备',
          '每周投入5-8小时实验'
        ],
        tags: ['数字凝视', '生理监测', '全球实验', '伊卡洛斯计划', '网络效应'],
        creator_id: 'digital_researcher1',
        created_at: '2024-01-27T13:45:00Z',
        updated_at: '2024-01-27T13:45:00Z'
      },

      // 高中阶段
      {
        id: '11',
        title: '随机数生成器与集体意念：思想能影响概率吗？',
        description: '使用经过物理学家认证的真随机数生成器（RNG），组织集体活动，在特定时间段内共同意图让RNG输出更多"1"或"0"，分析数据是否偏离概率基线。这是对普林斯顿PEAR实验室经典研究的现代复现。',
        category: 'science',
        difficulty_level: 'advanced',
        status: 'recruiting',
        max_participants: 20,
        current_participants: 14,
        duration_weeks: 12,
        learning_objectives: [
          '理解真随机性和概率统计',
          '掌握集体意念实验设计',
          '学会统计显著性分析',
          '探索意识与物质的直接互动'
        ],
        requirements: [
          '年龄16岁以上',
          '有统计学和物理学基础',
          '能够参与集体冥想活动',
          '每周投入6-10小时研究'
        ],
        tags: ['随机数生成器', '集体意念', '概率统计', '伊卡洛斯计划', 'PEAR实验'],
        creator_id: 'probability_researcher1',
        created_at: '2024-01-28T15:20:00Z',
        updated_at: '2024-01-28T15:20:00Z'
      },

      // 成人阶段 - 最具挑战性的项目
      {
        id: '12',
        title: '幻肢与纠缠：探索身体部分的非定域连接',
        description: '与截肢者志愿者合作的深度研究项目。将截肢者的假肢或相关物品放置在远方，在随机时刻对该物品进行刺激，同时记录截肢者在幻肢处的异常感受。这是测试身体部分间是否存在超越时空"量子纠缠"式连接的大胆尝试。',
        category: 'consciousness',
        difficulty_level: 'expert',
        status: 'recruiting',
        max_participants: 5,
        current_participants: 1,
        duration_weeks: 20,
        learning_objectives: [
          '掌握严格的伦理研究框架',
          '理解幻肢现象的神经科学机制',
          '设计最精密的双盲随机实验',
          '探索身体意识的非定域特性'
        ],
        requirements: [
          '医学、神经科学或心理学专业背景',
          '有与特殊群体工作的经验',
          '具备高度的同理心和伦理意识',
          '能够全职投入长期研究'
        ],
        tags: ['幻肢现象', '量子纠缠', '神经科学', '伊卡洛斯计划', '伦理研究'],
        creator_id: 'phantom_researcher1',
        created_at: '2024-01-29T17:00:00Z',
        updated_at: '2024-01-29T17:00:00Z'
      }
    ]
  }

  static async getProjectById(id: string): Promise<PBLProject | null> {
    const projects = await this.getProjects()
    return projects.find(p => p.id === id) || null
  }

  static async getUserProjects(userId: string): Promise<PBLProject[]> {
    // 返回用户参与的项目
    return []
  }
}

// 导出数据服务 - 使用模拟服务
export const pblDataService = MockDataService
