from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, space, order, contract, favorite, notification  # noqa: F401
from app.routers import auth, orders, spaces

app = FastAPI(title="广澜租赁平台 API", version="1.0")

app.include_router(auth.router)
app.include_router(spaces.router)
app.include_router(orders.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health():
    return {"status": "ok"}
