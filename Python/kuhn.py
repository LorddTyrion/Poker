import random
import base

class KuhnNode(base.Node):
    def __init__(self, info_set, num_actions):
        super().__init__(info_set, num_actions)
        self.card_rank = {'J': 1, 'Q': 2, 'K': 3}
    def is_terminal(self, history):
        # Terminal states: pp (showdown), bp (fold), bb (call), pbp (fold), pbb (call)
        return history in ["pp", "bp", "bb", "pbp", "pbb"]
    def is_chance_node(self, history):
        return len(history) == 1
    def get_terminal_utility(self, history, cards, fixed_player):
    # Return utility from the fixed player's perspective
        if history == "pp":  # Showdown after checks
            return 1 if self.card_rank[cards[fixed_player]] > self.card_rank[cards[1-fixed_player]] else -1
        elif history == "bp":  # Player 0 bet, Player 1 folded
            return 1 if fixed_player == 0 else -1
        elif history == "bb":  # Player 0 bet, Player 1 called
            return 2 if self.card_rank[cards[fixed_player]] > self.card_rank[cards[1-fixed_player]] else -2
        elif history == "pbp":  # Player 0 checked, Player 1 bet, Player 0 folded
            return -1 if fixed_player == 0 else 1
        elif history == "pbb":  # Player 0 checked, Player 1 bet, Player 0 called
            return 2 if self.card_rank[cards[fixed_player]] > self.card_rank[cards[1-fixed_player]] else -2
        
class KuhnCFR(base.CFR):
    def __init__(self, num_actions, action_map = {0: 'p', 1: 'b', 2: 'f'}):
        super().__init__(num_actions, action_map)
    def create_node(self, info_set):
        return KuhnNode(info_set, self.num_actions)
        

def train(iterations):
    cards = ['J', 'Q', 'K']
    cfr = KuhnCFR(2, action_map = {0: 'p', 1: 'b'})
    for i in range(iterations):
        # Deal random cards
        random.shuffle(cards)
        player_cards = cards[:2]
        
        # # Run CFR for each player
        cfr.cfr(player_cards, "", 0, 1.0, 1.0)  # For player 0
        cfr.cfr(player_cards, "", 1, 1.0, 1.0)  # For player 1
        if (i+1) % 10000 == 0:
            print(f"Completed {i+1} iterations")
    
    # Print final strategies
    print("\nFinal strategies:")
    for key in sorted(cfr.node_map):
        strategy = cfr.node_map[key].get_average_strategy()
        print(f"{key}: {strategy}")
    print("\n=== Nash Equilibrium Analysis ===")
    
    # Player 1 strategies
    p1_j_check = cfr.node_map["J"].get_average_strategy()[0] if "J" in cfr.node_map else "N/A"
    p1_q_bet = cfr.node_map["J"].get_average_strategy()[1] if "J" in cfr.node_map else "N/A"
    
    p1_q_check = cfr.node_map["Q"].get_average_strategy()[0] if "Q" in cfr.node_map else "N/A"
    p1_q_bet = cfr.node_map["Q"].get_average_strategy()[1] if "Q" in cfr.node_map else "N/A"
    
    p1_k_check = cfr.node_map["K"].get_average_strategy()[0] if "K" in cfr.node_map else "N/A" 
    p1_k_bet = cfr.node_map["K"].get_average_strategy()[1] if "K" in cfr.node_map else "N/A"
    
    # Player 1 after check-bet
    p1_q_call = cfr.node_map["Qpb"].get_average_strategy()[0] if "Qpb" in cfr.node_map else "N/A"  # Probability to fold (pass)
    p1_j_call = cfr.node_map["Jpb"].get_average_strategy()[0] if "Jpb" in cfr.node_map else "N/A"  # Probability to fold (pass)
    p1_k_call = cfr.node_map["Kpb"].get_average_strategy()[0] if "Kpb" in cfr.node_map else "N/A" 
    
    # Player 2 strategies
    p2_j_bet = cfr.node_map["Jp"].get_average_strategy()[1] if "Jp" in cfr.node_map else "N/A"
    p2_q_bet = cfr.node_map["Qp"].get_average_strategy()[1] if "Qp" in cfr.node_map else "N/A"
    p2_k_bet = cfr.node_map["Kp"].get_average_strategy()[1] if "Kp" in cfr.node_map else "N/A"
    
    p2_q_call = cfr.node_map["Qb"].get_average_strategy()[1] if "Qb" in cfr.node_map else "N/A"
    p2_j_call = cfr.node_map["Jb"].get_average_strategy()[1] if "Jb" in cfr.node_map else "N/A"
    p2_k_call = cfr.node_map["Kb"].get_average_strategy()[1] if "Kb" in cfr.node_map else "N/A"
    
    print("Player 1 (First to act):")
    print(f"Jack:   Check: {p1_j_check:.4f}, Bet: {1-p1_j_check:.4f}")
    print(f"Queen:  Check: {p1_q_check:.4f}, Bet: {p1_q_bet:.4f}")
    print(f"King:   Check: {p1_k_check:.4f}, Bet: {p1_k_bet:.4f}")
    print(f"Jack after check-bet:   Fold: {p1_j_call:.4f}, Call: {1-p1_j_call:.4f}")
    print(f"Queen after check-bet:  Fold: {p1_q_call:.4f}, Call: {1-p1_q_call:.4f}")
    print(f"King after check-bet:  Fold: {p1_k_call:.4f}, Call: {1-p1_k_call:.4f}")
    
    print("\nPlayer 2 (Second to act):")
    print(f"Jack after check:   Check: {1-p2_j_bet:.4f}, Bet: {p2_j_bet:.4f}")
    print(f"Queen after check:  Check: {1-p2_q_bet:.4f}, Bet: {p2_q_bet:.4f}")
    print(f"King after check:   Check: {1-p2_k_bet:.4f}, Bet: {p2_k_bet:.4f}")
    print(f"Jack after bet:     Fold: {1-p2_j_call:.4f}, Call: {p2_j_call:.4f}")
    print(f"Queen after bet:    Fold: {1-p2_q_call:.4f}, Call: {p2_q_call:.4f}")
    print(f"King after bet:     Fold: {1-p2_k_call:.4f}, Call: {p2_k_call:.4f}")


    

# Run training
print("Training the agent...")
train(1000000) 