from pydantic import BaseModel
from enum import Enum

class PokerMove(str, Enum):
    PASS = "pass"
    BET = "bet"
    FOLD = "fold"

class Suit(str, Enum):
    HEART = "heart"
    SPADE = "spade"
    CLUB = "club"
    DIAMOND = "diamond"

class Card(BaseModel):
    suit: Suit
    rank: int


class Move(BaseModel):
    poker_move: PokerMove