from pydantic import BaseModel
from sqlalchemy import table
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    Name: str
    Deadline: datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash : str

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name : str
    deadline: datetime
    owner_id: int = Field(foreign_key="user.id")
    is_completed: bool = False