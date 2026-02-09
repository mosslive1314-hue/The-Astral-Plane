export default function SimplePage() {
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>✅ 服务器正常工作!</h1>
            <p style={{ fontSize: '24px', marginBottom: '30px' }}>如果你能看到这个页面，说明 Next.js 运行正常。</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <a href="/login" style={{ padding: '15px 30px', background: '#8b5cf6', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '18px' }}>
                前往登录页
              </a>
              <a href="/test" style={{ padding: '15px 30px', background: '#3b82f6', color: 'white', borderRadius: '10px', textDecoration: 'none', fontSize: '18px' }}>
                测试页面
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
