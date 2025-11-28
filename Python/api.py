from fastapi import FastAPI
from dto import MoveDTO
from model import PokerMove
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3333",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello")
def hello():
    return {"message": "Hello from Poker API!"}

@app.post("/")
def post(nums: int):
    return MoveDTO(
        poker_move = PokerMove.PASS
)