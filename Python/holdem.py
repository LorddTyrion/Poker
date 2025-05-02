import base
import deuces
from typing import List

class HoldemInfoSet(base.InfoSet):
    def __init__(self):
        self.history=["", "", "", ""]
        self.clusters=[-1, -1, -1, -1]
        self.round = 0
        self.pot = 0
    def set_history(self, value):
        self.history[self.round] = value
    def get_history(self):
        return self.history[self.round]
    def get_cluster(self):
        return self.cluster[self.round]
    def set_cluster(self, value):
        self.clusters[self.round] = value
    def get_round(self):
        return self.round
    def increment_round(self):
        self.round +=1
    def get_pot(self):
        return self.pot
    def add_to_pot(self, value):
        self.pot += value
    def key(self):
        return (tuple(self.history), tuple(self.clusters), self.round, self.pot)
    @classmethod
    def from_key(cls, key):
        obj = cls()
        obj.history = list(key[0])
        obj.clusters = list(key[1])
        obj.round = key[2]
        obj.pot = key[3]
        return obj
    
    
class HoldemNode(base.Node):
    def __init__(self, info_set, num_actions):
        super().__init__(info_set, num_actions)
    def is_terminal(self, history: HoldemInfoSet):
        round_history=history.get_history()
        round = history.get_round()
        return round_history.endswith("f") or (round == 3 and self.round_ended(round_history))          

    def is_chance_node(self, history: HoldemInfoSet):
        round_history=history.get_history()
        round = history.get_round()
        if round != 3 and self.round_ended(round_history):
            history.increment_round()
            return True
        else:
            return False


    def get_terminal_utility(self, history: HoldemInfoSet, cards: List[List[deuces.Card]], board: List[deuces.Card], fixed_player):
        if history.get_history().endswith("f"):
            return history.get_pot() if len(history.get_history()) % 2 == fixed_player else -history.get_pot()
        evaluator = deuces.Evaluator()
        player_score = evaluator.evaluate(cards[fixed_player], board)
        opponent_score = evaluator.evaluate(cards[fixed_player], board)
        return history.get_pot() if player_score < opponent_score else -history.get_pot()
    
    def round_ended(self, round_history: str):
        return round_history.endswith("pp") or round_history.endswith("bp")
