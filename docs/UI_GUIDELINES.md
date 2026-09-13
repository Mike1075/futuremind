# UI 设计规范

> FutureMind Institute 宇宙/星空主题设计指南

## 1. 全局星空背景

- 使用 `CosmicBackground` 组件（已在 `layout.tsx` 中引入）
- **所有页面容器不要使用 `bg-black`**，应保持透明以显示星空
- 加载状态也应透明，不遮挡背景

---

## 2. 按钮样式 - `btn-stardust`

- **默认状态**: 透明背景 + 细线边框（金色半透明）
- **悬停状态**: 炫彩流光边框（金色→紫色→青色渐变动画）+ 发光效果
- **禁止**: 实心彩色背景，应始终保持透明玻璃质感

---

## 3. 卡片样式 - `card-rainbow-border`

- **默认状态**: 透明玻璃背景（`bg-white/5 backdrop-blur`）+ 细线白色边框
- **悬停状态**: 只有边框显示炫彩流光，内部保持透明玻璃
- **关键技术**: 使用 CSS `mask-composite: exclude` 实现只显示边框渐变

---

## 4. 弹窗/模态框

| 元素 | 样式 |
|------|------|
| 背景遮罩 | `bg-black/60 backdrop-blur-md` |
| 弹窗容器 | `bg-white/5 backdrop-blur-xl border border-white/20` |
| 关闭按钮 | `bg-white/10 hover:bg-white/20` |
| 输入框 | `bg-white/5 border border-white/20` |
| 禁用输入框 | `bg-white/5 border border-white/10` |
| 下拉框 | `bg-white/5 border border-white/20` |

---

## 5. 开关组件 (Toggle Switch)

- **关闭态**: `bg-white/20`（不要用 `bg-gray-600`）
- **开启态**: `bg-emerald-500`（统一用翠绿色表示开启）
- **焦点环**: `focus:ring-purple-500 focus:ring-offset-black`
- **状态标签**:
  - 开启: `bg-emerald-500/20 text-emerald-400`
  - 关闭: `bg-white/10 text-starlight-muted`

```jsx
// 标准开关组件
<button
  onClick={() => setEnabled(!enabled)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black
    ${enabled ? 'bg-emerald-500' : 'bg-white/20'}`}
>
  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
    ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
</button>
```

---

## 6. Toast 提示

- 位置: 屏幕正中央（`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`）
- 样式: 玻璃透明背景 + 对应状态的边框颜色

---

## 7. 进度条

- 使用 `progress-ethereal` + `progress-ethereal-bar` 类
- 彩虹渐变效果

---

## 8. 用户头像图标

- **结构**: 外层炫彩渐变边框 + 内层黑色剪影
- **渐变**: `from-blue-400 via-purple-500 to-pink-500`（蓝→紫→粉）
- **动画**: **无旋转**（避免视觉晕眩）
- **内层**: 黑色背景 + 彩色首字母

```jsx
// 标准用户头像图标
<div className="relative">
  {/* 炫彩边框层（不旋转） */}
  <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-75 blur-[2px]"></div>
  {/* 黑色剪影层 */}
  <div className="relative w-7 h-7 bg-black rounded-lg flex items-center justify-center">
    <span className="text-blue-400 font-bold text-xs">
      {userName.charAt(0)}
    </span>
  </div>
</div>
```

**变体**：
- **星星图标**: 渐变用 `from-amber-400 via-orange-500 to-pink-500`，**保留旋转**
- **圆形头像**: `rounded-full` 替代 `rounded-lg`

---

## 9. 音频播放器

**组件**: `components/courses/AudioPlayer.tsx`

**设计规范**:
- **外层容器**: `audio-section-wrapper`（悬停显示炫彩边框）
- **内层容器**: `audio-section-inner`（纯黑背景 `#000`，隔绝外部颜色）
- **悬停效果**: 只有边框炫彩，内部保持纯黑
- **进度条**: 三色渐变 `from-pink-500 via-purple-500 to-cyan-500`
- **播放按钮**: 圆形 `bg-white/10 hover:bg-white/20`

```css
.audio-section-wrapper::after {
  z-index: 10;  /* 确保边框在内容之上 */
}
.audio-section-inner {
  background: #000;  /* 纯黑背景，隔绝外部颜色 */
  z-index: 1;
}
```

**使用方式**:
```tsx
import { AudioPlayer } from '@/components/courses/AudioPlayer'
<AudioPlayer src={resource.url} title={resource.title} />
```

---

## 10. 登录界面

**两个登录入口**：
- `app/login/page.tsx` - 独立登录页面
- `components/AuthModal.tsx` - 登录弹窗

**标题区域**:
```tsx
<h2 className="font-sacred text-2xl md:text-3xl text-white tracking-wide mb-3">
  欢迎回来
</h2>
<p className="text-starlight-dim text-sm">
  登录以继续你的意识觉醒之旅
</p>
```

**输入框**:
```tsx
className="w-full bg-white/5 border border-amber-500/30 rounded-xl py-3 pl-12 pr-4
  text-white placeholder-white/40
  focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40
  focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]
  transition-all backdrop-blur-sm"
```

**切换链接**（登录/注册）:
```tsx
className="text-sm text-transparent bg-clip-text bg-gradient-to-r
  from-amber-400 via-purple-400 to-cyan-400
  hover:from-amber-300 hover:via-purple-300 hover:to-cyan-300
  transition-all font-medium"
```

**禁止**:
- 不要添加顶部星星图标
- 不要使用 `bg-cosmic-800/50` 等旧样式
- 不要使用 `bg-gradient-cosmic` 按钮样式

---

## 11. AI 批改话术

### 聆听课程（冥想内省类）

| 分数段 | 风格 | 示例 |
|-------|------|------|
| **90-100** | 充分肯定 + 深化练习 | "你的觉察力让我印象深刻！接下来可以试试..." |
| **80-89** | 赞赏深度 + 细化体验 | "这份反思很有深度。如果能再描述一下..." |
| **60-79** | 鼓励连接 + 练习方向 | "你正在建立与内在的连接！下次可以试着..." |
| **30-59** | 理解过程 + 降低压力 | "冥想需要慢慢适应，别着急。建议..." |
| **0-29** | 温和引导 + 强调真诚 | "别担心，找个安静的时间，写下一句真实感受就好..." |

### 探究实践类（地球小探险家 + 伊卡洛斯）

| 分数段 | 风格 | 示例 |
|-------|------|------|
| **90-100** | 肯定探究 + 延伸探索 | "你的观察力让我惊喜！可以试试把发现和其他现象联系起来..." |
| **80-89** | 赞赏观察 + 深化分析 | "很棒的探究！如果能补充更多细节..." |
| **60-79** | 鼓励好奇 + 探究方法 | "你迈出了第一步！下次可以多问几个为什么..." |
| **30-59** | 理解困难 + 具体步骤 | "探究需要一点耐心。建议先看看项目要求..." |
| **0-29** | 温和鼓励 + 降低门槛 | "别担心，选一个感兴趣的角度，观察一下、写下来就好..." |

---

*最后更新: 2025-12-06*
