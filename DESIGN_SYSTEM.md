# 未来心灵学院 - 设计系统文档

## 1. 颜色系统

### 主题色
- **cosmic-void**: `#0a0a1f` - 深空黑（主背景）
- **cosmic-deep**: `#0d0d2b` - 深紫黑
- **mystic-purple**: `#9D00FF` - 神秘紫（主强调色）
- **ethereal-blue**: `#00FFFF` - 空灵青
- **gaia-gold**: `#FFD700` - 盖亚金
- **life-pink**: `#FF6B6B` - 生命粉
- **starlight**: `#F8F8FF` - 星光白（主文字）
- **starlight-muted**: `rgba(248, 248, 255, 0.6)` - 星光白（次要文字）
- **starlight-dim**: `rgba(248, 248, 255, 0.4)` - 星光白（辅助文字）

### 炫彩渐变色序列
```css
#FFD700, #FF6B6B, #9D00FF, #00FFFF, #00FF88, #FFD700
```

## 2. 卡片系统

### 玻璃卡片（Glass Card）
默认状态：
- 背景: `rgba(10, 10, 31, 0.5)` 半透明
- 模糊: `backdrop-filter: blur(8px)`
- 边框: 课程主题色 `rgba(color, 0.25)` 浅色

悬停状态（炫彩边框）：
- 使用外层wrapper + 内层inner结构
- 外层padding作为边框宽度（2px）
- 悬停时外层显示 conic-gradient 炫彩渐变
- 内层变为不透明背景 `#0a0a1f` 遮住中间

```css
/* 外层容器 */
.portal-card-wrapper {
  padding: 2px;
  border-radius: 1rem;
  background: var(--course-border-color, rgba(156, 163, 175, 0.2));
  transition: background 0.4s ease;
}

.portal-card-wrapper:hover {
  background: conic-gradient(
    from var(--card-border-angle, 0deg),
    #FFD700, #FF6B6B, #9D00FF, #00FFFF, #00FF88, #FFD700
  );
  animation: card-border-spin 4s linear infinite;
}

/* 内层内容 */
.portal-card-inner {
  background: rgba(10, 10, 31, 0.5);
  backdrop-filter: blur(8px);
  border-radius: calc(1rem - 2px);
  border: 1px solid var(--course-border-color);
  transition: border-color 0.4s ease; /* 只过渡边框，背景即时变化 */
}

.portal-card-wrapper:hover .portal-card-inner {
  background: #0a0a1f; /* 不透明，遮住炫彩 */
  border-color: transparent;
}
```

### 课程主题边框色
```typescript
const getCourseBorderColor = (systemKey: string) => {
  switch (systemKey) {
    case 'listening': return 'rgba(168, 85, 247, 0.25)' // 紫色
    case 'earth': return 'rgba(34, 211, 238, 0.25)' // 青色
    case 'icarus':
    case 'pbl': return 'rgba(251, 146, 60, 0.25)' // 橙色
    default: return 'rgba(156, 163, 175, 0.25)' // 灰色
  }
}
```

## 3. 图标边框系统（如盖亚图标）

使用 CSS @property 实现颜色流动效果（边框固定，颜色旋转）：

```css
@property --gaia-border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.gaia-icon-border {
  background: conic-gradient(
    from var(--gaia-border-angle),
    #FFD700, #FF6B6B, #9D00FF, #00FFFF, #00FF88, #FFD700
  );
  animation: gaia-border-rotate 4s linear infinite;
}

@keyframes gaia-border-rotate {
  from { --gaia-border-angle: 0deg; }
  to { --gaia-border-angle: 360deg; }
}
```

## 4. 按钮系统

### 星尘按钮（Stardust Button）
```css
.btn-stardust {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.3), rgba(0, 255, 255, 0.2));
  border: 1px solid rgba(157, 0, 255, 0.4);
  color: #F8F8FF;
  backdrop-filter: blur(8px);
}

.btn-stardust:hover {
  background: linear-gradient(135deg, rgba(157, 0, 255, 0.5), rgba(0, 255, 255, 0.3));
  border-color: rgba(157, 0, 255, 0.6);
  box-shadow: 0 0 20px rgba(157, 0, 255, 0.3);
}
```

### 炫彩按钮（Rainbow Button）- 悬停时炫彩边框
使用与卡片相同的wrapper+inner结构

## 5. 字体系统

### 字号
- `text-h1`: 2.5rem (40px) - 页面主标题
- `text-h2`: 1.75rem (28px) - 区块标题
- `text-h3`: 1.25rem (20px) - 卡片标题
- `text-body`: 1rem (16px) - 正文
- `text-small`: 0.875rem (14px) - 辅助文字
- `text-xs`: 0.75rem (12px) - 标签/时间

### 字重
- 标题: `font-medium` (500) 或 `font-bold` (700)
- 正文: `font-normal` (400)

## 6. 动画系统

### 边框旋转动画
```css
@property --card-border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes card-border-spin {
  from { --card-border-angle: 0deg; }
  to { --card-border-angle: 360deg; }
}
```

### 入场动画（Framer Motion）
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

## 7. 组件清单

| 组件 | 类名 | 用途 |
|------|------|------|
| 玻璃卡片 | `.card-glass` | 内容容器 |
| 炫彩边框卡片 | `.portal-card-wrapper` + `.portal-card-inner` | 可点击卡片 |
| 星尘按钮 | `.btn-stardust` | 主要按钮 |
| 导航栏 | `.nav-ethereal` | 顶部导航 |
| 进度条 | `.progress-ethereal` | 学习进度 |
| 加载器 | `.loader-ethereal` | 加载状态 |

## 8. 使用示例

### 炫彩边框卡片
```tsx
<div
  className="portal-card-wrapper cursor-pointer"
  style={{ '--course-border-color': 'rgba(168, 85, 247, 0.25)' }}
>
  <div className="portal-card-inner p-6">
    {/* 卡片内容 */}
  </div>
</div>
```

### 盖亚图标
```tsx
<div className="gaia-icon-border p-[3px] rounded-xl">
  <div className="gaia-icon-inner w-12 h-12 rounded-[10px] flex items-center justify-center">
    <Icon className="w-6 h-6 text-starlight" />
  </div>
</div>
```
