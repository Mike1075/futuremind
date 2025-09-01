# 移动端组件库 API 文档

## 📱 概述

未来心灵学院移动端组件库提供了一套完整的移动端优化组件，支持手势交互、触觉反馈、PWA功能等。

## 🎯 设计原则

- **触摸优先**: 所有组件都针对触摸交互进行优化
- **性能优先**: 自动根据设备性能调整动画和渲染
- **无障碍**: 支持屏幕阅读器和键盘导航
- **响应式**: 适配各种移动设备尺寸

## 📦 组件导入

```typescript
// 导入所有移动端组件
import {
  MobileButton,
  MobileFAB,
  MobileCard,
  MobileContainer,
  MobileGrid,
  MobileGridItem,
  MobileSwipeNavigation,
  MobileLongPressMenu,
  MobileLazyImage,
  PWAInstaller
} from '@/components/mobile'

// 导入工具函数和Hooks
import {
  useMobileGestures,
  useHapticFeedback,
  getOptimalAnimationConfig,
  usePushNotifications
} from '@/components/mobile'
```

## 🔧 核心组件

### MobileButton

移动端优化的按钮组件，支持触觉反馈和加载状态。

```typescript
interface MobileButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  hapticFeedback?: 'light' | 'medium' | 'heavy'
  onClick?: () => void
}

// 使用示例
<MobileButton 
  variant="primary" 
  size="lg" 
  hapticFeedback="medium"
  onClick={() => console.log('点击')}
>
  开始探索
</MobileButton>
```

### MobileContainer

移动端容器组件，提供安全区域和响应式布局。

```typescript
interface MobileContainerProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  center?: boolean
  animated?: boolean
  safeArea?: boolean
}

// 使用示例
<MobileContainer padding="lg" center safeArea>
  <h1>页面内容</h1>
</MobileContainer>
```

### MobileGrid

移动端网格布局组件，支持动画和响应式。

```typescript
interface MobileGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  animated?: boolean
  staggerDelay?: number
}

// 使用示例
<MobileGrid cols={2} gap="md" animated>
  <MobileGridItem span={1}>项目1</MobileGridItem>
  <MobileGridItem span={1}>项目2</MobileGridItem>
</MobileGrid>
```

## 🎮 交互组件

### useMobileGestures Hook

提供移动端手势支持的Hook。

```typescript
interface GestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onLongPress?: () => void
  onDoubleTap?: () => void
  onPinch?: (scale: number) => void
}

// 使用示例
const gestureRef = useMobileGestures({
  onSwipeLeft: () => console.log('左滑'),
  onSwipeRight: () => console.log('右滑'),
  onLongPress: () => console.log('长按'),
  onDoubleTap: () => console.log('双击'),
  onPinch: (scale) => console.log('缩放:', scale)
})

return <div ref={gestureRef}>支持手势的内容</div>
```

### useHapticFeedback Hook

提供触觉反馈功能。

```typescript
const haptic = useHapticFeedback()

// 使用示例
haptic.light()    // 轻微震动
haptic.medium()   // 中等震动
haptic.heavy()    // 强烈震动
haptic.success()  // 成功反馈
haptic.error()    // 错误反馈
```

## 🚀 PWA组件

### PWAInstaller

自动检测并提示用户安装PWA应用。

```typescript
// 自动使用，无需配置
<PWAInstaller />
```

### usePushNotifications Hook

管理推送通知功能。

```typescript
const {
  isSupported,
  isSubscribed,
  permission,
  subscribe,
  unsubscribe,
  sendWelcomeNotification,
  sendDailyReminder
} = usePushNotifications()

// 使用示例
const handleSubscribe = async () => {
  const success = await subscribe()
  if (success) {
    await sendWelcomeNotification()
  }
}
```

## 🎨 样式系统

### 移动端断点

```css
/* 移动端优先的响应式断点 */
.mobile-only { display: block; }
.tablet-up { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .tablet-up { display: block; }
}
```

### 安全区域

```css
/* iOS安全区域支持 */
.pt-safe-area-inset-top { padding-top: env(safe-area-inset-top); }
.pb-safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

## 🔧 工具函数

### 性能优化

```typescript
// 获取设备性能等级
const performanceLevel = getDevicePerformanceLevel() // 'high' | 'medium' | 'low'

// 获取优化的动画配置
const animationConfig = getOptimalAnimationConfig(isMobile)

// 获取优化的粒子数量
const particleCount = getOptimalParticleCount(isMobile)
```

### 设备检测

```typescript
// 获取移动端视口信息
const viewport = getMobileViewport()
// {
//   width: number,
//   height: number,
//   isPortrait: boolean,
//   isLandscape: boolean,
//   devicePixelRatio: number,
//   isMobile: boolean,
//   isTablet: boolean,
//   isDesktop: boolean
// }
```

## 🤝 团队协作指南

### 其他功能模块集成

1. **AI集成团队**: 使用 `usePushNotifications` 发送AI消息通知
2. **意识树团队**: 使用 `useMobileGestures` 添加手势交互
3. **PBL协作团队**: 使用 `MobileCard` 和 `MobileGrid` 展示项目
4. **内容管理团队**: 使用 `MobileLazyImage` 优化图片加载
5. **数据分析团队**: 使用性能监控工具收集移动端数据

### 代码规范

```typescript
// ✅ 推荐：使用移动端组件
import { MobileButton } from '@/components/mobile'

<MobileButton variant="primary" hapticFeedback="medium">
  操作按钮
</MobileButton>

// ❌ 避免：直接使用普通按钮
<button className="...">操作按钮</button>
```

### 性能最佳实践

1. **动画优化**: 使用 `getOptimalAnimationConfig()` 获取设备适配的动画配置
2. **图片优化**: 使用 `MobileLazyImage` 组件进行懒加载
3. **手势支持**: 为重要交互添加 `useMobileGestures` 支持
4. **触觉反馈**: 在用户操作时提供适当的触觉反馈

## 📋 集成检查清单

- [ ] 导入移动端组件库
- [ ] 替换普通按钮为 `MobileButton`
- [ ] 添加手势支持到关键交互
- [ ] 实现触觉反馈
- [ ] 优化图片加载
- [ ] 测试PWA功能
- [ ] 验证跨设备兼容性

## 🐛 调试支持

在开发环境中，可以通过以下方式调试移动端功能：

1. 使用Chrome DevTools的设备模拟器
2. 在真实设备上测试触摸交互
3. 检查PWA安装提示是否正常显示
4. 验证触觉反馈是否工作

## 📞 技术支持

如有问题，请联系移动端优化团队或查看以下资源：

- 组件源码: `src/components/mobile/`
- 工具函数: `src/utils/mobilePerformance.ts`
- 手势支持: `src/hooks/useMobileGestures.ts`
- PWA配置: `public/manifest.json`, `public/sw.js`
