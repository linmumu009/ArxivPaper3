# ArxivPaper

> README 结构：
>
> 1. 配置准备 2) 运行指令 3) 项目结构 4) 代码流程（按执行顺序）

---

## 1. 配置准备

只需要改：`config/config.py`。

### 1.1 必填

* MinerU Token（`minerU_Token`）：PDF → Markdown 解析；在 `https://mineru.net/apiManage/token` 创建
* DashScope Key（`qwen_api_key`）：机构识别 + 摘要生成；在 `https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.519511fceUTPZn&tab=model#/api-key` 创建

### 1.2 arXiv 检索与主题正则

> **正则匹配对象**：每条 arXiv 结果的 **标题 + 摘要**（`entry.title + entry.summary`）。

* 分类（`SEARCH_CATEGORIES`）：以 `OR` 组合进 query（如 `cat:cs.CL OR cat:stat.ML`）
* 关键词（`SEARCH_TERMS`）：以 `OR` 组合进 query（如 `ti:LLM OR abs:RLHF`）
* 主题正则（`PATTERN_REGEX`）：

  * `CORE`：主赛道相关性（例如 LLM / 训练 / RL / agent 等）的最低门槛
  * 其他主题组（如 `RL_PREFOPT/AGENT/...`）：用于计分与分桶

### 1.3 计分与分桶规则

* 计分组（`GROUPS`）：参与计分的主题组列表
* 命中次数（`hits[g]`）：主题组 `g` 的正则在 **标题+摘要** 上的匹配次数
* 分数（`score`）：在 `GROUPS` 中，`hits[g] >= 1` 的组数
* 最低分（`MIN_SCORE_DEFAULT` / `--min-score`）：论文需满足 `score >= min_score` 才保留
* 分桶优先级（`ORDER_GROUPS`）：

  * 归属桶：`hits[g]` 最大的组
  * 平局：按 `ORDER_GROUPS` 靠前者
* 输出展示（`BUCKET_NAME_MAP / BUCKET_ORDER`）：桶名映射与展示顺序

### 1.4 时间窗口与抓取规模

* 默认时区（`DEFAULT_TZ`）：窗口计算用的 IANA 时区名（可用 `--tz` 覆盖）
* 每页条数（`PAGE_SIZE_DEFAULT` / `--page-size`）
* 最多保留（`MAX_PAPERS_DEFAULT` / `--max-papers`）
* 翻页间隔（`SLEEP_DEFAULT` / `--sleep`）
* 代理（`USE_PROXY_DEFAULT` / `--use-proxy`）：是否允许从环境变量读取代理

### 1.5 模型与提示词（每项含义）

| 配置项                           | 作用脚本               | 含义                                 |
| ----------------------------- | ------------------ | ---------------------------------- |
| `org_base_url`                | `pdf_info.py`      | 机构识别模型的 OpenAI 兼容 base_url         |
| `org_model`                   | `pdf_info.py`      | 机构识别模型名称                           |
| `org_max_tokens`              | `pdf_info.py`      | 机构识别输出 token 上限                    |
| `org_temperature`             | `pdf_info.py`      | 机构识别采样温度                           |
| `pdf_info_system_prompt`      | `pdf_info.py`      | 机构识别 + 是否大机构 + 生成短摘要的规则（要求输出 JSON） |
| `summary_base_url`            | `paper_summary.py` | 摘要模型的 OpenAI 兼容 base_url           |
| `summary_model`               | `paper_summary.py` | 摘要模型名称                             |
| `summary_max_tokens`          | `paper_summary.py` | 摘要输出 token 上限                      |
| `summary_temperature`         | `paper_summary.py` | 摘要采样温度                             |
| `summary_input_hard_limit`    | `paper_summary.py` | 输入硬上限（用于裁剪预算）                      |
| `summary_input_safety_margin` | `paper_summary.py` | 安全边距（预留给提示词/结构）                    |
| `summary_concurrency`         | `paper_summary.py` | 摘要并发数（线程数）                         |
| `summary_example`             | `config.py`        | 摘要提示词中的示例文本                        |
| `system_prompt`               | `paper_summary.py` | 摘要系统提示词（含示例，决定结构/风格）               |

---

## 2. 运行指令

### 2.1 直接运行（不带参数）

```bash
python app.py default
```

### 2.2 带参数运行（示例 2 个）

```bash
# 示例1：改时区 + 提高最低分
python app.py default --tz Asia/Shanghai --min-score 2

```

> pipeline 名称（如 `default/daily`）之后的参数，**只会传给第一步** `Controller/arxiv_search.py`。

### 可调参数（命令行）

| 参数             |                  默认值 | 说明                               |
| -------------- | -------------------: | -------------------------------- |
| `--tz`         |         `DEFAULT_TZ` | 窗口计算时区（IANA 名，如 `Asia/Shanghai`） |
| `--page-size`  |  `PAGE_SIZE_DEFAULT` | 每页拉取数量（1~2000）                   |
| `--max-papers` | `MAX_PAPERS_DEFAULT` | 最多保留论文数量（过滤后）                    |
| `--sleep`      |      `SLEEP_DEFAULT` | 翻页间隔（秒）                          |
| `--min-score`  |  `MIN_SCORE_DEFAULT` | 最低分阈值（见 1.3）                     |
| `--use-proxy`  |  `USE_PROXY_DEFAULT` | 允许从环境变量读取代理                      |
| `--out`        |                 （预留） | 脚本参数存在，但当前版本未实际生效                |

---

## 3. 项目结构

```markdown
. 📂 ArxivPaper                         # 项目根目录
├── 📄 README.md                        # 当前说明文档（主 README）
├── 📄 app.py                           # 主流程：按 pipeline 调用 Controller 下各步骤
├── 📄 pdf_download.log                 # pdf_download.py 的运行日志
├── 📄 readmePrinceple.md               # 撰写 README 的约定与原则记录
├── 📂 Controller/                      # 核心步骤脚本目录
│  ├── 📂 __pycache__/                  # Controller 下的 Python 字节码缓存
│  ├── 📄 arxiv_search.py               # Step1：arXiv 拉取与主题筛选
│  ├── 📄 http_session.py               # 统一的 requests Session 构建与重试逻辑
│  ├── 📄 instutions_filter.py          # Step6：基于机构信息筛选出“大机构论文”
│  ├── 📄 paperList_remove_duplications.py  # Step1.1：去重并记录历史处理论文
│  ├── 📄 paper_summary.py              # Step9：根据 MinerU 全文生成中文摘要
│  ├── 📄 pdf_download.py               # Step2：根据清单下载原始 PDF（按日期分子目录）
│  ├── 📄 pdf_info.py                   # Step5：调用大模型解析机构信息与摘要要点
│  ├── 📄 pdf_split.py                  # Step3：截取前若干页生成预览 PDF（按日期分子目录）
│  ├── 📄 pdfsplite_to_minerU.py        # Step4：预览 PDF → MinerU 解析为 Markdown
│  ├── 📄 selectedpaper_to_mineru.py    # Step8：精选 PDF → MinerU 全文解析
│  ├── 📄 selectpaper.py                # Step7：按“大机构清单”迁移精选 PDF
│  ├── 📄 zotero_push.py                # Step10：导入精选论文到 Zotero
├── 📂 config/                          # 集中配置目录
│  ├── 📂 __pycache__/                  # config 下的字节码缓存
│  ├── 📄 config copy.py                # 早期配置备份（保留历史用）
│  ├── 📄 paperList.json                # 全局“已处理论文列表”（去重用）
├── 📂 data/                            # 运行数据目录（按日期分子目录）
│  ├── 📂 arxivList/                    # 每日候选清单 md
│  ├── 📂 paperList_remove_duplications/ # 去重后的候选清单 md
│  ├── 📂 raw_pdf/                      # 原始 PDF
│  ├── 📂 preview_pdf/                  # 预览 PDF
│  ├── 📂 preview_pdf_to_mineru/        # 预览 MinerU md
│  ├── 📂 pdf_info/                     # 机构识别 JSON
│  ├── 📂 instutions_filter/            # 大机构清单
│  ├── 📂 selectedpaper/                # 精选 PDF
│  ├── 📂 selectedpaper_to_mineru/      # 精选 MinerU md
│  └── 📂 paper_summary/                # 摘要输出
├── 📂 logs/                            # 运行日志目录（按日期分子目录）
└── 📂 reference/                       # 参考项目与示例代码（旧仓库拷贝）
```

---

## 4. 代码流程（按执行文件顺序）

### 0) 总编排（`app.py`）

**输入**：pipeline 名称与额外参数（`app.py`）

**输出**：依次执行各步骤脚本（`Controller/*.py`，见下文步骤 1~10）

**逻辑流程**

* 读取 pipeline（默认 `default`）
* 按 pipeline 顺序 `subprocess.run()` 执行步骤
* pipeline 之后的参数仅转发给 Step1（`arxiv_search.py`）

---

### 1) arXiv 拉取与主题筛选（`Controller/arxiv_search.py`）

**输入**

* arXiv 检索条件（`SEARCH_CATEGORIES, SEARCH_TERMS`）
* 主题正则与计分（`PATTERN_REGEX, GROUPS, ORDER_GROUPS, MIN_SCORE_DEFAULT`）
* 时间窗口与规模（`DEFAULT_TZ, PAGE_SIZE_DEFAULT, MAX_PAPERS_DEFAULT, SLEEP_DEFAULT` + CLI 覆盖）

**输出**

* 当天候选清单（`data/arxivList/<date>.md`）

**逻辑流程**

* 时区解析

  * `tz = ZoneInfo(--tz 或 DEFAULT_TZ)`；无效则回退系统本地时区
* 时间窗口（以 tz 计算）

  * `now = datetime.now(tz)`
  * `yesterday = (now - 1 day).date()`
  * `window = [yesterday 00:00:00, +1 day)`
  * arXiv `published` 先按 UTC 解析，再转为 tz 做比较
* 查询与翻页

  * query = `(cat:... OR ...) AND (SEARCH_TERMS OR ...)`
  * `submittedDate desc` 分页拉取；一旦发现 `published < window_start` 停止翻页
* 过滤与计分（匹配对象：**标题+摘要**）

  * 核心门槛（`PATTERN_REGEX['CORE']`）：判断“是否属于主赛道”；未命中则不进入后续计分
  * 计分（`GROUPS`）：对每组统计 `hits[g]`；`score = count(hits[g] >= 1)`；仅保留 `score >= min_score`
  * 分桶（`ORDER_GROUPS`）：归属到 `hits[g]` 最大的组；平局按 `ORDER_GROUPS` 靠前者
* 输出 Markdown：写窗口信息与统计，并按 `BUCKET_ORDER` 分章节列出论文

---

### 1.1) 去重并记录处理过的论文（`Controller/paperList_remove_duplications.py`）

**输入**

* 当天候选清单（`data/arxivList/<date>.md`，默认选最新一份）
* 历史处理记录（`config/paperList.json`，首次运行可为空）

**输出**

* 更新后的处理记录（`config/paperList.json`，JSON 数组）

  * 每条记录字段：
    * `title`：论文标题
    * `source`：论文编号（如 `2601.02454`）
    * `writing_datetime`：写入记录的时间（UTC ISO 格式）

**逻辑流程**

* 从 `config/paperList.json` 读取已有记录，构造去重键集合（`(title, source)`）
* 解析当天候选清单 md 中的论文条目：
  * 抓取标题（编号行里的粗体部分）
  * 抓取 arXiv 编号（`- arXiv: [2601.xxxxx]` 中的方括号内容）
* 对每条 `title + source`：
  * 若在历史记录中已存在，则视为“以前处理过”，仅跳过本次写入
  * 若不存在，则认为是首次处理：
    * 追加一条 `{title, source, writing_datetime}` 到 `paperList.json`

* 根据“未重复论文列表”重写一份去重后的 md：
  * 保留原有的标题、时间窗口说明与分组小节（`##` 开头行）
  * 对每个论文条目（编号行 + Published + arXiv 行），仅当其 `(title, source)` 未出现在历史记录中时才保留
  * 将结果写入 `data/paperList_remove_duplications/<date>.md`，其中 `<date>` 与原始清单文件名一致

> 后续若希望下载步骤只基于“未处理论文”的 md，可以通过 `--md data/paperList_remove_duplications/<date>.md` 方式显式传给 `Controller/pdf_download.py`。

> 注意：当前版本只负责维护全局“处理过的论文列表”，不会修改原始的 `data/arxivList/*.md` 内容。后续如果需要在下载前直接改写 md（删除重复论文条目），可以在此基础上再扩展。

---

### 2) 下载原始 PDF（`Controller/pdf_download.py`）

**输入**

* 候选清单（`data/arxivList/<date>.md`）

**输出**

* 原始 PDF（`data/raw_pdf/<date>/<arxiv_id>.pdf`）

**逻辑流程**

* 从清单解析 arXiv id
* 若本地已存在且文件头为 `%PDF-`：认为有效并跳过
* 否则下载（含重试），写入临时 `.part`，通过基础校验后原子替换为 `.pdf`

---

### 3) 切预览页（`Controller/pdf_split.py`）

**输入**

* 原始 PDF（`data/raw_pdf/<date>/<arxiv_id>.pdf`）

**输出**

* 预览 PDF（前 2 页，`data/preview_pdf/<date>/<arxiv_id>.pdf`）

**逻辑流程**

* 对每篇 PDF 截取前 2 页并写入预览目录；已存在则跳过

---

### 4) 预览 PDF → MinerU 解析（`Controller/pdfsplite_to_minerU.py`）

**输入**

* 预览 PDF（`data/preview_pdf/<date>/*.pdf`）
* MinerU 凭证（`minerU_Token`）

**输出**

* 预览页 Markdown（`data/preview_pdf_to_mineru/<date>/<arxiv_id>.md`）

**逻辑流程**

* MinerU 批处理：申请上传 URL → PUT 上传 → 轮询结果 → 下载 zip → 提取 md
* 若 `out/<id>.md` 已存在则跳过该篇

---

### 5) 机构识别与结构化信息（`Controller/pdf_info.py`）

**输入**

* 预览页文本（MinerU md，`data/preview_pdf_to_mineru/<date>/*.md`）
* 清单元信息（标题/发布时间，`data/arxivList/<date>.md`）
* 机构识别模型与提示词（`org_*`, `pdf_info_system_prompt`）

**输出**

* 结构化结果（`data/pdf_info/<date>.json`，字段含 `instution/is_large/abstract`）

**逻辑流程**

* 对每篇预览 md 并发调用模型（默认并发=8，可在 `config/config.py` 配置）
* 合并 title/published/arxiv_id 等元信息，追加写入；已存在则按 arxiv_id 去重跳过

---

### 6) 生成“大机构 PDF 清单”（`Controller/instutions_filter.py`）

**输入**

* 结构化结果（`data/pdf_info/<date>.json`）

**输出**

* 仅包含“大机构论文”的 PDF 清单（`data/instutions_filter/<date>/<date>.json`）

**逻辑流程**

* 过滤 `is_large == true` 的条目并写出（供后续迁移 PDF）

---

### 7) 迁移精选 PDF（`Controller/selectpaper.py`）

**输入**

* 大机构 PDF 清单（`data/instutions_filter/<date>/<date>.json`）
* 原始 PDF（`data/raw_pdf/<arxiv_id>.pdf`）

**输出**

* 精选 PDF（`data/selectedpaper/<date>/<arxiv_id>.pdf`）

**逻辑流程**

* 从清单解析 arxiv_id，使用 `shutil.move` 将 PDF 移到精选目录（源文件会消失）

---

### 8) 精选 PDF → MinerU 全文解析（`Controller/selectedpaper_to_mineru.py`）

**输入**

* 精选 PDF（`data/selectedpaper/<date>/*.pdf`）
* MinerU 凭证（`minerU_Token`）

**输出**

* 全文 Markdown（`data/selectedpaper_to_mineru/<date>/<arxiv_id>.md`）

**逻辑流程**

* MinerU 批处理解析全文；若 `out/<id>.md` 已存在则跳过

---

### 9) 生成中文摘要（`Controller/paper_summary.py`）

**输入**

* 全文文本（MinerU md，`data/selectedpaper_to_mineru/<date>/*.md`）
* 摘要模型与提示词（`summary_*`, `system_prompt`）

**输出**

* 单篇摘要（`data/paper_summary/single/<date>/<arxiv_id>.md`）
* 当日汇总（`data/paper_summary/gather/<date>/<date>.txt`）

**逻辑流程**

* 按输入预算裁剪全文 md 后并发调用摘要模型
* 单篇落盘后拼接生成当日汇总

---

### 10) 导入精选论文到 Zotero（`Controller/zotero_push.py`）

**输入**

* 精选 PDF（`data/selectedpaper/<date>/*.pdf`）
* 中文摘要（`data/paper_summary/single/<date>/*.md`）

**输出**

* Zotero 中创建的条目及附件（本地无额外文件输出）

**逻辑流程**

* 根据日期定位精选 PDF 与摘要目录
* 为每篇论文构造 Zotero item（标题、摘要、arXiv 链接等元信息）
* 通过 Zotero Connector 的 `/connector/saveItems` 创建条目
* 再调用 `/connector/saveAttachment` 上传对应的 PDF/MD/summary 附件
* 终端以单行进度方式展示导入状态，并在最后输出汇总统计
