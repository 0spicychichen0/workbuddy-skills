---
name: fund-diagnosis
description: 面向公募基金的单基金综合诊断能力。适用于用户提出“这只基金怎么样”“适不适合继续持有”“风险和收益特征如何”等泛化问题时，返回结构化 Markdown 诊断报告及 Markdown 数据底稿。每次仅分析一只基金，不处理多基金对比与量化建模。触发核心条件：用户问法为概括性诊断，未要求具体指标公式计算或回测建模。
version: 1.2.0
category: investment-finance
author: 东方财富
license: proprietary
agent_created: true

---

# 基金综合诊断

通过**自然语言问句**对单只基金进行综合分析，返回 Markdown 诊断报告及数据底稿，适用场景包括：
- **基金整体判断（收益表现 + 风险特征 + 持仓结构）**
- **持有决策参考（继续持有/观望/调整仓位）**
- **波动市场中的基金风险排查**
- **用户泛化问法的一站式诊断回答**


## 功能范围

### 基础诊断能力
- 输入自然语言问句，调用诊基接口生成结构化结论
- 每次仅处理**一只**基金
- 返回可读 Markdown 报告（优先提取 `data.displayData`）
- 提取 `data.dataMarkdown`（兼容旧拼写 `dataMarkDown`）并保存为独立数据底稿
- 支持将结果保存为本地 `.md` 文件，便于复盘追踪

报告文件名为 `fund_diagnosis_{uuid8}.md`，数据底稿文件名为 `fund_data_{uuid8}.md`；两者使用相同后缀。

### 触发规则（何时使用本技能）
- 用户问题是**笼统/概括性**诊断：如“这只基金怎么样”“值得继续持有吗”“风险大吗”
- 问句中未明确要求具体指标计算、回测建模或程序化导出
- 若上下文已明确基金实体，用户后续使用“它/这只基金”等代词继续提问，也应触发

### 不触发规则（何时不要使用本技能）
- 用户要求 Python 回测、组合优化、量化建模等高级计算任务
- 用户明确要求导出净值明细、构建CSV或做数据工程处理
- 用户要求多只基金横向对比（应走多标的分析类能力）

### 触发示例

| 触发（泛化诊断） | 不触发（建模/工程） |
|---|---|
| 华夏成长混合基金怎么样？ | 帮我用Python回测华夏成长混合基金策略 |
| 这只基金适合长期持有吗？ | 帮我建一个基金组合优化模型 |
| 它近期风险大吗？ | 把这只基金净值数据导出为CSV |



## 前提条件

### 授权（已内联，无需单独跑）

本 Skill 依赖 `EM_API_KEY`。优先复用已缓存凭据：先从平台私有的跨会话持久存储读取 `EM_API_KEY`，可用时仅将其注入当前业务脚本进程并直接执行，不要重复调用 `mx_get_user_api_key`。若平台私有存储不可读、未提供或没有凭据，再安全检查本机私有缓存 `~/.mx-skills/em_api_key`（只能检查是否存在、长度是否大于 0，不能 `cat` 或打印真实值）；若存在有效凭据，直接运行本 Skill 的业务脚本，脚本会自动读取该文件。

仅当平台私有存储与本机缓存都缺失或已确认失效时，才调用东方财富妙想 MCP 的 `mx_get_user_api_key` 工具获取当前 OAuth2 登录用户的东方财富 API Key。若成功取得 `apiKey`，优先保存为平台私有的跨会话 `EM_API_KEY`；同时必须把完整值写入 `~/.mx-skills/em_api_key`，作为本 Skill 业务脚本可直接读取的本机私有缓存（权限尽量设为仅当前用户可读写）。随后仅注入当前业务脚本进程并直接执行本 Skill 的业务脚本，不要再触发 skill 层面的二次授权、扫码授权或 `auth.py ensure`。

仅当 `mx_get_user_api_key` 不可用、调用失败、未返回有效 `apiKey`，或当前运行环境没有可用的东方财富妙想 MCP 时，才回退到 skill 内置授权流程。内置授权检查已内联到业务脚本，**直接执行业务脚本，不要先单独运行 `auth.py ensure`**，也不要把内置授权做成默认独立前置步骤；不要因为环境里没有 `EM_API_KEY` 就跳过本 Skill。回退时脚本按 `EM_API_KEY` 环境变量、`~/.mx-skills/em_api_key` 文件的顺序读取凭据，不再使用内置兜底 key。

处理 `apiKey` 时不要把真实值输出到 stdout/stderr、日志、命令回显或对话正文中；不要使用 `echo`、`cat`、`env | grep`、或把真实 key 直接拼进 shell 命令行的方式检查或传递凭据。需要确认凭据存在时，只检查文件是否存在、长度是否大于 0、或输出脱敏后的前后缀。执行查询或生成任务时优先使用平台私有存储注入当前业务脚本进程；没有平台凭据时，再让脚本从 `~/.mx-skills/em_api_key` 读取。确需进程级注入时，使用工具/运行时的环境变量能力，不要把真实 key 写进 shell 命令字符串。

| 退出码 | 含义 | agent 动作 |
|---|---|---|
| `0` | 成功 | 读取 `Saved:`（若有）及随后输出的 Markdown 正文 |
| `10` | 需用户授权 | 按下方 `need_auth` 流程处理 |
| `2` | 授权网络错误、接口错误或业务错误 | 检查网络后最多重试 1 次，持续失败则向用户说明 |
| `1` | 参数错误 | 不重试，向用户说明缺少或无效参数 |

退出码 `10` 时 stdout 会打印：

```text
need_auth: true
authUrl: <以实际返回为准>
apiKeyUrl: <以实际返回为准>
```


授权、凭据持久化及 401 失效处理必须遵循 [授权协议](references/auth_protocol.md)。安装依赖时运行 `pip3 install -r requirements.txt`。


## 快速开始

### 1. 命令行调用

```bash
python3 scripts/get_data.py --query "华夏成长混合基金"
```

**输出示例**
```text
Saved: /path/to/workspace/fund_diagnosis/fund_diagnosis_90bf169c.md
Data saved: /path/to/workspace/fund_diagnosis/fund_data_90bf169c.md
（随后输出 Markdown 诊断内容）
```

**参数说明：**

| 参数 | 说明 | 必填 |
|---|---|---|
| `--query` | 用户原始自然语言问句 | ✅（`--query` 或 stdin 二选一） |
| `--no-save` | 仅输出结果，不写入本地文件 | 否 |

### 2. 代码调用

```python
import asyncio
from pathlib import Path
from scripts.get_data import diagnose_fund

async def main():
    result = await diagnose_fund(
        question="华夏成长混合基金",
        output_dir=Path("workspace/fund_diagnosis"),
        save_to_file=True,
    )
    if "error" in result:
        print(result["error"])
    else:
        print(result["content"])
        if result.get("output_path"):
            print("已保存至:", result["output_path"])
        if result.get("data_md_path"):
            print("数据底稿已保存至:", result["data_md_path"])

asyncio.run(main())
```
## 输出规范
通过脚本或工具拿到诊股结果后，**对用户的可见回复必须以接口返回的 Markdown 正文为主体**，避免模型二次转述。仅当接口/脚本明确返回 `error`、或正文为空时，才用简短文字说明失败原因；**禁止**在失败时杜撰报告内容。

若 `output_path` 存在，交付诊断报告；若 `data_md_path` 存在，同时交付 Markdown 数据底稿。数据底稿缺失不影响正常报告输出，不得编造缺失内容。

## 常见问题


**为什么需要保持原始问句？**  
→ 诊基接口依赖用户自然语言语义，建议避免改写导致意图偏移。

**如何只看输出，不落盘？**
```bash
python3 -m scripts.get_data --query "华夏成长混合基金" --no-save
```

## 合规说明

- 诊断结果仅供参考，不构成投资建议，输出时应附风险提示。
- 禁止在代码或提示词中硬编码账号 ID、会话 ID 或 token。
- 环境变量按敏感信息处理，不在日志或回复中泄露。
- 接口失败时不得编造结论，应返回明确错误或不确定性说明。
