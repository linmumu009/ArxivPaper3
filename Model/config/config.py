"""arXiv 检索与导出脚本的统一配置
- 修改此文件即可调整查询、分类、输出等行为
- 部分参数可被命令行覆盖（如 --tz、--page-size、--min-score 等）
"""

import os

# API 基础地址（arXiv 官方 API）
# 使用 http 可规避部分代理的 TLS 问题；若网络环境稳定也可改为 https
API_URL = "http://export.arxiv.org/api/query"
# 检索的学科分类（arXiv 分类代码），在查询中以 OR 组合
# 可根据关注领域增删，例如 "cs.IR"、"cs.CV" 等
SEARCH_CATEGORIES = ["cs.CL", "cs.LG", "cs.AI", "stat.ML"]
# 关键词/短语列表（查询条件），在查询中以 OR 组合
# ti: 标题；abs: 摘要；带引号的短语用于精确匹配
# 可增删以调整范围；示例：'abs:"tool use"'、"abs:DPO"
SEARCH_TERMS = [
    'ti:"language model"', 'abs:"language model"', "ti:LLM", "abs:LLM",
    "ti:transformer", "abs:transformer",
    "abs:RLHF", "abs:RLAIF", "abs:DPO", "abs:GRPO", "abs:ORPO", "abs:KTO", "abs:IPO", "abs:RPO",
    "abs:agent", 'abs:"tool use"', 'abs:"function calling"', "abs:planning",
    "abs:speculative", "abs:decoding",
]
# 主题识别的正则表达式集合，用于文本打标签与计分
# 键为主题组名；值为对应正则；可根据需要扩展或收敛
PATTERN_REGEX = {
    # CORE：核心相关性，判断是否与 LLM/Agent/RL 等相关；不命中会直接过滤
    "CORE": r"(?is)\b(large\s+language\s+model|language\s+model|llm|foundation\s+model|transformer|decoder[-\s]?only|text|token|prompt|instruction|chat|dialog(ue)?|rlhf|rlaif|preference\s+optimization|reward\s+model|agent|tool[-\s]?use|function\s+calling|rag\b)\b",
    # LLM_TRAINING：预训练/后训练/对齐/微调相关术语
    "LLM_TRAINING": r"(?is)\b(pretrain(ing)?|post[-\s]?training|instruction\s+tuning|fine[-\s]?tuning|sft\b|supervised\s+fine[-\s]?tuning|alignment|distill(ation)?|lora\b|qlora\b|peft\b|prompt\s+tuning|prefix\s+tuning|adapters?|reward\s+model(ing)?|preference\s+model(ing)?|rlaif\b|rlhf\b|constitutional\s+ai|self[-\s]?training)\b",
    # RL_PREFOPT：强化学习/偏好优化及其变体（DPO/GRPO/ORPO/KTO/IPO/RPO/RLHF…）
    "RL_PREFOPT": r"(?is)\b(reinforcement\s+learning|policy\s+gradient|actor[-\s]?critic|ppo\b|trpo\b|a2c\b|a3c\b|reinforce\b|rlhf\b|rlaif\b|reward\s+model(ing)?|preference\s+optimization|dpo\b|direct\s+preference\s+optimization|ipo\b|implicit\s+preference\s+optimization|kto\b|kahneman[-\s]?tversky\s+optimization|orpo\b|odds[-\s]?ratio\s+preference\s+optimization|rpo\b|relative\s+policy\s+optimization|grpo\b|group\s+relative\s+policy\s+optimization)\b",
    # AGENT：Agent/工具调用/规划/多智能体/RAG 等
    "AGENT": r"(?is)\b(agentic|agents?\b|autonomous\s+agent|tool[-\s]?use|tool[-\s]?calling|function\s+calling|toolformer|react\b|reason\s+and\s+act|planning|planner|task\s+planning|multi[-\s]?agent|swarm|rag\b|retrieval[-\s]?augmented)\b",
    # ALGO：推理/解码/性能优化/量化/剪枝/注意力等算法与工程
    "ALGO": r"(?is)\b(speculative\s+decoding|contrastive\s+decoding|beam\s+search|top[-\s]?k|top[-\s]?p|temperature|kv\s+cache|paged\s*attention|flash[-\s]?attention|rope\b|positional\s+encoding|quantiz(e|ation)|prun(e|ing)|compression|efficient\s+inference|throughput|latency)\b",
}
# 计分时参与统计的主题组列表；命中≥1的组数即为分数
GROUPS = ["LLM_TRAINING", "RL_PREFOPT", "AGENT", "ALGO"]
# 当多个组均命中时，用此优先顺序决定最终归属的分桶
ORDER_GROUPS = ["RL_PREFOPT", "AGENT", "LLM_TRAINING", "ALGO"]
# 主题组到展示名称的映射；用于 Markdown 输出的标题与统计
BUCKET_NAME_MAP = {
    "RL_PREFOPT": "RL / Preference Optimization (GRPO/DPO/ORPO/KTO/IPO/RPO/RLHF...)",
    "AGENT": "Agents / Tool Use / Planning",
    "LLM_TRAINING": "LLM Training / Post-training / Alignment",
    "ALGO": "LLM Text Algorithms / Efficient Inference / Decoding",
}
# 输出文件中各分桶的显示顺序
BUCKET_ORDER = [
    "RL / Preference Optimization (GRPO/DPO/ORPO/KTO/IPO/RPO/RLHF...)",
    "Agents / Tool Use / Planning",
    "LLM Training / Post-training / Alignment",
    "LLM Text Algorithms / Efficient Inference / Decoding",
]
# 请求的 User-Agent 字符串；必要时可调整便于识别
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
# 默认时区（用于计算“昨日”窗口与展示）；命令行 --tz 可覆盖
DEFAULT_TZ = "Asia/Shanghai"
# 数据根目录（默认 data）
DATA_ROOT = "data"
# 输出文件目录与文件名格式；文件名采用 strftime 格式化为当天日期
OUTPUT_DIR = os.path.join(DATA_ROOT, "arxivList")
FILENAME_FMT = "%Y-%m-%d.md"
PDF_OUTPUT_DIR = os.path.join(DATA_ROOT, "raw_pdf")
PDF_PREVIEW_DIR = os.path.join(DATA_ROOT, "preview_pdf")
# 分页与筛选参数的默认值；命令行参数可覆盖
PAGE_SIZE_DEFAULT = 200
MAX_PAPERS_DEFAULT = 500
SLEEP_DEFAULT = 3.1
MIN_SCORE_DEFAULT = 1
# 是否继承系统环境代理（HTTP(S)_PROXY 等）；默认关闭以避免兼容问题
USE_PROXY_DEFAULT = False
# 请求失败重试次数（指数退避：1s、2s、4s…）
RETRY_COUNT = 5

# 控制进度输出风格：True 为单行动态更新；False 为每页一行
PROGRESS_SINGLE_LINE = True
RETRY_TOTAL = 7
RETRY_BACKOFF = 1.5
REQUESTS_UA = USER_AGENT
PROXIES = None
RESPECT_ENV_PROXIES = False


"""

大模型调用配置

"""

"""
以下为必选项：
"""

"""API KEY 配置项"""

# minerU Token  
minerU_Token = "eyJ0eXBlIjoiSldUIiwiYWxnIjoiSFM1MTIifQ.eyJqdGkiOiI3MTEwMDEwNCIsInJvbCI6IlJPTEVfUkVHSVNURVIiLCJpc3MiOiJPcGVuWExhYiIsImlhdCI6MTc2NzA2Mjk1NiwiY2xpZW50SWQiOiJsa3pkeDU3bnZ5MjJqa3BxOXgydyIsInBob25lIjoiIiwib3BlbklkIjpudWxsLCJ1dWlkIjoiZTg0MzUzYjAtZmE4My00NmJkLWI2ZWUtY2I0MWE2YTVjYzdlIiwiZW1haWwiOiJsaXVsaW5fMDAzQDE2My5jb20iLCJleHAiOjE3NjgyNzI1NTZ9.SUtJ8cEZ3iVZ0hW3pjOtbBDckEhIkJCLnY_as_ydOpklzfYUUaVEukpmYzu8qN6ojTFQlbr9F5KBe8VKzYNuKw"

# Qwen API Key
qwen_api_key = "sk-f6fa897f7f564c5d87237a6707536ac9"





"""模型参数配置项"""

# 机构判别模型参数 json2decide.py
org_base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
org_model = "qwen-plus"
org_max_tokens = 2048
org_temperature = 1.0
pdf_info_concurrency = 8

# 摘要生成模型
# 摘要生成模型参数 pdfSummary.py
summary_base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
summary_model = "qwen2.5-72b-instruct"
summary_max_tokens = 2048
summary_temperature = 1.0
# 摘要输入长度控制（模型上下文窗口硬上限与安全边距）
# 总输入预算 = summary_input_hard_limit - summary_input_safety_margin
# 用户内容裁剪预算 = 总输入预算 - 系统提示词近似长度（按 UTF-8 字节近似 token）
# 最终传入 ≈ 系统提示词 + 裁剪后的用户内容 ≤ 总输入预算
summary_input_hard_limit = 129024
summary_input_safety_margin = 4096
summary_concurrency = 16



"""PROMPT 配置项"""

# 摘要生成系统提示词中的example
summary_example="""
微软：多模态大模型能力解耦分析
📖标题：What MLLMs Learn about When they Learn about Multimodal Reasoning: Perception, Reasoning, or their Integration?
🌐来源：arXiv,[论文编号]
	
🛎️文章简介
🔸研究问题：多模态大型语言模型（MLLM）在进行多模态推理时，如何分辨出来自感知、推理还是两者的整合的问题？
🔸主要贡献：论文提出了MATHLENS benchmark，旨在分离多模态推理中的感知、推理及其整合能力，提供了新方法以分析模型的性能。
	
📝重点思路
🔸引入MATHLENS基准，通过926道几何问题及其8种视觉修改，设计实验以分离感知、推理和整合能力。
🔸采用四种相关注释，分别测试感知（图形）、推理（文本描述）、多模态问题和微调探测器。
🔸通过先训练文本后训练图像的方式，以评估不同训练策略对模型的影响。
🔸进行对比实验，从开放模型中收集数据，评估7-9B参数范围内的多模态推理模型的表现。
	
🔎分析总结
🔸感知能力主要通过强化学习增强，且在已有文本推理能力的前提下效果更佳。
🔸多模态推理训练同时促进感知与推理的提升，但推理能力并未表现出独立的额外增益。
🔸整合能力是三者中提升最少的，表明存在持续的整合错误，成为主要的失败模式。
🔸在视觉输入变化的情况下，强化学习提高了一致性，而多模态监督微调则导致了过拟合，从而降低了一致性。
	
💡个人观点
论文通过基准明确分离多模态推理的关键能力，使得对模型性能的评估更加细致和准确。
"""
# 摘要生成系统提示词
system_prompt = "你是一个论文总结助手。参考示例的风格与结构，对给定的 Markdown 论文进行中文总结。仅输出纯文本，总结包含：机构、标题、来源、文章简介、重点思路、分析总结或个人观点。"
system_prompt = system_prompt + "\n示例：\n" + summary_example

# 机构判断系统提示词
pdf_info_system_prompt = """
仅基于给定论文前两页的 Markdown 文本，输出一个 JSON 对象，字段严格为：instution、is_large、abstract。
instution 优先第一作者机构，其次通讯作者；若能识别通讯作者（例如 *、† 或脚注“Corresponding author”），优先通讯作者机构。
机构名请尽量使用中文；若为全球广为人知的品牌或研究机构（如 Google、Meta、OpenAI、Microsoft Research、MIT、Stanford、CMU 等），则保留英文原文。
is_large 为布尔值，“大机构”判断规则：如果机构包含 OpenAI、DeepMind、Google、Meta、Microsoft Research、MIT、Stanford、CMU 等则视为 true；其余为 false。
abstract 用一句话描述：用什么方法，使得什么，提升或减少了多少。
只返回上述 JSON，不要输出额外文本或代码块。
"""











"""
以下为可选项：
"""


