# vite-plugin-html-security

网站安全插件

## 安装
```bash
npm i vite-plugin-html-security -D
```

## 使用
```typescript
import { defineConfig } from 'vite'
import htmlSecurity from 'vite-plugin-html-security'
export default defineConfig({
  plugins: [
    htmlSecurity({
      // 配置项
    })
  ]
})  
```