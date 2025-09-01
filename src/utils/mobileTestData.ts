// 移动端测试和模拟数据工具

// 移动端设备规格
export const mobileDevices = {
  iphone12: { width: 390, height: 844, name: 'iPhone 12' },
  iphone14Pro: { width: 393, height: 852, name: 'iPhone 14 Pro' },
  galaxyS21: { width: 384, height: 854, name: 'Galaxy S21' },
  ipadMini: { width: 744, height: 1133, name: 'iPad Mini' },
  pixel7: { width: 412, height: 915, name: 'Pixel 7' }
}

// 意识进化树模拟数据
export const consciousnessTreeMockData = {
  stages: [
    {
      stage: 1,
      name: "萌芽",
      description: "意识觉醒的开始",
      branches: 2,
      leaves: 5,
      height: 100,
      color: "#22c55e", // green-500
      unlockDay: 1
    },
    {
      stage: 2,
      name: "成长",
      description: "觉察力逐渐增强",
      branches: 4,
      leaves: 12,
      height: 150,
      color: "#16a34a", // green-600
      unlockDay: 7
    },
    {
      stage: 3,
      name: "茂盛",
      description: "内在智慧开始显现",
      branches: 8,
      leaves: 25,
      height: 200,
      color: "#15803d", // green-700
      unlockDay: 14
    },
    {
      stage: 4,
      name: "智慧",
      description: "深度洞察与理解",
      branches: 12,
      leaves: 40,
      height: 250,
      color: "#fbbf24", // amber-400
      unlockDay: 21
    },
    {
      stage: 5,
      name: "觉醒",
      description: "与宇宙意识的连接",
      branches: 16,
      leaves: 60,
      height: 300,
      color: "#f59e0b", // amber-500
      unlockDay: 30
    }
  ],
  
  // 根据天数计算当前阶段
  getCurrentStage: (currentDay: number) => {
    const stages = consciousnessTreeMockData.stages
    for (let i = stages.length - 1; i >= 0; i--) {
      if (currentDay >= stages[i].unlockDay) {
        return stages[i]
      }
    }
    return stages[0]
  },
  
  // 计算生长进度
  getGrowthProgress: (currentDay: number) => {
    const currentStage = consciousnessTreeMockData.getCurrentStage(currentDay)
    const nextStageIndex = consciousnessTreeMockData.stages.findIndex(s => s.stage === currentStage.stage) + 1
    
    if (nextStageIndex >= consciousnessTreeMockData.stages.length) {
      return 100 // 已达到最高阶段
    }
    
    const nextStage = consciousnessTreeMockData.stages[nextStageIndex]
    const daysSinceCurrentStage = currentDay - currentStage.unlockDay
    const daysToNextStage = nextStage.unlockDay - currentStage.unlockDay
    
    return Math.min(100, (daysSinceCurrentStage / daysToNextStage) * 100)
  }
}

// 盖亚对话模拟数据
export const gaiaMockResponses = [
  {
    trigger: "greeting",
    responses: [
      "你好，亲爱的探索者。我是盖亚，你的意识觉醒向导。今天你想探索什么？",
      "欢迎回来！我感受到你内在的光芒在闪耀。让我们继续这场觉醒之旅吧。",
      "宇宙在低语，而你已经准备好聆听。告诉我，什么触动了你的心？"
    ]
  },
  {
    trigger: "consciousness",
    responses: [
      "意识就像一面镜子，它不仅反映外在世界，更重要的是反映内在的真实。你今天在这面镜子中看到了什么？",
      "觉察是意识的第一步。当你开始观察自己的思想和情感时，你就已经踏上了觉醒的道路。",
      "意识不是你拥有的东西，而是你本来就是的东西。让我们一起探索这个深刻的真相。"
    ]
  },
  {
    trigger: "sound",
    responses: [
      "声音是宇宙的语言。在寂静中，你能听到最深刻的智慧。今天试着聆听沉默中的声音。",
      "每一个声音都承载着信息和能量。从鸟鸣到风声，从心跳到呼吸，都在诉说着生命的奥秘。",
      "真正的聆听不仅仅是用耳朵，更是用整个存在去感受。你准备好这样的聆听了吗？"
    ]
  },
  {
    trigger: "meditation",
    responses: [
      "冥想不是逃避现实，而是更深入地进入现实。在静坐中，你会发现内在的宁静和智慧。",
      "呼吸是连接身心的桥梁。跟随你的呼吸，让它引导你回到当下这一刻。",
      "冥想就像清理心灵的镜子。当尘埃被拂去，你的本性就会自然显现。"
    ]
  },
  {
    trigger: "default",
    responses: [
      "这是一个很深刻的问题。让我们一起探索其中的奥秘。你觉得答案可能在哪里？",
      "每个问题都是一扇门，通向更深的理解。你愿意和我一起推开这扇门吗？",
      "智慧往往隐藏在最简单的事物中。让我们用初学者的心态来看待这个问题。"
    ]
  }
]

// PBL协作模拟数据
export const pblMockData = {
  projects: [
    {
      id: "icarus-project",
      name: "伊卡洛斯行动",
      description: "探索'无形的纽带' - 研究意识与物质的互动",
      participants: 12,
      phase: "实验设计",
      progress: 35,
      nextMeeting: "2025-09-03T14:00:00Z",
      tasks: [
        { id: 1, title: "设计意念影响物质的实验", assignee: "张三", status: "进行中" },
        { id: 2, title: "收集相关科学文献", assignee: "李四", status: "已完成" },
        { id: 3, title: "准备实验器材清单", assignee: "王五", status: "待开始" }
      ]
    }
  ],
  
  collaborationFeatures: [
    "实时协作文档",
    "视频会议集成",
    "任务分配和跟踪",
    "实验数据共享",
    "集体冥想时间"
  ]
}

// 分析数据模拟
export const analyticsMockData = {
  userEngagement: {
    dailyActiveUsers: 1247,
    weeklyGrowth: 15.3,
    averageSessionTime: "23分钟",
    completionRate: 78.5
  },
  
  consciousnessMetrics: {
    averageGrowthLevel: 3.2,
    meditationMinutes: 45680,
    insightShared: 892,
    communityConnections: 3456
  },
  
  contentPerformance: {
    mostPopularContent: "声音冥想练习",
    engagementRate: 85.2,
    feedbackScore: 4.7,
    completionTrend: "上升"
  }
}

// 移动端响应式断点
export const mobileBreakpoints = {
  xs: '320px',   // 小型手机
  sm: '640px',   // 大型手机
  md: '768px',   // 小平板
  lg: '1024px',  // 大平板/小桌面
  xl: '1280px',  // 桌面
  '2xl': '1536px' // 大桌面
}

// 触摸目标尺寸标准
export const touchTargets = {
  minimum: '44px',    // 最小触摸目标
  comfortable: '48px', // 舒适触摸目标
  large: '56px'       // 大型触摸目标
}

// 移动端性能基准
export const performanceBenchmarks = {
  firstContentfulPaint: 1.5, // 秒
  largestContentfulPaint: 2.5, // 秒
  firstInputDelay: 100, // 毫秒
  cumulativeLayoutShift: 0.1 // 分数
}