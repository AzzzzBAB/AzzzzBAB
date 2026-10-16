# a4zbabz.top · 个人网站（Demo）

一个纯静态的个人网站：放自己做的小程序，和一些笔记。
无后台、无数据库、无构建步骤，**上传即用**，适合腾讯云 + 宝塔。

设计方向：冷调骨白纸面 + 墨黑字 + 钴蓝主色，右侧「工作台货架」是全站唯一强视觉。
字体全部自托管，不依赖 Google Fonts（国内可直连）。

---

## 一、目录结构

```
a4zbabz/
├── index.html          首页（Hero + 精选作品 + 最新笔记）
├── works.html          全部作品（可按平台筛选）
├── notes.html          全部笔记（可按标签筛选）
├── note.html           笔记详情（note.html?id=slug）
├── about.html          关于
├── 404.html            自定义 404
├── robots.txt
├── assets/
│   ├── css/style.css
│   ├── js/data.js      ★ 所有内容都在这里，改它就能更新网站
│   ├── js/app.js       渲染逻辑（一般不用动）
│   ├── fonts/          自托管字体（Tektur / InstrumentSans / GeistMono）
│   └── img/            图标、二维码、favicon
├── tools/gen-assets.py 生成占位图标/二维码
└── docs/screenshots/   预览截图（**部署时不用上传**）
```

**部署时只上传**：`index.html`、`works.html`、`notes.html`、`note.html`、
`about.html`、`404.html`、`robots.txt`、`assets/`。
`tools/`、`docs/`、`README.md` 不需要上传。

---

## 二、本地预览

直接双击 `index.html` 也能看（数据在 `data.js` 里，不依赖服务器）。
更接近线上效果的话，用任意静态服务器：

```bash
cd a4zbabz
python -m http.server 8123
# 浏览器打开 http://127.0.0.1:8123/
```

---

## 三、怎么更新内容

只改 **`assets/js/data.js`** 一个文件，不用碰 HTML/CSS。

- 加一个小程序：往 `SITE.works` 数组里加一条（照着已有的抄）。
- 加一篇笔记：往 `SITE.notes` 数组里加一条，`content` 用 Markdown 写。
- 改邮箱 / GitHub：改 `SITE.contact`。
- 首页那句自我介绍：改 `SITE.intro`。

支持的 Markdown 子集：`## 二级标题`、`- 列表`、`**加粗**`、`` `行内代码` ``、
以及三反引号代码块。

### 图标 / 二维码

每个作品需要两张图，**文件名必须和 `id` 对应**：

```
assets/img/icon-<id>.svg    作品图标（建议 96×96 方形）
assets/img/qr-<id>.svg      打开二维码（建议 200×200+，正方形）
```

现有的是脚本生成的**占位图**。换成真实图片时，可以直接放同名 `.png`，
然后把 `app.js` 里的 `.svg` 后缀改成 `.png`；或继续用 SVG。
重新生成占位图：`python tools/gen-assets.py`。

---

## 四、部署到宝塔（腾讯云 Linux）

> 国内机房必须先完成 **ICP 备案**，否则 80/443 会被拦截。备案期间可用公网 IP 临时访问。

1. **加站点**：宝塔 → 网站 → 添加站点
   - 域名填 `a4zbabz.top` 和 `www.a4zbabz.top`
   - 不创建数据库（本站不需要）
   - 得到网站根目录，如 `/www/wwwroot/a4zbabz.top`

2. **传文件**：把上面「部署时只上传」的文件传到网站根目录。
   - 宝塔「文件」上传压缩包再解压最快
   - 确认根目录下能直接看到 `index.html`

3. **域名解析**：域名商处加 A 记录，`@` 和 `www` 都指向服务器公网 IP。

4. **安全组**：腾讯云控制台放行 80、443（宝塔面板端口另放）。

5. **HTTPS**：站点设置 → SSL → Let's Encrypt，勾选域名申请；成功后开启
   **强制 HTTPS**。

6. **伪静态 / 404**（Nginx）：站点设置 → 配置文件，加入

   ```nginx
   error_page 404 /404.html;
   location = /404.html { internal; }

   # 静态资源缓存
   location ~* \.(css|js|svg|png|jpg|jpeg|webp|woff2?|ttf)$ {
       expires 30d;
       add_header Cache-Control "public, max-age=2592000";
   }

   # 开启 gzip（宝塔一般已全局开启）
   gzip on;
   gzip_types text/css application/javascript image/svg+xml text/plain;
   ```

7. **（可选）默认文档**：确认默认首页为 `index.html`。

部署完成后访问 `https://a4zbabz.top/` 应看到首页。

---

## 五、已知事项 / 后续可做

- 字体是完整 TTF（共约 360KB）。若在意首屏速度，后续可用 `pyftsubset`
  子集化，或改成 `woff2`（体积可再降一半以上）。
- 平台筛选按钮用到了 CSS `color-mix()`，现代浏览器（Chrome/Edge 111+）支持；
  极旧浏览器会退化成普通边框，不影响使用。
- 目前筛选用的是「平台 / 标签」，若内容变多可加搜索框。
- 演示内容里的邮箱 `hi@a4zbabz.top` 是占位，请换成真实的。
- 如需 SEO：可再加 `sitemap.xml` 和每页独立的 description（现已有基础 meta）。

---

## 六、演示内容说明

`data.js` 里的 6 个小程序、5 篇笔记**都是示例**，用于展示排版效果，
请替换成你自己的真实内容。
