# 图片生成工具使用指南

## 快速开始

### 方案A: 自动生成（需要代理）

如果你有可用的代理服务器：

```bash
# Windows PowerShell
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
npx tsx scripts/generate-project-covers-rest.ts

# Linux/Mac
export HTTP_PROXY="http://127.0.0.1:7890"
export HTTPS_PROXY="http://127.0.0.1:7890"
npx tsx scripts/generate-project-covers-rest.ts
```

### 方案B: 手动生成（推荐）

#### 步骤1: 导出prompts
```bash
npx tsx scripts/export-image-prompts.ts
```

这将生成 `scripts/image-prompts.md` 文件，包含所有12个项目的详细prompts。

#### 步骤2: 使用AI工具生成图片

打开 `scripts/image-prompts.md`，复制每个项目的prompt到：

- **Midjourney**: https://www.midjourney.com/
- **DALL-E**: https://labs.openai.com/
- **Stable Diffusion**: https://stablediffusionweb.com/
- **通义万相**: https://tongyi.aliyun.com/wanxiang/
- **文心一格**: https://yige.baidu.com/

**推荐参数**:
- 尺寸: 16:9 或 1792x1024
- 质量: 高清/4K
- 风格: 写实+科技感

#### 步骤3: 下载并命名图片

将生成的图片下载并重命名为对应的项目ID：

例如：
- `a1af21a9-731f-4500-8050-b9e8e062f88e.png`
- `268e0c10-cc2e-4e20-8ac9-0f7f67cb46a1.png`
- ... (见 `image-prompts.md` 中的快速参考表)

#### 步骤4: 上传图片

将所有PNG文件放到：
```
public/images/project-covers/
```

#### 步骤5: 更新数据库

```bash
npx tsx scripts/update-project-covers-manual.ts
```

这个脚本会：
- 扫描 `public/images/project-covers/` 目录
- 检测哪些项目有图片
- 自动更新数据库的 `project_cover_image` 字段

## 12个项目列表

| # | 项目名称 | 项目ID | 难度 |
|---|---------|--------|------|
| 1 | 我的宠物的第六感日记 | a1af21a9-731f-4500-8050-b9e8e062f88e | 基础探索 |
| 2 | 薛定谔的猫砂盆：测试意念的非定域性 | 268e0c10-cc2e-4e20-8ac9-0f7f67cb46a1 | 进阶挑战 |
| 3 | 贝尔不等式与狗狗：设计生物版贝尔实验 | 8afd45f1-3c32-4033-94c2-7079f790b5e7 | 深度研究 |
| 4 | 全球意识场项目：人与动物意识场的全球同步性实验 | b610392d-37ad-4cb5-bfa0-f760287ea6e5 | 创新实践 |
| 5 | 植物的悄悄话：我的植物认识我吗？ | 73b12426-ab0c-49e0-a439-ffa3e3c98523 | 基础探索 |
| 6 | 远程蚁巢：构建虚拟家园实验 | 68a7c037-145e-4d6b-9f4c-d1b4297daa58 | 进阶挑战 |
| 7 | 记忆的水实验：水能记住家的位置吗？ | 3a1fd901-0ea8-4643-8617-b26172d2f18b | 进阶挑战 |
| 8 | 意识地理学：绘制城市的情绪地图 | d8afccbb-c4da-4be6-b2f8-17256729b9ab | 深度研究 |
| 9 | 情绪的颜色：我能感觉到你的心情吗？ | 2682ed7b-6edb-49e5-bc88-66c9d7ecca52 | 基础探索 |
| 10 | 跨越距离的凝视：互联网能传递凝视吗？ | 158ddef5-09e4-4206-b429-af991d2cb0b2 | 进阶挑战 |
| 11 | 随机数生成器与集体意念：我们的思想能影响概率吗？ | b5193e50-5a9c-4754-a0b1-ab8cb16af5b6 | 深度研究 |
| 12 | 幻肢与纠缠：测试身体部分的非定域连接 | 3c26231c-49da-4378-9671-dccdac308f25 | 创新实践 |

## 可用脚本说明

### 1. `generate-project-covers.ts`
使用 @google/generative-ai SDK 自动生成图片（需要代理）

```bash
npx tsx scripts/generate-project-covers.ts
```

### 2. `generate-project-covers-rest.ts`
使用 REST API 自动生成图片（需要代理）

```bash
npx tsx scripts/generate-project-covers-rest.ts
```

### 3. `export-image-prompts.ts`
导出所有项目的prompts到 `image-prompts.md`

```bash
npx tsx scripts/export-image-prompts.ts
```

### 4. `update-project-covers-manual.ts`
扫描目录并更新数据库

```bash
npx tsx scripts/update-project-covers-manual.ts
```

### 5. `test-gemini-api.ts`
测试Gemini API连接

```bash
npx tsx scripts/test-gemini-api.ts
```

## 常见问题

### Q: 为什么自动生成失败？
A: Google API在中国大陆需要代理。建议使用方案B（手动生成）。

### Q: 图片规格要求？
A:
- 格式: PNG
- 尺寸: 16:9 (推荐1792x1024或更高)
- 命名: {项目ID}.png

### Q: 如何验证图片已更新？
A: 运行 `update-project-covers-manual.ts` 会显示更新状态。

### Q: 可以使用JPG吗？
A: 可以，但需要修改脚本中的文件扩展名。建议使用PNG获得更好的质量。

### Q: 图片生成后如何查看？
A: 访问 `http://localhost:3000/images/project-covers/{project-id}.png`

## 技术细节

### API信息
- **模型**: Gemini 2.0 Flash Exp / Gemini 2.5 Flash Image
- **端点**: https://generativelanguage.googleapis.com/v1beta/models/
- **认证**: API Key (GEMINI_API_KEY)
- **定价**: ~$0.039/张

### 数据库字段
- **表**: course_contents
- **字段**: project_cover_image
- **类型**: TEXT (存储相对路径)
- **格式**: `/images/project-covers/{uuid}.png`

### 目录结构
```
futuremind-new/
├── public/
│   └── images/
│       └── project-covers/     # 图片存放位置
│           ├── {id-1}.png
│           ├── {id-2}.png
│           └── ...
├── scripts/
│   ├── generate-project-covers.ts
│   ├── generate-project-covers-rest.ts
│   ├── export-image-prompts.ts
│   ├── update-project-covers-manual.ts
│   ├── test-gemini-api.ts
│   ├── image-prompts.md        # 导出的prompts
│   ├── README-IMAGE-GENERATION.md
│   └── USAGE.md (本文件)
└── .env.local
    └── GEMINI_API_KEY=xxx
```

## 最佳实践

1. **优先使用手动方案**: 更可靠，图片质量可控
2. **批量生成**: 一次性生成所有12张图片
3. **质量检查**: 生成后检查图片是否符合项目主题
4. **备份**: 保存原始高清图片
5. **版本控制**: 如果需要更换图片，保留旧版本

## 支持

详细文档请查看：
- `README-IMAGE-GENERATION.md` - 完整技术文档
- `image-prompts.md` - 所有项目的prompts

如有问题，请联系开发团队。
