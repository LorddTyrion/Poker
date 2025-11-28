from pydantic import Field
from model import Move, PokerMove, Card, Suit
from holdem import HoldemInfoSet
from deuces import Card as DeucesCard, Evaluator
from evaluator import HandClustering

class MoveDTO:
    poker_move: PokerMove

    def to_move(self):
        return Move(
            poker_move=self.poker_move
        )
    
    def from_move(cls, move: Move):
        return cls(
            poker_move=move.poker_move
        )
    

class HoldemInfoSetDTO:
    history: list[str] = Field(default=["", "", "", ""])
    own_cards: list[Card] = Field(alias="ownCards", default=[])
    flop: list[Card] = Field(default=[])
    turn: Card | None = Field(default=None)
    river: Card | None = Field(default=None)
    round: int = Field(default=0)
    pot: list[int] = Field(default=[0,0])

    def to_holdem_info_set(self):
        info_set = HoldemInfoSet()
        info_set.history=self.history
        info_set.round=self.round
        info_set.pot=self.pot
        hand = [card_to_deuces_card(own_card) for own_card in self.own_cards]
        flop = [card_to_deuces_card(flop_card) for flop_card in self.flop]
        turn = card_to_deuces_card(self.turn)
        river = card_to_deuces_card(self.river)
        info_set.clear_clusters()
        evaluator = Evaluator()
        hand_clustering = HandClustering()
        hand_clustering.load_tables()
        info_set.add_cluster(hand_clustering.get_preflop_cluster(hand))
        board = []
        if self.round >=1:
            board +=flop
            evaluation = evaluator.evaluate(hand, flop)
            info_set.add_cluster(hand_clustering.get_flop_cluster(evaluation))
        if round >=2:
            board.append(turn)
            evaluation = evaluator.evaluate(hand, board)
            info_set.add_cluster(hand_clustering.get_turn_cluster(evaluation))
        if round >=3:
            board.append(river)
            evaluation = evaluator.evaluate(hand, board)
            info_set.add_cluster(hand_clustering.get_river_cluster(evaluation))
        return info_set


def card_to_deuces_card(card: Card) -> int:
    suit_map = {
        Suit.HEART: 'h',
        Suit.SPADE: 's',
        Suit.CLUB: 'c',
        Suit.DIAMOND: 'd'
    }
    
    rank_map = {
        1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
        7: '7', 8: '8', 9: '9', 10: 'T',
        11: 'J', 12: 'Q', 13: 'K'
    }
    
    rank_char = rank_map[card.rank]
    suit_char = suit_map[card.suit]
    card_str = rank_char + suit_char
    return DeucesCard.new(card_str)