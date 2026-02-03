# Tasker (FastAPI Edition) 🚀

> A full-stack task management application re-engineered from a legacy Node.js architecture to a modern, high-performance Python/FastAPI stack.

## 📌 Project Overview
**Tasker** is a robust To-Do list application that allows users to create, manage, and track tasks with persistent data storage.

This project represents a **strategic migration** from a traditional Node.js/Express backend to **FastAPI**. The goal was to leverage Python's modern async capabilities, type safety, and automatic documentation to create a backend infrastructure ready for future AI/Data Science integrations.

## 🛠️ Tech Stack
* **Backend:** Python 3.12, FastAPI
* **Database:** SQLModel (SQLite for dev / PostgreSQL ready), SQLAlchemy
* **Authentication:** Custom Session Middleware, Bcrypt (Passlib)
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Jinja2 Templates
* **DevOps:** Render (Deployment), Git

## ✨ Key Features
* **User Authentication:** Secure registration and login system using hashed passwords.
* **Session Management:** Custom-built session middleware for secure state persistence.
* **CRUD Operations:** Full Create, Read, Update, Delete capabilities for tasks.
* **Unified Database Schema:** Optimized Single-Table design for task management (merging "Active" and "Completed" collections).
* **Responsive UI:** Mobile-friendly interface served directly via FastAPI/Jinja2.

## 🏗️ Architecture Migration (Node.js → Python)
| Feature | Legacy (Node.js) | Modern (This Project) |
| :--- | :--- | :--- |
| **Framework** | Express.js | **FastAPI** (Async, Type-safe) |
| **Database** | MongoDB (NoSQL) | **SQLModel** (Relational/SQL) |
| **Auth** | Passport.js | **Custom Python Middleware** |
| **API Docs** | Manual | **Automatic Swagger UI** |

## 🚀 How to Run Locally
Prerequisites: Python 3.10+ installed.

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/mesh1134/Tasker-FastAPI.git](https://github.com/mesh1134/Tasker-FastAPI.git)
    cd Tasker-FastAPI
    ```

2.  **Create a virtual environment**
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # Mac/Linux:
    source .venv/bin/activate
    ```

3.  **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the server**
    ```bash
    uvicorn main:app --reload
    ```
    Visit `http://127.0.0.1:8000` in your browser.

## 📈 Future Roadmap
* **AI Integration:** Implement an LLM to auto-categorize tasks based on urgency.
* **PostgreSQL:** Migrate production DB to Postgres for scalability.
* **React Frontend:** Decouple the frontend to create a separate SPA (Single Page Application).

---
*Built by Soumesh Satheesan - https://www.linkedin.com/in/soumesh-satheesan-46b287261/*
