import random
from dto import MoveDTO, HoldemInfoSetDTO
from model import PokerMove
from holdem import load_node_map, HoldemNode

class PokerService:
    def __init__(self):
        pass
    def get_move(self, state: HoldemInfoSetDTO):
        info_set = state.to_holdem_info_set()
        key = info_set.key()
        match state.model:
            case 1:
                node_map=load_node_map("against_calling_machine_50k.parquet", 3)
            case 2:
                node_map = load_node_map("bucket_5_50k_3.parquet", 3)
            case 3: 
                node_map = load_node_map("anti_maniac_30k.parquet", 3)
            case _:
                node_map = load_node_map("bucket_5_50k_3.parquet", 3)
        if key not in node_map.keys():
            node = HoldemNode(key, 3)
        else:
            node = node_map[key]
        strategy = node.get_average_strategy()
        strategy = [max(s, 0.0) for s in strategy]
        total = sum(strategy)
        if total > 0:
            strategy = [s / total for s in strategy]
        else:
            strategy = [1.0 / 3] * 3

        # Choose action
        action = random.choices(range(3), weights=strategy)[0]

        # Only allow 2 raises/bets
        if info_set.get_history().count('b') >= 2 and action == 1:
            action = 0
        
        if action == 0:
            return MoveDTO(
                pokerMove = PokerMove.PASS
            )
        if action == 1:
            return MoveDTO(
                pokerMove = PokerMove.BET
            )
        return MoveDTO(
                pokerMove = PokerMove.FOLD
            )