# PBL项目封面图片生成指南

## 概述

本项目包含使用 Gemini 2.5 Flash Image 模型为12个伊卡洛斯计划PBL项目生成精美封面图片的脚本。

## 文件说明

### 1. `generate-project-covers.ts`
使用 `@google/generative-ai` SDK的标准实现版本。

### 2. `generate-project-covers-rest.ts`
使用直接REST API调用的版本，避免SDK可能的兼容性问题。

### 3. `test-gemini-api.ts`
API连接测试脚本，用于诊断网络问题。

## 网络问题说明

### 问题症状
```
❌ Error: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent: fetch failed
```

### 原因
Google Generative AI API在中国大陆需要通过代理访问。

## 解决方案

### 方案1：使用HTTP代理（推荐）

#### 步骤：

1. **安装代理工具**（如有）
   - Clash、V2Ray、Shadowsocks等

2. **配置Node.js环境变量**

在Windows PowerShell中：
```powershell
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
npx tsx scripts/generate-project-covers-rest.ts
```

在Linux/Mac中：
```bash
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"
npx tsx scripts/generate-project-covers-rest.ts
```

3. **或者修改脚本添加代理配置**

在 `generate-project-covers-rest.ts` 中添加：

```typescript
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890');

// 在fetch调用中添加agent
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(requestBody),
  agent: proxyAgent  // 添加这行
});
```

需要安装依赖：
```bash
npm install https-proxy-agent
```

### 方案2：在支持访问的环境中运行

1. **使用云服务器**
   - AWS、Google Cloud、Azure等海外服务器
   - 上传脚本到服务器执行

2. **使用GitHub Actions**
   - 创建GitHub Actions workflow
   - 在CI/CD环境中自动执行

3. **使用本地VPN**
   - 连接到支持访问Google API的网络环境

### 方案3：使用替代图片生成服务

如果无法解决网络问题，可以考虑：

1. **使用其他AI图片生成服务**
   - Stability AI (Stable Diffusion)
   - Midjourney API
   - DALL-E API
   - 阿里通义万相
   - 百度文心一格

2. **手动生成图片**
   - 使用AI图片生成工具（如Midjourney网页版）
   - 使用提供的prompt模板生成图片
   - 手动上传到 `public/images/project-covers/`
   - 运行数据库更新脚本

## 项目信息

### 12个伊卡洛斯项目：

1. **我的宠物的第六感日记** (基础探索)
   - 模块1：观察与感知

2. **薛定谔的猫砂盆：测试意念的非定域性** (进阶挑战)
   - 模块2：量子与意识

3. **贝尔不等式与狗狗：设计生物版贝尔实验** (深度研究)
   - 模块2：量子与意识

4. **全球意识场项目：人与动物意识场的全球同步性实验** (创新实践)
   - 模块3：集体意识

5. **植物的悄悄话：我的植物认识我吗？** (基础探索)
   - 模块1：观察与感知

6. **远程蚁巢：构建虚拟家园实验** (进阶挑战)
   - 模块3：集体意识

7. **记忆的水实验：水能记住家的位置吗？** (进阶挑战)
   - 模块2：量子与意识

8. **意识地理学：绘制城市的情绪地图** (深度研究)
   - 模块3：集体意识

9. **情绪的颜色：我能感觉到你的心情吗？** (基础探索)
   - 模块1：观察与感知

10. **跨越距离的凝视：互联网能传递凝视吗？** (进阶挑战)
    - 模块2：量子与意识

11. **随机数生成器与集体意念：我们的思想能影响概率吗？** (深度研究)
    - 模块3：集体意识

12. **幻肢与纠缠：测试身体部分的非定域连接** (创新实践)
    - 模块2：量子与意识

## Prompt设计原则

脚本会根据项目特征自动生成prompt：

- **难度级别映射主题**：
  - 基础探索 → 明亮、温馨、柔和
  - 进阶挑战 → 动感、鲜艳、引人入胜
  - 深度研究 → 精致、深色、神秘
  - 创新实践 → 未来感、前卫、大胆

- **模块映射视觉元素**：
  - 模块1 → 自然、感知、正念
  - 模块2 → 量子物理、意识、宇宙连接
  - 模块3 → 互联、网络、全球统一

- **通用要求**：
  - 16:9宽屏格式
  - 4K质量
  - 现代专业风格
  - 适合12-18岁学生
  - 纯视觉表达（无文字）

## API配置

### Gemini 2.0 Flash Exp (推荐)
- **模型名称**: `gemini-2.0-flash-exp`
- **配置**:
  ```json
  {
    "responseModalities": ["Image"],
    "responseMimeType": "image/png"
  }
  ```

### Gemini 2.5 Flash Image (替代)
- **模型名称**: `gemini-2.5-flash-image-preview`
- **配置**: 同上

### 定价
- **Gemini 2.5 Flash Image**: $0.039/张 (1290 tokens/张)
- **生成时间**: 约3-5秒/张

## 执行脚本

### 标准执行
```bash
npx tsx scripts/generate-project-covers-rest.ts
```

### 带代理执行
```bash
# Windows PowerShell
$env:HTTP_PROXY="http://127.0.0.1:7890"; $env:HTTPS_PROXY="http://127.0.0.1:7890"; npx tsx scripts/generate-project-covers-rest.ts

# Linux/Mac
HTTP_PROXY="http://127.0.0.1:7890" HTTPS_PROXY="http://127.0.0.1:7890" npx tsx scripts/generate-project-covers-rest.ts
```

### 测试连接
```bash
npx tsx scripts/test-gemini-api.ts
```

## 输出

- **图片位置**: `public/images/project-covers/{project-id}.png`
- **数据库字段**: `course_contents.project_cover_image`
- **URL格式**: `/images/project-covers/{project-id}.png`

## 故障排除

### 1. 网络连接失败
**症状**: `fetch failed` 或 `ECONNREFUSED`

**解决**: 配置HTTP代理（见方案1）

### 2. API Key无效
**症状**: `401 Unauthorized` 或 `403 Forbidden`

**解决**: 检查 `.env.local` 中的 `GEMINI_API_KEY` 是否正确

### 3. 模型不支持
**症状**: `404 Not Found` 或 `Model not found`

**解决**: 确认使用 `gemini-2.0-flash-exp` 或 `gemini-2.5-flash-image-preview`

### 4. 速率限制
**症状**: `429 Too Many Requests`

**解决**: 脚本已内置10秒延迟，如仍报错可增加延迟时间

### 5. 图片数据为空
**症状**: `⚠️ No image data in response`

**解决**:
- 检查 `responseModalities` 配置
- 确认prompt格式正确
- 尝试更换模型

## 手动备用方案

如果脚本无法运行，可以手动生成：

1. **访问 Google AI Studio**: https://aistudio.google.com/
2. **选择模型**: Gemini 2.0 Flash (图片生成)
3. **复制项目prompt** (见脚本中的 `generateImagePrompt` 函数)
4. **下载生成的图片**
5. **重命名为**: `{project-id}.png`
6. **放置到**: `public/images/project-covers/`
7. **手动更新数据库**:
   ```sql
   UPDATE course_contents
   SET project_cover_image = '/images/project-covers/{project-id}.png'
   WHERE id = '{project-id}';
   ```

## 技术栈

- **Node.js**: >= 20.0.0
- **TypeScript**: ^5
- **依赖包**:
  - `@google/generative-ai`: ^0.24.1
  - `@supabase/supabase-js`: ^2.56.0
  - `node-fetch`: ^3.3.2
  - `dotenv`: ^17.2.3

## 注意事项

1. **API成本**: 每张图片约$0.039，12张总计约$0.47
2. **生成时间**: 完整执行约2-3分钟（包含延迟）
3. **图片质量**: AI生成，质量可能不稳定，建议人工review
4. **数据备份**: 执行前备份数据库
5. **网络要求**: 需要稳定的国际网络连接

## 联系方式

如有问题，请联系开发团队或查看：
- [Gemini API文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [GitHub Issues](您的仓库链接)
