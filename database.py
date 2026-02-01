from sqlmodel import SQLModel, create_engine, Session

sqlite_filename = "tasker.db"
sqlite_url = f"sqlite:///{sqlite_filename}"

engine = create_engine(url=sqlite_url)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)