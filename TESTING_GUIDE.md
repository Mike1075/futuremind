# 未来心灵学院 - 测试指南

## 🎯 测试系统概述

本项目使用Supabase作为后端，实现了完整的测试管理系统，包括：
- 测试用例管理
- 预览链接管理
- 测试记录追踪
- 自动化测试报告

## 🚀 快速开始

### 1. 初始化数据库

```bash
# 启动开发服务器
npm run dev

# 访问数据库初始化API
curl -X POST http://localhost:3000/api/init-database
```

或者在浏览器中访问：`http://localhost:3000/api/init-database`

### 2. 访问测试仪表板

访问：`http://localhost:3000/test-dashboard`

## 📋 测试模块详情

### 1. 主应用界面 (Main Application)

**预览链接：** `http://localhost:3000`

**测试重点：**
- ✅ 页面加载性能（< 3秒）
- ✅ 响应式设计适配
- ✅ 动画效果流畅性
- ✅ 交互元素可用性

**需要记录的数据：**
- 页面加载时间
- 不同设备下的显示效果截图
- 动画播放是否流畅
- 控制台是否有错误

**测试步骤：**
1. 打开 `http://localhost:3000`
2. 检查页面完整加载（所有元素显示）
3. 测试响应式设计（调整浏览器窗口大小）
4. 验证动画效果（背景粒子、按钮悬停）
5. 点击"与盖亚对话"按钮测试交互

### 2. 意识进化树 (Consciousness Tree)

**预览链接：** `http://localhost:3000/dashboard`

**测试重点：**
- ✅ 树形结构正确渲染
- ✅ 节点解锁逻辑
- ✅ 进度计算准确性
- ✅ 交互提示显示

**需要记录的数据：**
- 不同天数下的节点解锁状态
- 进度计算是否正确
- 节点悬停提示是否显示
- 视觉效果是否符合预期

**测试步骤：**
1. 访问包含进化树的页面
2. 验证初始状态（第0天）
3. 模拟不同天数测试解锁逻辑
4. 检查进度环显示
5. 测试节点悬停效果

### 3. 盖亚AI对话 (Gaia Dialog)

**预览链接：** `http://localhost:3000` (点击对话按钮)

**测试重点：**
- ✅ 对话窗口开启/关闭
- ✅ 消息发送功能
- ✅ AI回复机制
- ✅ 界面交互体验

**需要记录的数据：**
- 对话窗口响应时间
- 消息发送是否成功
- AI回复延迟时间
- 界面滚动是否正常

**测试步骤：**
1. 点击"与盖亚对话"按钮
2. 验证对话窗口打开
3. 发送测试消息
4. 等待并验证AI回复
5. 测试窗口关闭功能

### 4. 检查仪表板 (Inspection Dashboard)

**预览链接：** `http://localhost:3001` (需要单独启动)

**测试重点：**
- ✅ 仪表板数据加载
- ✅ 图表显示正确
- ✅ 实时数据更新
- ✅ 管理功能可用

**需要记录的数据：**
- 数据加载时间
- 图表渲染是否正确
- 实时更新是否工作
- 管理操作是否成功

## 🔧 使用测试管理系统

### 添加预览链接

1. 访问测试仪表板
2. 选择对应模块
3. 点击"添加链接"按钮
4. 输入链接标题和URL

### 记录测试结果

1. 在测试仪表板中选择测试用例
2. 执行测试步骤
3. 点击对应的结果按钮（通过/失败）
4. 系统自动记录测试时间和结果

### 查看测试报告

```sql
-- 查看模块测试统计
SELECT 
    pm.name as module_name,
    COUNT(tc.id) as total_tests,
    COUNT(CASE WHEN tr.status = 'passed' THEN 1 END) as passed_tests,
    COUNT(CASE WHEN tr.status = 'failed' THEN 1 END) as failed_tests
FROM project_modules pm
LEFT JOIN test_cases tc ON pm.id = tc.module_id
LEFT JOIN test_records tr ON tc.id = tr.test_case_id
GROUP BY pm.id, pm.name;
```

## 🤖 自动化测试建议

### Edge Functions 测试

创建Supabase Edge Function进行自动化测试：

```typescript
// supabase/functions/auto-test/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { url } = await req.json()
  
  try {
    // 执行页面加载测试
    const response = await fetch(url)
    const loadTime = Date.now() - startTime
    
    // 记录测试结果到数据库
    // ...
    
    return new Response(JSON.stringify({
      success: true,
      loadTime,
      status: response.status
    }))
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
})
```

### 性能监控

使用Web Vitals API监控关键性能指标：

```javascript
// 在页面中添加性能监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

## 📊 测试数据分析

### 关键指标

1. **页面加载时间** - 目标：< 3秒
2. **交互响应时间** - 目标：< 100ms
3. **测试通过率** - 目标：> 95%
4. **错误率** - 目标：< 1%

### 测试报告生成

系统会自动生成测试报告，包括：
- 每日测试执行情况
- 模块测试通过率趋势
- 性能指标变化
- 问题修复追踪

## 🔍 人工测试检查清单

### 每次发布前必检项目

- [ ] 所有页面正常加载
- [ ] 响应式设计在主要设备上正常
- [ ] 核心功能交互正常
- [ ] 无JavaScript控制台错误
- [ ] 性能指标达标
- [ ] 数据库连接正常

### 浏览器兼容性测试

- [ ] Chrome (最新版本)
- [ ] Firefox (最新版本)
- [ ] Safari (最新版本)
- [ ] Edge (最新版本)

### 设备测试

- [ ] 桌面端 (1920x1080)
- [ ] 平板端 (768x1024)
- [ ] 手机端 (375x667)

## 🚨 问题报告流程

1. **发现问题** - 在测试过程中发现异常
2. **记录详情** - 使用测试系统记录问题详情
3. **分类优先级** - 标记问题严重程度
4. **分配处理** - 指派相关开发人员
5. **验证修复** - 重新测试确认问题解决

## 📞 支持联系

如果在测试过程中遇到问题，请：
1. 首先查看测试仪表板的错误日志
2. 检查Supabase数据库连接状态
3. 查看浏览器控制台错误信息
4. 记录详细的复现步骤

---

**记住：好的测试是高质量软件的基础！** 🎯