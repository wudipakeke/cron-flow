# CronFlow

定时任务调度服务。

## 版本规则

遵循语义化版本 [SemVer](https://semver.org/)：

| 版本类型 | 示例 | 说明 | 命令 |
|---------|------|------|------|
| **patch** | `0.0.1` → `0.0.2` | 小改动、修 bug | `pnpm release:patch` |
| **minor** | `0.1.0` → `0.2.0` | 新增功能、小特性 | `pnpm release:minor` |
| **major** | `1.0.0` → `2.0.0` | 破坏性变更、大版本 | `pnpm release:major` |

## 发布流程

```bash
# ESLint 检查 → 打版 → 自动提交 → 提示推送
pnpm release:patch    # 小版本 (0.0.x)
pnpm release:minor    # 中版本 (0.x.0)
pnpm release:major    # 大版本 (x.0.0)
```

如果 ESLint 检查不通过，流程会在第一步中断，不会打版和提交。

### 触发部署

```bash
# 推送 main 分支 → 自动触发 CD 构建部署
git push origin main
```

GitHub Actions 会检测 `package.json` 版本变化，自动构建 Docker 镜像并部署到 k3s 集群。
