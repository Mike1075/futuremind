import Link from 'next/link'

export default function MikeTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8">
          Mike的分支
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          这是一个测试页面，用来验证新分支的部署功能
        </p>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <p className="text-lg text-white">
            ✅ 分支创建成功<br/>
            ✅ 页面渲染正常<br/>
            ✅ 准备测试部署
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
