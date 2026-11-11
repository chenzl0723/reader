# 纯静态部署（GitHub + Render Static Site）

只发布前端构建产物，**不启动 Node 服务**。构建命令：

```bash
VITE_BASE=/ npm run build
```

产物在 `reader/` 目录（`index.html` + `static8/`），这就是要上传的全部内容。

> `VITE_BASE=/` 必须带：项目默认 `base` 是 `/reader/`（给 nginx 子路径用），
> 静态站挂在根域名上，不带这个参数所有 JS/CSS 会 404。

---

## 零、GitHub Pages（当前线上，推荐）

线上地址：https://chenzl0723.github.io/reader/

仓库 `chenzl0723/reader` 已配好 Actions：`.github/workflows/deploy.yml` 在每次 push `main` 时
`npm ci && npm run build`，用 `peaceiris/actions-gh-pages` 把 `reader/`（构建产物）推到 `gh-pages` 分支。
**GitHub Pages 走的是 `gh-pages` 分支，不是 `main`** —— 所以 `base` 保持默认 `/reader/` 即可，不需要 `VITE_BASE=/`。

仓库 Settings → Pages 的配置必须是：

| 项 | 值 |
| --- | --- |
| Source | Deploy from a branch |
| Branch | `gh-pages` |
| Folder | `/ (root)` |

> 若误设成 `main` / root，Pages 会把 Vite 源码当 Jekyll 站发布，根页面引用 `/src/main.js`，白屏。

### SPA 路由兜底

Pages 没有 nginx 的 `try_files`，工作流里已加一步：

```yaml
- name: SPA fallback (404.html)
  run: cp reader/index.html reader/404.html
```

`404.html` 与 `index.html` 同内容 → `/reader/go?xxx` 这类深层链接刷新后仍由前端路由接管
（HTTP 状态仍是 404，但浏览器能正常渲染）。**改动 `index.html` 入口时不要漏掉这步。**

### 更新与自查

```bash
git add -A && git commit -m "xxx" && git push    # 自动构建发布，链接不变

BASE=https://chenzl0723.github.io/reader
curl -I $BASE/                                  # 200 text/html
curl -s $BASE/static8/js/main.*.js -o /dev/null -w '%{http_code}\n'   # 200
curl -s $BASE/go | head -3                      # 返回 index.html 内容
```

---

## 一、推到 GitHub

Render 只支持 GitHub / GitLab / Bitbucket，不能直连 Gitee。在 GitHub 建空仓库后：

```bash
cd infohub-ui/reader
git init
git add .
git commit -m "chore: static deploy config"
git branch -M main
git remote add origin https://github.com/<你的账号>/reader-web.git
git push -u origin main
```

`.gitignore` 已排除 `node_modules` 和 `reader/`（构建产物由平台重新生成）。
若想保留整仓结构，整仓推 GitHub，创建服务时 Root Directory 填 `infohub-ui/reader`。

## 二、在 Render 创建静态站

Dashboard → **New +** → **Static Site** → 选仓库，填：

| 项 | 值 |
| --- | --- |
| Name | `reader-static` |
| Branch | `main` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `reader` |
| Environment | `VITE_BASE` = `/`，`NODE_VERSION` = `20` |
| Redirects/Rewrites | Source `/*` → Destination `/index.html`，Action **Rewrite** |

最后一条不能漏：`/go`、`/mine/focusCode` 是前端路由，不加 rewrite 直接刷新会 404。
仓库根目录有 `render.yaml` 时也可以直接 New + → Blueprint 自动读配置。

## 三、上线后自查

```bash
BASE=https://<name>.onrender.com
curl -I $BASE/                     # 200 text/html
curl -I $BASE/go                   # 200，返回的是 index.html
curl -I $BASE/static8/js/main.*.js # 200
```

浏览器打开 `$BASE/go?brokerageUserId=434&deptId=1&scan=1`，落地页能正常渲染并倒计时跳转即可。

## 四、纯静态后的功能边界

| 路由 | 状态 |
| --- | --- |
| `/go`、`/mine/focusCode` | 正常。落地页取的是外部接口 `https://97api.szinfohub.cn/app-api/system/business-domain/get-active`，不依赖本项目后端 |
| `/guide` | 正常，纯前端页 |
| `/switch` | **不可用**。该页 `fetch('/api/resolve')`，静态站没有这个接口，会一直停在"正在连接安全中继线路"并每秒重试 |

`/switch` 如果也要保留，两个办法：给它加一段"接口连续失败 N 次后改用固定地址跳转"的前端兜底逻辑；
或者把 `/api/resolve` 换成上面那个外部业务域名池接口。需要的话告诉我，我改。

## 五、后续更新

改完代码 → `VITE_BASE=/ npm run build` 本地确认 → `git push`，Render 自动重新构建发布，链接不变。
