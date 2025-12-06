// 强制动态渲染，避免 ISR 缓存问题
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
