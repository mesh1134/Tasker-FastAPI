import os
from typing import List

from fastapi import (
    FastAPI,
    Depends,
    Request,
    Form,
    status,
    HTTPException
)
from fastapi.responses import (
    HTMLResponse,
    RedirectResponse,
    Response
)
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from passlib.context import CryptContext
from contextlib import asynccontextmanager
from starlette.middleware.sessions import SessionMiddleware


from sqlmodel import Session, select
from database import get_session, create_db_and_tables
from models import User, Task, TaskCreate


@asynccontextmanager
async def life_span(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=life_span)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# SECURITY & SESSION
SECRET_KEY = os.environ.get("SECRET_KEY", "dev_secret_key")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- HELPER ---
def require_login(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id

# --- ROUTES ---

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Check if logged in; if not, redirect to login
    if not request.session.get("user_id"):
        return RedirectResponse(url="/login")
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
async def login(
        request: Request,
        username: str = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_session)
):
    user = db.exec(select(User).where(User.username == username)).first()
    if not user or not pwd_context.verify(password, user.password_hash):
        return RedirectResponse(url="/login?error=invalid", status_code=status.HTTP_303_SEE_OTHER)

    request.session["user_id"] = user.id
    request.session["username"] = user.username
    return RedirectResponse(url="/", status_code=303)

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.post("/register")
async def register(
        username: str = Form(...),
        password: str = Form(...),
        db: Session = Depends(get_session)
):
    hashed_pw = pwd_context.hash(password)
    new_user = User(username=username, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    return RedirectResponse(url="/login", status_code=303)

@app.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=303)

# --- TASK API ---

@app.get("/tasks", response_model=List[Task])
async def get_tasks(request: Request, db: Session = Depends(get_session)):
    user_id = require_login(request)
    # Fetch active tasks
    tasks = db.exec(
        select(Task).where(Task.owner_id == user_id, Task.is_completed == False)
        .order_by(Task.deadline)
    ).all()
    return tasks

@app.get("/tasks/completed", response_model=List[Task])
async def get_completed_tasks(request: Request, db: Session = Depends(get_session)):
    user_id = require_login(request)
    # Fetch completed tasks
    tasks = db.exec(
        select(Task).where(Task.owner_id == user_id, Task.is_completed == True)
        .order_by(Task.deadline)
    ).all()
    return tasks

@app.post("/tasks", response_model=Task)
async def create_task(
        request: Request,
        task_data: TaskCreate,
        db: Session = Depends(get_session)
):
    user_id = require_login(request)
    new_task = Task(
        name=task_data.name,
        deadline=task_data.deadline,
        owner_id=user_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/tasks/{task_id}/complete", response_model=Task)
async def complete_task(
        task_id: int,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = require_login(request)
    task = db.get(Task, task_id)
    if not task or task.owner_id != user_id:
        raise HTTPException(404, "Task not found")

    task.is_completed = True
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.delete("/tasks/{task_id}")
async def delete_task(
        task_id: int,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = require_login(request)
    task = db.get(Task, task_id)
    if not task or task.owner_id != user_id:
        raise HTTPException(404, "Task not found")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(
        task_id: int,
        task_data: TaskCreate,
        request: Request,
        db: Session = Depends(get_session)
):
    user_id = require_login(request)
    task = db.get(Task, task_id)

    if not task or task.owner_id != user_id:
        raise HTTPException(404, "Task not found")

    # Update fields with the new data
    task.name = task_data.name
    task.deadline = task_data.deadline

    db.add(task)
    db.commit()
    db.refresh(task)
    return task