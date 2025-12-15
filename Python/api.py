from fastapi import FastAPI
from dto import MoveDTO, HoldemInfoSetDTO
from model import PokerMove
from poker_service import PokerService
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


@app.post("/")
def post(state: HoldemInfoSetDTO) -> MoveDTO:
    service = PokerService()
    return service.get_move(state)