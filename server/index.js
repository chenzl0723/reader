import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { CONFIG } from './config.js'
import generateRouter from './routes/generate.js'
import resolveRouter from './routes/resolve.js'
import { startDomainHealthCheckJob } from './services/healthCheck.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 中间件配置
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 挂载路由
app.use(resolveRouter)
app.use('/api', generateRouter)

// 静态文件托管（前端打包构建后的目录）
const distPath = path.join(__dirname, '../reader')

// 兼容两种访问形态：
// 1) /reader/xxx  子路径部署（nginx gateway.conf 场景，配合 vite base='/reader/'）
// 2) /xxx         根路径部署（Render / Railway 等平台默认给根域名，配合 VITE_BASE='/'）
app.use('/reader', express.static(distPath))
app.use(express.static(distPath))

// SPA 单页路由退回兜底
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>悦知精灵</title></head>
        <body style="background:#0F0C07;color:#FDE68A;font-family:sans-serif;text-align:center;padding-top:100px;">
          <h2>悦知精灵防封调度服务运行中</h2>
          <p>请先运行 npm run build 生成静态文件。</p>
        </body>
        </html>
      `)
    }
  })
})

// 启动服务器
app.listen(CONFIG.PORT, () => {
  console.log(`===========================================`)
  console.log(`🚀 悦知精灵防封调度中台已启动`)
  console.log(`🌐 服务运行端口: http://localhost:${CONFIG.PORT}`)
  console.log(`===========================================`)

  // 启动定时防红检测脚本
  startDomainHealthCheckJob()
})
