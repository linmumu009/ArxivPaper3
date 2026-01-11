import os
import sys
import uvicorn
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import subprocess
import threading
import time
import json

# 添加项目根目录到 path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR) # Model/
sys.path.append(PARENT_DIR)
sys.path.append(CURRENT_DIR)

from app import run_step, STEPS
from MinerU_Verfiy import verify_mineru_token
from LLM_Verfiy import verify_llm_config

app = FastAPI(title="ArxivPaper Controller")

# 定义数据模型
class StepRequest(BaseModel):
    step_name: str
    args: Optional[List[str]] = []

class StartRecognitionRequest(BaseModel):
    arxiv_class: dict
    instruction_prompt: dict
    summary_prompt: dict
    folder_path: Optional[str] = ""
    window_hours: Optional[str] = ""
    model: Optional[str] = ""

class TaskStatus(BaseModel):
    task_id: str
    status: str
    message: str = ""

class MineruVerifyRequest(BaseModel):
    token: str

class MineruVerifyResponse(BaseModel):
    code: int
    message: str

class LlmVerifyRequest(BaseModel):
    apiType: str
    apiUrl: str
    apiKey: str
    model: str
    temperature: float
    maxTokens: int
    relatedNumber: int

class LlmVerifyResponse(BaseModel):
    code: int
    message: str

# 简单的内存任务状态存储
tasks = {}

def run_step_background(task_id: str, step_name: str, args: List[str]):
    try:
        tasks[task_id] = {"status": "running", "message": f"Starting {step_name}..."}
        
        # 使用 app.py 中定义的 run_step 逻辑
        # 注意：这里直接调用 run_step 是同步阻塞的，所以在线程中运行
        # 为了捕获输出，我们可以稍微改造一下调用方式，或者只是简单的运行
        
        # 构造命令
        if step_name not in STEPS:
             tasks[task_id] = {"status": "failed", "message": f"Unknown step: {step_name}"}
             return

        cmd = STEPS[step_name] + args
        
        # 运行命令
        process = subprocess.run(cmd, capture_output=True, text=True)
        
        if process.returncode == 0:
            tasks[task_id] = {"status": "completed", "message": "Success", "output": process.stdout}
        else:
            tasks[task_id] = {"status": "failed", "message": process.stderr, "output": process.stdout}
            
    except Exception as e:
        tasks[task_id] = {"status": "failed", "message": str(e)}

@app.get("/")
def read_root():
    return {"status": "online", "service": "ArxivPaper Controller"}

@app.get("/steps")
def get_steps():
    """获取所有可用的步骤"""
    return {"steps": list(STEPS.keys())}

@app.post("/run/{step_name}")
def run_task(step_name: str, background_tasks: BackgroundTasks, args: Optional[List[str]] = None):
    if step_name not in STEPS:
        raise HTTPException(status_code=404, detail="Step not found")
    
    task_id = f"{step_name}_{int(time.time())}"
    tasks[task_id] = {"status": "pending", "message": "Queued"}
    
    # 在后台线程运行，避免阻塞 API
    background_tasks.add_task(run_step_background, task_id, step_name, args or [])
    
    return {"task_id": task_id, "status": "started"}

def run_recognition_pipeline(task_id: str, request: StartRecognitionRequest):
    try:
        tasks[task_id] = {"status": "running", "message": f"Starting recognition for {request.arxiv_class.get('name')}..."}
        
        # TODO: Implement the actual pipeline logic using the request data
        # For example:
        # 1. Update config files with the prompts
        # 2. Run arxiv_search
        # 3. ...
        
        time.sleep(1) # Mock processing
        
        tasks[task_id] = {"status": "completed", "message": "Recognition pipeline finished (Mock)", "data": request.dict()}
    except Exception as e:
        tasks[task_id] = {"status": "failed", "message": str(e)}

@app.post("/start_recognition")
def start_recognition(request: StartRecognitionRequest, background_tasks: BackgroundTasks):
    print("Received StartRecognitionRequest:")
    print(json.dumps(request.model_dump(), indent=4, ensure_ascii=False))
    
    # task_id = f"recognition_{int(time.time())}"
    # tasks[task_id] = {"status": "pending", "message": "Recognition Queued"}
    
    # background_tasks.add_task(run_recognition_pipeline, task_id, request)
    
    # return {"task_id": task_id, "status": "started"}
    return {"status": "received_and_printed", "data": request.dict()}

@app.post("/mineru_verify")
def mineru_verify(request: MineruVerifyRequest) -> MineruVerifyResponse:
    result = verify_mineru_token(request.token)
    return MineruVerifyResponse(**result)

@app.post("/llm_verify")
def llm_verify(request: LlmVerifyRequest) -> LlmVerifyResponse:
    result = verify_llm_config(request.model_dump())
    return LlmVerifyResponse(**result)

@app.get("/task/{task_id}")
def get_task_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

if __name__ == "__main__":
    # 允许在开发模式下直接运行此脚本启动服务
    uvicorn.run(app, host="127.0.0.1", port=23333)
