import base
import deuces
import evaluator
from typing import List
import pandas as pd
import pickle

class HoldemInfoSet(base.InfoSet):
    def __init__(self, num_players=2):
        self.num_players = num_players
        self.history = ["", "", "", ""]
        self.clusters = []
        self.round = 0
        self.pot = [1] * num_players 
        self.player_id = 0
        
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
        self.round += 1
        
    def get_pot(self, winner):
        return sum(self.pot) - self.pot[winner]
    
    def add_to_pot(self, player, value):
        self.pot[player] += value
        
    def set_player_id(self, player_id):
        self.player_id = player_id
        
    def get_player_id(self):
        return self.player_id
    
    def key(self):
        return (tuple(self.history), tuple(self.clusters), self.round, 
                tuple(self.pot), self.player_id, self.num_players)
    
    @classmethod
    def from_key(cls, key):
        num_players = key[5] if len(key) > 5 else 2
        obj = cls(num_players)
        obj.history = list(key[0])
        obj.clusters = list(key[1])
        obj.round = key[2]
        obj.pot = list(key[3])
        obj.player_id = key[4] if len(key) > 4 else 0
        return obj
    
    
class HoldemNode(base.Node):
    def __init__(self, info_set, num_actions):
        super().__init__(info_set, num_actions)
    @staticmethod    
    def is_terminal(history: HoldemInfoSet):
        round_history = history.get_history()
        round = history.get_round()
        # Count how many players have folded across all rounds
        all_history = ''.join(history.history)
        fold_count = 0
        for i in range(history.num_players):
            # Get actions for this player position
            player_actions = all_history[i::history.num_players]
            if 'f' in player_actions:
                fold_count += 1
        
        # Terminal if only one player remains (all others folded)
        if fold_count >= history.num_players - 1:
            return True
        return round == 3 and HoldemNode.round_ended(round_history, history.num_players)
    @staticmethod
    def is_chance_node(history: HoldemInfoSet):
        round_history = history.get_history()
        round = history.get_round()
        return round != 3 and HoldemNode.round_ended(round_history, history.num_players)
    @staticmethod
    def get_terminal_utility(history: HoldemInfoSet, cards: List[List[deuces.Card]], 
                           board: List[deuces.Card], fixed_player):
        # Count active players across all rounds
        all_history = ''.join(history.history)
        active_players = []
        for i in range(history.num_players):
            player_actions = all_history[i::history.num_players]
            if 'f' not in player_actions:
                active_players.append(i)
        
        # If fixed_player folded, they lose their contribution
        if fixed_player not in active_players:
            return -history.pot[fixed_player]
        
        # If fixed_player is last one standing, they win
        if len(active_players) == 1 and active_players[0] == fixed_player:
            return history.get_pot(fixed_player)
        
        # Showdown - evaluate all hands
        evaluator_obj = deuces.Evaluator()
        scores = []
        for i in active_players:
            score = evaluator_obj.evaluate(cards[i], board)
            scores.append((score, i))
        
        # Find winner(s) - lower score is better in deuces
        scores.sort()
        best_score = scores[0][0]
        winners = [player for score, player in scores if score == best_score]
        
        # Calculate utility
        if fixed_player in winners:
            # Split pot among winners
            pot_won = sum(history.pot) / len(winners)
            return pot_won - history.pot[fixed_player]
        else:
            return -history.pot[fixed_player]
    @staticmethod
    def round_ended(round_history: str, num_players: int):
        # Round needs at least num_players actions
        if len(round_history) < num_players:
            return False
        
        # Find the last bet/raise position in this round
        last_bet_pos = -1
        for i in range(len(round_history) - 1, -1, -1):
            if round_history[i] == 'b':
                last_bet_pos = i
                break
        
        # If no bets, everyone has acted (we already checked length >= num_players)
        if last_bet_pos == -1:
            return True
        
        # If there was a bet, everyone after the bettor must have responded
        actions_after_bet = len(round_history) - last_bet_pos - 1
        
        # Need (num_players - 1) responses after the last bet
        return actions_after_bet >= num_players - 1
    

class HoldemCFR(base.CFR):
    def __init__(self, num_actions, clustering, num_players=2, 
                 action_map={0: 'p', 1: 'b', 2: 'f'}, node_map={}):
        super().__init__(num_actions, action_map)
        self.num_actions = num_actions
        self.num_players = num_players
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

    def cfr(self, cards: List[List[deuces.Card]], flop: List[deuces.Card], 
            turn: deuces.Card, river: deuces.Card, history: HoldemInfoSet, 
            fixed_player, reach_probs: List[float]):
        
        # Calculate current player based on action count
        current_player = len(history.get_history()) % self.num_players
        round = history.get_round()

        # Set the perspective for this info set
        history.set_player_id(current_player)
        
        # Build clusters for current player's perspective
        history.clear_clusters()
        history.add_cluster(self.clustering.get_preflop_cluster(cards[current_player]))
        board = []
        
        if round >= 1:  # flop
            board += flop
            evaluation = self.evaluator.evaluate(cards[current_player], flop)
            history.add_cluster(self.clustering.get_flop_cluster(evaluation))
        if round >= 2:  # turn
            board.append(turn)
            evaluation = self.evaluator.evaluate(cards[current_player], board)
            history.add_cluster(self.clustering.get_turn_cluster(evaluation))
        if round >= 3:  # river
            board.append(river)
            evaluation = self.evaluator.evaluate(cards[current_player], board)
            history.add_cluster(self.clustering.get_river_cluster(evaluation))

        # Check terminal state
        if HoldemNode.is_terminal(history):
            return HoldemNode.get_terminal_utility(history, cards, board, fixed_player)
        
        # Handle chance node (deal next cards)
        if HoldemNode.is_chance_node(history):
            history.increment_round()
            return self.cfr(cards, flop, turn, river, history, fixed_player, reach_probs)
        
        # Check if current player has already folded (across all rounds)
        all_history = ''.join(history.history)
        player_actions = all_history[current_player::self.num_players]
        if 'f' in player_actions:
            # Player already folded, they auto-fold again
            next_history = HoldemInfoSet.from_key(history.key())
            next_history.set_history(next_history.get_history() + 'f')
            return self.cfr(cards, flop, turn, river, next_history, fixed_player, reach_probs)
        
        info_set = history.key()
        
        if info_set not in self.node_map:
            self.node_map[info_set] = self.create_node(info_set)
        node: HoldemNode = self.node_map[info_set]
        
        
        # Get current strategy
        strategy = node.get_strategy(reach_probs[current_player])
        
        # Initialize utility arrays
        util = [0.0] * self.num_actions
        node_util = 0.0
        
        # Recursively calculate utility for each action
        for a in range(self.num_actions):
            if history.get_history().count('b') >= 2:  # betting limit
                continue
                
            next_history = HoldemInfoSet.from_key(info_set)
            amount_bet = 0
            current_round_history = next_history.get_history()

            # Calculate current bet level and this player's contribution so far this round
            current_bet_level = 0
            player_contribution = [0] * self.num_players
            
            for i, action in enumerate(current_round_history):
                    player = i % self.num_players
                    if action == 'b':
                        if current_bet_level > 0:
                            # Raising: call current bet + raise by 1
                            amount_to_add = current_bet_level - player_contribution[player] + 1
                            player_contribution[player] += amount_to_add
                            current_bet_level += 1
                        else:
                            # Initial bet
                            player_contribution[player] += 1
                            current_bet_level = 1
                    elif action == 'p' and current_bet_level > 0:
                        # Calling
                        amount_to_call = current_bet_level - player_contribution[player]
                        player_contribution[player] += amount_to_call
                
            # Now determine amount for current action
            if a == 0:  # Pass (check or call)
                if current_bet_level > 0:
                    amount_bet = current_bet_level - player_contribution[current_player]  # Call
                else:
                    amount_bet = 0  # Check
            elif a == 1:  # Bet or raise
                if current_bet_level > 0:
                    # Raising: need to call current bet + add 1 more
                    current_bet_level += 1
                    amount_bet = current_bet_level - player_contribution[current_player]
                else:
                    # Initial bet
                    current_bet_level = 1
                    amount_bet = 1
                
            next_history.set_history(next_history.get_history() + self.action_map[a])
            next_history.add_to_pot(current_player, amount_bet)
            
            # Update reach probabilities
            next_reach_probs = reach_probs.copy()
            next_reach_probs[current_player] *= strategy[a]
            
            util[a] = self.cfr(cards, flop, turn, river, next_history, 
                             fixed_player, next_reach_probs)
            node_util += strategy[a] * util[a]
        
        # Update regrets only for the fixed player
        if current_player == fixed_player:
            # Calculate counterfactual reach (all players except fixed_player)
            cf_reach = 1.0
            for i in range(self.num_players):
                if i != fixed_player:
                    cf_reach *= reach_probs[i]
            
            for a in range(self.num_actions):
                regret = util[a] - node_util
                node.regret_sum[a] += cf_reach * regret
        
        return node_util


def train(iterations, num_clusters, num_players, filename):
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
    
    cfr = HoldemCFR(3, hc, num_players=num_players, 
                    action_map={0: 'p', 1: 'b', 2: 'f'})
    print(f"Training with {num_players} players...")
    
    for i in range(iterations):
        # Deal random cards
        deck = deuces.Deck()
        cards = [deck.draw(2) for _ in range(num_players)]
        flop = deck.draw(3)
        [turn, river] = deck.draw(2)
        
        # Run CFR for each player perspective
        for player in range(num_players):
            info_set = HoldemInfoSet(num_players)
            reach_probs = [1.0] * num_players
            cfr.cfr(cards, flop, turn, river, info_set, player, reach_probs)
        
        if (i + 1) % 10 == 0 or i == 0:
            print(f"Completed {i + 1} iterations")
    
    print("Training completed.")
    cfr.save_node_map(filename)