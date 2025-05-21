import base
import random
import deuces
import evaluator
from typing import List
import pandas as pd
import pickle

class HoldemInfoSet(base.InfoSet):
    def __init__(self):
        self.history=["", "", "", ""]
        self.clusters=[]
        self.round = 0
        self.pot = [0,0]
    def set_history(self, value):
        self.history[self.round] = value
    def get_history(self):
        return self.history[self.round]
    def get_clusters(self):
        return self.clusters
    def add_cluster(self, value):
        self.clusters.append(value)
    def clear_clusters(self):
        self.clusters = []
    def get_round(self):
        return self.round
    def increment_round(self):
        self.round +=1
    def get_pot(self, winner):
        return self.pot[1-winner]
    def add_to_pot(self, player, value):
        self.pot[player] += value
    def key(self):
        return (tuple(self.history), tuple(self.clusters), self.round, tuple(self.pot))
    @classmethod
    def from_key(cls, key):
        obj = cls()
        obj.history = list(key[0])
        obj.clusters = list(key[1])
        obj.round = key[2]
        obj.pot = list(key[3])
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
        return round != 3 and self.round_ended(round_history)


    def get_terminal_utility(self, history: HoldemInfoSet, cards: List[List[deuces.Card]], board: List[deuces.Card], fixed_player):
        winner = fixed_player
        if history.get_history().endswith("f"):
            if len(history.get_history()) % 2 != fixed_player:
                winner = 1-fixed_player
            return history.get_pot(winner) if winner == fixed_player else -history.get_pot(winner)
        evaluator = deuces.Evaluator()
        player_score = evaluator.evaluate(cards[fixed_player], board)
        opponent_score = evaluator.evaluate(cards[1-fixed_player], board)
        if player_score > opponent_score:
            winner = 1-fixed_player
        return history.get_pot(winner) if winner == fixed_player else -history.get_pot(winner)
    
    def round_ended(self, round_history: str):
        return round_history.endswith("pp") or round_history.endswith("bp")
    

class HoldemCFR(base.CFR):
    def __init__(self,  num_actions, clustering, action_map = {0: 'p', 1: 'b', 2: 'f'}, node_map= {}):
        super().__init__(num_actions, action_map)
        self.num_actions = num_actions
        self.node_map = node_map
        self.evaluator = deuces.Evaluator()
        self.clustering: evaluator.HandClustering = clustering
    def create_node(self, info_set):
        return HoldemNode(info_set, self.num_actions)
    def save_node_map(self, filename="node_map.parquet"):
        rows = []
        for key, node in self.node_map.items():
            rows.append({
                "key": pickle.dumps(key),
                "regret_sum": node.regret_sum,
                "strategy_sum": node.strategy_sum,
            })
        df = pd.DataFrame(rows)
        df.to_parquet(filename, index=False)

    def cfr(self, cards: List[List[deuces.Card]], flop: List[deuces.Card], turn: deuces.Card, river: deuces.Card, history: HoldemInfoSet, fixed_player, p0, p1):
         
        current_player = len(history.get_history()) % 2
        round = history.get_round()
        
        history.clear_clusters()
        history.add_cluster(self.clustering.get_preflop_cluster(cards[current_player]))
        board = []
        if round >=1: # flop
            board +=flop
            evaluation = self.evaluator.evaluate(cards[current_player], flop)
            history.add_cluster(self.clustering.get_flop_cluster(evaluation))
        if round >=2: # turn
            board.append(turn)
            evaluation = self.evaluator.evaluate(cards[current_player], board)
            history.add_cluster(self.clustering.get_turn_cluster(evaluation))
        if round >=3: # river
            board.append(river)
            evaluation = self.evaluator.evaluate(cards[current_player], board)
            history.add_cluster(self.clustering.get_river_cluster(evaluation))
        
        info_set = history.key()

        if info_set not in self.node_map:
            self.node_map[info_set] = self.create_node(info_set)
        node : HoldemNode = self.node_map[info_set]
        # Check if we're at a terminal state
        if node.is_terminal(history):
            return node.get_terminal_utility(history, cards, board, fixed_player)        
        
        if node.is_chance_node(history):
            history.increment_round()
            return self.cfr(cards, flop, turn, river, history, fixed_player, p0, p1)
            
               
        
        # Get current strategy
        strategy = node.get_strategy(p0 if current_player == 0 else p1)
        
        # Initialize utility arrays
        util = [0.0, 0.0, 0.0]
        node_util = 0.0
        
        
        # Recursively calculate utility for each action
        for a in range(self.num_actions):
            if history.get_history().count('b') >= 2: # only 2 bets/raises allowed
                continue
            next_history = HoldemInfoSet.from_key(info_set)
            amount_bet = 0
            if a==0 and (next_history.get_history() == "" or next_history.get_history() == "p"):
                amount_bet = 0
            elif a == 0 or (a == 1 and (next_history.get_history() == "" or next_history.get_history() == "p")):
                amount_bet = 1
            elif a == 1:
                amount_bet = 2

            next_history.set_history(next_history.get_history()+(self.action_map[a]))           
            next_history.add_to_pot(current_player, amount_bet)
            # Update probabilities based on current player
            if current_player == 0:
                util[a] = self.cfr(cards, flop, turn, river, next_history, fixed_player, p0 * strategy[a], p1)
            else:
                util[a] = self.cfr(cards, flop, turn, river, next_history, fixed_player, p0, p1 * strategy[a])
            
            node_util += strategy[a] * util[a]
        
        # Update regrets only if this is the fixed player's decision point
        if current_player == fixed_player:
            for a in range(self.num_actions):
                regret = util[a] - node_util
                
                # Multiply by the opponent's probability
                if fixed_player == 0:
                    node.regret_sum[a] += p1 * regret
                else:
                    node.regret_sum[a] += p0 * regret
        
        return node_util


def load_node_map(filename, num_actions):
    df = pd.read_parquet(filename)
    node_map = {}
    for _, row in df.iterrows():
        key = pickle.loads(row["key"])
        info_set = HoldemInfoSet.from_key(key)
        node = HoldemNode(info_set, num_actions)
        node.regret_sum = list(row["regret_sum"])
        node.strategy_sum = list(row["strategy_sum"])
        node_map[key] = node
    return node_map

def train(iterations, num_clusters, filename):
    hc = evaluator.HandClustering()
    print("Building lookup tables...")
    hc.build_preflop_table(20000, num_clusters)
    print("Building preflop table finished.")
    hc.build_flop_table(20000, num_clusters)
    print("Building flop table finished.")
    hc.build_turn_table(20000, num_clusters)
    print("Building turn table finished.")
    hc.build_river_table(20000, num_clusters)
    print("Building river table finished.")
    cfr = HoldemCFR(3, hc, action_map = {0: 'p', 1: 'b', 2:'f'})
    print("Training...")
    for i in range(iterations):
        # Deal random cards
        deck = deuces.Deck()
        player1_cards = deck.draw(2)
        player2_cards = deck.draw(2)
        cards = [player1_cards, player2_cards]
        flop = deck.draw(3)
        [turn, river] = deck.draw(2)
        info_set1 = HoldemInfoSet()
        info_set2 = HoldemInfoSet()
        # # Run CFR for each player
        cfr.cfr(cards, flop,turn, river, info_set1, 0, 1.0, 1.0)  # For player 0
        cfr.cfr(cards,flop,turn, river, info_set2, 1, 1.0, 1.0)  # For player 1
        if (i+1) % 10 == 0 or i == 0:
            print(f"Completed {i+1} iterations")
    print("Training completed.")
    cfr.save_node_map(filename)

def continue_training(iterations, num_clusters, filename):
    hc = evaluator.HandClustering()
    print("Building lookup tables...")
    hc.build_preflop_table(20000, num_clusters)
    print("Building preflop table finished.")
    hc.build_flop_table(20000, num_clusters)
    print("Building flop table finished.")
    hc.build_turn_table(20000, num_clusters)
    print("Building turn table finished.")
    hc.build_river_table(20000, num_clusters)
    print("Building river table finished.")
    print("Continuing training...")
    loaded_map = load_node_map(filename, 3)
    cfr = HoldemCFR(3, hc, action_map = {0: 'p', 1: 'b', 2:'f'}, node_map=loaded_map)
    for i in range(iterations):
        # Deal random cards
        deck = deuces.Deck()
        player1_cards = deck.draw(2)
        player2_cards = deck.draw(2)
        cards = [player1_cards, player2_cards]
        flop = deck.draw(3)
        [turn, river] = deck.draw(2)
        info_set1 = HoldemInfoSet()
        info_set2 = HoldemInfoSet()
        # # Run CFR for each player
        cfr.cfr(cards, flop,turn, river, info_set1, 0, 1.0, 1.0)  # For player 0
        cfr.cfr(cards,flop,turn, river, info_set2, 1, 1.0, 1.0)  # For player 1
        if (i+1) % 10 == 0 or i == 0:
            print(f"Completed {i+1} iterations")
    print("Training completed.")
    cfr.save_node_map(filename)

# train(1000, 6, "trained_node_map_6.parquet")
continue_training(20000, 6,  "trained_node_map_6.parquet")
