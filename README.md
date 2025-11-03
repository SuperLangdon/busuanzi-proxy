# busuanzi-proxy

一个基于 Cloudflare Workers 的不蒜子（Busuanzi）统计 API 代理服务，将原生 JSONP 接口转换为标准 JSON/JSONP 格式，支持 CORS 跨域访问。

A Cloudflare Workers proxy for Busuanzi (不蒜子) statistics API, converting native JSONP to standard JSON/JSONP format with CORS support.

## ✨ 特性

- 🚀 部署到 Cloudflare Workers，全球边缘加速
- 📊 支持 JSON 和 JSONP 两种响应格式
- 🌐 内置 CORS 支持，方便跨域调用
- 🔄 灵活的 Referer 指定方式（查询参数或请求头）
- ⚡ 轻量级，无需服务器维护

## 📦 快速开始

### 1. 部署到 Cloudflare Workers

#### 方式一：通过 Wrangler CLI
```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建项目
wrangler init busuanzi-proxy

# 复制代码到 src/index.js
cp busuanzi-proxy.js src/index.js

# 部署
wrangler deploy
```

#### 方式二：通过 Cloudflare Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Workers & Pages`
3. 点击 `Create Application` → `Create Worker`
4. 复制 `busuanzi-proxy.js` 中的代码
5. 点击 `Deploy`

### 2. 使用 API

部署成功后，你会得到一个类似 `https://busuanzi-proxy.your-subdomain.workers.dev` 的地址。

## 📖 用法

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `site` | string | 否* | 指定网站 URL（优先级高于 Referer 头） |
| `format` | string | 否 | 响应格式：`json`（默认）或 `jsonp` |
| `callback` | string | 否 | JSONP 回调函数名（指定后自动使用 JSONP 格式） |

\* `site` 参数和 `Referer` 请求头至少需要提供一个

### 响应数据

```json
{
  "site_uv": 27674,
  "page_pv": 26955,
  "version": 2.4,
  "site_pv": 28766
}
```

## 🔥 示例

### 示例 1：基础 JSON 调用（使用 Referer 头）

```html
<span id="busuanzi_container_site_uv">
  本站访客数：<span id="busuanzi_value_site_uv"></span> 人
</span>
<span id="busuanzi_container_site_pv">
  本站总访问量：<span id="busuanzi_value_site_pv"></span> 次
</span>
<span id="busuanzi_container_page_pv">
  本文总阅读量：<span id="busuanzi_value_page_pv"></span> 次
</span>

<script>
fetch('https://busuanzi-proxy.your-subdomain.workers.dev/')
  .then(res => res.json())
  .then(data => {
    document.getElementById('busuanzi_value_site_uv').innerText = data.site_uv;
    document.getElementById('busuanzi_value_site_pv').innerText = data.site_pv;
    document.getElementById('busuanzi_value_page_pv').innerText = data.page_pv;
  })
  .catch(err => console.error('获取统计数据失败:', err));
</script>
```

### 示例 2：指定网站 URL（不依赖 Referer）

```javascript
fetch('https://busuanzi-proxy.your-subdomain.workers.dev/?site=https://example.com')
  .then(res => res.json())
  .then(data => console.log(data));
```

### 示例 3：JSONP 格式

```html
<script>
function handleStats(data) {
  console.log('站点统计:', data);
  document.getElementById('busuanzi_value_site_pv').innerText = data.site_pv;
}
</script>

<script src="https://busuanzi-proxy.your-subdomain.workers.dev/?callback=handleStats"></script>
```

### 示例 4：在 Vue/React 中使用

```javascript
// Vue 3 Composition API
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const stats = ref({});
  
    onMounted(async () => {
      try {
        const response = await fetch('https://busuanzi-proxy.your-subdomain.workers.dev/');
        stats.value = await response.json();
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    });
  
    return { stats };
  }
};
```

```javascript
// React Hooks
import { useState, useEffect } from 'react';

function BusuanziStats() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch('https://busuanzi-proxy.your-subdomain.workers.dev/')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <p>访客数: {stats.site_uv}</p>
      <p>访问量: {stats.site_pv}</p>
    </div>
  );
}
```

## 🛠️ 原理

1. **接收请求**：接受来自前端的 HTTP 请求
2. **提取 Referer**：优先使用 `site` 查询参数，其次使用 `Referer` 请求头
3. **转发请求**：向不蒜子官方 API 发起请求，携带正确的 Referer
4. **解析响应**：从 JSONP 格式中提取 JSON 数据
5. **返回数据**：根据 `format` 参数返回 JSON 或 JSONP 格式

## ⚙️ 拓展配置

### 自定义缓存时间

在代码中修改 `Cache-Control` 头：

```javascript
"Cache-Control": "public, max-age=60",  // 默认 60 秒
```

### 自定义 CORS 策略

```javascript
"Access-Control-Allow-Origin": "*",  // 允许所有域名，可改为指定域名
```

## 🤔 Q&A

### Q: 为什么需要这个代理？

A: 不蒜子官方 API 使用 JSONP 格式，不支持 CORS，在现代前端框架中使用不便。此代理提供标准 JSON API，支持 CORS。

### Q: 数据准确吗？

A: 完全准确。代理直接转发请求到不蒜子官方 API，不修改任何统计数据。

### Q: 有请求限制吗？

A: Cloudflare Workers 免费版每天有 100,000 次请求额度，对于个人网站足够使用。

### Q: 可以自托管吗？

A: 可以！代码可以部署到任何支持 JavaScript 的边缘计算平台或 Node.js 服务器。

### Q: 为什么有时显示不出来？

A: 请检查：
1. 是否正确传递了 `site` 参数或 `Referer` 头
2. 网络是否正常
3. 浏览器控制台是否有错误信息

## 📄 许可证

MIT License

## 🙌 致谢

- [不蒜子](https://busuanzi.ibruce.info/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Claude by Anthropic](https://claude.ai/)

