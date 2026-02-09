export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">测试页面</h1>
        <p className="text-xl">如果你能看到这个页面，说明服务器正常工作！</p>
        <a href="/login" className="inline-block mt-8 px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600">
          前往登录页
        </a>
      </div>
    </div>
  )
}
