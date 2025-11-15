# 盖亚知识库向量数据搜索报告

生成时间: 2025-11-14

## 执行摘要

搜索了Supabase数据库中的盖亚知识库向量数据,发现以下情况:

### 数据库统计
- **总文档数**: 3,631条
- **包含project_id的文档**: 1,000条 (p001项目)
- **无project_id的文档**: 11条

### 项目数据状态

#### ✅ p001: 伊卡洛斯计划 (已找到)
- **状态**: 已导入
- **文档数量**: 989-1000条
- **源书籍**: "Seven Experiments That Could Change the World - A Do-It-Yourself Guide to Revolutionary Science"
- **作者**: Rupert Sheldrake
- **首次创建**: 2025-11-13 04:46:42
- **最后创建**: 2025-11-13 06:04:20
- **内容特点**: 包含关于动物行为实验、心灵感应等内容

#### ❌ p002: 观音之旅 (未找到)
- **状态**: 未导入
- **搜索关键词**: "观音"、"聆听"
- **结果**: 无匹配记录

#### ❌ p003: 卡罗洛韦里 (未找到)
- **状态**: 未导入
- **搜索关键词**: "卡罗"、"Rovelli"、"Carlo"
- **结果**: 无匹配记录

#### ❌ p004: 欢迎来到地球 (未找到)
- **状态**: 未导入
- **搜索关键词**: "欢迎来到地球"、"Welcome to Earth"
- **结果**: 无匹配记录

## 关键词搜索结果

### 成功找到的关键词
- ✓ "Seven Experiments" - 大量匹配 (p001)
- ✓ "pigeons" - 找到匹配 (实验相关)
- ✓ "dogs" - 找到匹配 (实验相关)
- ✓ "telepathy" - 找到匹配 (心灵感应相关)

### 未找到的关键词
- ✗ "伊卡洛斯" - 无匹配
- ✗ "Icarus" - 无匹配
- ✗ "观音" - 无匹配
- ✗ "聆听" - 无匹配
- ✗ "卡罗" - 无匹配
- ✗ "Rovelli" - 无匹配
- ✗ "Carlo" - 无匹配
- ✗ "欢迎来到地球" - 无匹配
- ✗ "Welcome to Earth" - 无匹配

## Metadata 结构分析

### 发现的字段
- `loc` - 文档位置信息 (行号范围)
- `pdf` - PDF元数据 (标题、作者、创建日期等)
- `project_id` - 项目ID (p001)
- `title` - 文档标题
- `source` - 来源信息
- `category` - 分类
- `blobType` - Blob类型
- `type` - 类型标记
- `auto_created` - 自动创建标记

### p001 样本Metadata
```json
{
  "loc": {
    "lines": { "from": 1, "to": 8 }
  },
  "pdf": {
    "info": {
      "Title": "Seven Experiments That Could Change the World",
      "Author": "Rupert Sheldrake",
      "Creator": "Adobe InDesign CS5 (7.0)",
      "ModDate": "D:20120328201806+05'30'",
      "Producer": "Adobe PDF Library 9.9",
      "CreationDate": "D:20120328055618+05'30'"
    }
  },
  "project_id": "p001",
  "title": "Seven Experiments That Could Change the World - A Do-It-Yourself Guide to Revolutionary Science"
}
```

## p001 内容样本

### 第一个文档片段 (ID示例)
```
pens they are very confused, just as most people would be if
they went home and found a gap where their house used to
be. Even if they could plainly see the house some distance
down the road, th...
```

### 包含 "experiment" 的内容片段
文档中包含大量关于实验设计和方法的内容,涉及:
- 动物行为观察
- 心灵感应实验
- 科学方法论

## 数据完整性分析

### 数据导入情况
1. **已完成**: p001 (伊卡洛斯计划) - 约1000条文档片段
2. **待导入**:
   - p002 (观音之旅)
   - p003 (卡罗洛韦里)
   - p004 (欢迎来到地球)

### 向量化状态
- 所有p001文档都应该包含embedding向量
- 向量用于语义搜索和RAG应用

## 建议

### 短期行动
1. 确认p002、p003、p004的导入计划
2. 检查导入脚本是否正常运行
3. 验证PDF文件是否准备就绪

### 长期优化
1. 统一metadata结构
2. 添加更多元数据字段:
   - 章节信息
   - 关键词标签
   - 难度级别
   - 推荐年龄段
3. 建立内容分类体系
4. 实现全文搜索优化

## 附录

### 查询脚本
- `scripts/search-gaia-documents.ts` - 基础搜索脚本
- `scripts/analyze-gaia-documents.ts` - 详细分析脚本

### 数据库信息
- Supabase URL: https://lvjezsnwesyblnlkkirz.supabase.co
- 表名: documents
- 主要字段: id, project_id, metadata, content, embedding, created_at

---

**备注**: 本报告基于2025-11-14的数据快照生成
