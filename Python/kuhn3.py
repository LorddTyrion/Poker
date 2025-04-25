import random

class Node:
    def __init__(self, info_set):
        self.info_set = info_set
        self.regret_sum = [0.0, 0.0]  # For 'p' and 'b'
        self.strategy = [0.5, 0.5]
        self.strategy_sum = [0.0, 0.0]

    def get_strategy(self, realization_weight):
        # Calculate strategy from regrets
        self.strategy = [max(r, 0) for r in self.regret_sum]
        normalizing_sum = sum(self.strategy)
        if normalizing_sum > 0:
            self.strategy = [s/normalizing_sum for s in self.strategy] 
        else:
            self.strategy = [0.5, 0.5]
        
        # Accumulate strategy weighted by realization weight
        self.strategy_sum = [self.strategy_sum[i] + realization_weight * self.strategy[i] for i in range(len(self.strategy))]
        return self.strategy

    def get_average_strategy(self):
        normalizing_sum = sum(self.strategy_sum)
        if normalizing_sum > 0:
            return [s / normalizing_sum for s in self.strategy_sum]
        else:
            return [0.5, 0.5]

card_rank = {'J': 1, 'Q': 2, 'K': 3}
node_map = {}

def is_terminal(history):
    # Terminal states: pp (showdown), bp (fold), bb (call), pbp (fold), pbb (call)
    return history in ["pp", "bp", "bb", "pbp", "pbb"]

def get_payoff(history, cards, player):
    # Return payoff from current player's perspective
    if history == "pp":  # Showdown after checks
        return 1 if card_rank[cards[player]] > card_rank[cards[1-player]] else -1
    elif history == "bp":  # Player 1 folded
        return 1 if player == 0 else -1
    elif history == "bb":  # Bet and call
        return 2 if card_rank[cards[player]] > card_rank[cards[1-player]] else -2
    elif history == "pbp":  # Check, bet, fold
        return -1 if player == 0 else 1
    elif history == "pbb":  # Check, bet, call
        return 2 if card_rank[cards[player]] > card_rank[cards[1-player]] else -2

class CFR:
    def cfr(self, cards, history, p0, p1):
        # Determine player
        plays = len(history)
        player = plays % 2
        
        # Check if we're at a terminal state
        if is_terminal(history):
            return get_payoff(history, cards, player)
        
        # Create information set key
        info_set = cards[player] + history
        
        # Get or create the node
        if info_set not in node_map:
            node_map[info_set] = Node(info_set)
        node = node_map[info_set]
        
        # Get current strategy
        strategy = node.get_strategy(p0 if player == 0 else p1)
        
        # Initialize utility arrays
        util = [0.0, 0.0]
        node_util = 0.0
        
        # Recursively calculate utility for each action
        for a in range(2):
            next_history = history + ('p' if a == 0 else 'b')
            
            # Update probabilities based on current player
            if player == 0:
                util[a] = -self.cfr(cards, next_history, p0 * strategy[a], p1)
            else:
                util[a] = -self.cfr(cards, next_history, p0, p1 * strategy[a])
            
            node_util += strategy[a] * util[a]
        
        # Update regrets
        for a in range(2):
            # Only update regrets for the current player
            regret = util[a] - node_util
            
            # Multiply by the opponent's probability
            if player == 0:
                node.regret_sum[a] += p1 * regret
            else:
                node.regret_sum[a] += p0 * regret
        
        return node_util

def train(iterations):
    cards = ['J', 'Q', 'K']
    cfr = CFR()
    
    for i in range(iterations):
        # Deal random cards
        random.shuffle(cards)
        player_cards = cards[:2]
        
        # Run CFR
        cfr.cfr(player_cards, "", 1.0, 1.0)
        
        # Optional progress report
        if (i+1) % 20000 == 0:
            print(f"Completed {i+1} iterations")
    
    # Print final strategies
    print("\nFinal strategies:")
    for key in sorted(node_map):
        strategy = node_map[key].get_average_strategy()
        print(f"{key}: {strategy}")

def play_against_agent():
    cards = ['J', 'Q', 'K']
    random.shuffle(cards)
    agent_card = cards[0]
    human_card = cards[1]

    print("\n==== New Game ====")
    print(f"Your card: {human_card}")
    
    history = ""
    
    while not is_terminal(history):
        player = len(history) % 2
        
        if player == 0:  # Agent's turn
            info_set = agent_card + history
            if info_set in node_map:
                strategy = node_map[info_set].get_average_strategy()
            else:
                strategy = [0.5, 0.5]
                
            # Make action based on strategy probabilities
            action = random.choices(['p', 'b'], weights=strategy)[0]
            history += action
            print(f"Agent: {'passes' if action == 'p' else 'bets'}")
        else:  # Human's turn
            while True:
                action = input("Your move (p = pass, b = bet): ").strip().lower()
                if action in ['p', 'b']:
                    history += action
                    break
                else:
                    print("Invalid input. Please enter 'p' or 'b'.")
    
    # Game over, determine result
    payoff = get_payoff(history, [agent_card, human_card], 0)  # Get payoff from agent's perspective
    human_payoff = -payoff
    
    print(f"\nAgent had: {agent_card}")
    
    # Explain the outcome
    if history == "pp":
        print("Both players checked. Showdown!")
    elif history == "bp":
        print("Agent bet, you folded.")
    elif history == "bb":
        print("Agent bet, you called. Showdown!")
    elif history == "pbp":
        print("Agent checked, you bet, agent folded.")
    elif history == "pbb":
        print("Agent checked, you bet, agent called. Showdown!")
    
    if human_payoff > 0:
        print(f"You win {abs(human_payoff)} chips!")
    elif human_payoff < 0:
        print(f"Agent wins {abs(human_payoff)} chips.")
    else:
        print("It's a draw.")

def analyze_nash_equilibrium():
    print("\n=== Nash Equilibrium Analysis ===")
    
    # Player 1 strategies
    p1_j_check = 1.0  # Always check with Jack
    
    p1_q_check = node_map["Q"].get_average_strategy()[0] if "Q" in node_map else "N/A"
    p1_q_bet = node_map["Q"].get_average_strategy()[1] if "Q" in node_map else "N/A"
    
    p1_k_check = node_map["K"].get_average_strategy()[0] if "K" in node_map else "N/A" 
    p1_k_bet = node_map["K"].get_average_strategy()[1] if "K" in node_map else "N/A"
    
    # Player 1 after check-bet
    p1_q_call = node_map["Qpb"].get_average_strategy()[0] if "Qpb" in node_map else "N/A"  # Probability to fold (pass)
    p1_j_call = node_map["Jpb"].get_average_strategy()[0] if "Jpb" in node_map else "N/A"  # Probability to fold (pass)
    
    # Player 2 strategies
    p2_j_bet = node_map["Jp"].get_average_strategy()[1] if "Jp" in node_map else "N/A"
    p2_q_bet = node_map["Qp"].get_average_strategy()[1] if "Qp" in node_map else "N/A"
    p2_k_bet = node_map["Kp"].get_average_strategy()[1] if "Kp" in node_map else "N/A"
    
    p2_q_call = node_map["Qb"].get_average_strategy()[1] if "Qb" in node_map else "N/A"
    p2_j_call = node_map["Jb"].get_average_strategy()[1] if "Jb" in node_map else "N/A"
    p2_k_call = node_map["Kb"].get_average_strategy()[1] if "Kb" in node_map else "N/A"
    
    print("Player 1 (First to act):")
    print(f"Jack:   Check: {p1_j_check:.4f}, Bet: {1-p1_j_check:.4f}")
    print(f"Queen:  Check: {p1_q_check:.4f}, Bet: {p1_q_bet:.4f}")
    print(f"King:   Check: {p1_k_check:.4f}, Bet: {p1_k_bet:.4f}")
    print(f"Jack after check-bet:   Fold: {p1_j_call:.4f}, Call: {1-p1_j_call:.4f}")
    print(f"Queen after check-bet:  Fold: {p1_q_call:.4f}, Call: {1-p1_q_call:.4f}")
    
    print("\nPlayer 2 (Second to act):")
    print(f"Jack after check:   Check: {1-p2_j_bet:.4f}, Bet: {p2_j_bet:.4f}")
    print(f"Queen after check:  Check: {1-p2_q_bet:.4f}, Bet: {p2_q_bet:.4f}")
    print(f"King after check:   Check: {1-p2_k_bet:.4f}, Bet: {p2_k_bet:.4f}")
    print(f"Jack after bet:     Fold: {1-p2_j_call:.4f}, Call: {p2_j_call:.4f}")
    print(f"Queen after bet:    Fold: {1-p2_q_call:.4f}, Call: {p2_q_call:.4f}")
    print(f"King after bet:     Fold: {1-p2_k_call:.4f}, Call: {p2_k_call:.4f}")
    
    # Estimate alpha parameter
    if isinstance(p2_j_bet, float):
        alpha_estimate = p2_j_bet
        print(f"\nEstimated α parameter: {alpha_estimate:.4f}")
        print(f"Theoretical range for α: 0 ≤ α ≤ 1/3 (approximately 0.333)")

# Run training
print("Training the agent...")
train(1000000)

# Debug the specific info set
if "Jpb" in node_map:
    print("\nStrategy analysis for Jpb:")
    jpb_node = node_map["Jpb"]
    print(f"Regret sum: {jpb_node.regret_sum}")
    print(f"Strategy sum: {jpb_node.strategy_sum}")
    print(f"Average strategy: {jpb_node.get_average_strategy()}")

analyze_nash_equilibrium()
    
# Play interactive game
# while True:
#     play_against_agent()
#     play_again = input("\nPlay again? (y/n): ").strip().lower()
#     if play_again != 'y':
#         break