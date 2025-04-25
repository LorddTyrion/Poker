class Node:
    def __init__(self, info_set, num_actions):
        self.info_set = info_set
        self.num_actions = num_actions
        self.regret_sum = [0.0 for i in range(self.num_actions)]  # For 'p' and 'b'
        self.strategy = [(1.0/self.num_actions) for i in range(self.num_actions)]
        self.strategy_sum = [0.0 for i in range(self.num_actions)]

    def get_strategy(self, realization_weight):
        # Calculate strategy from regrets
        self.strategy = [max(r, 0) for r in self.regret_sum]
        normalizing_sum = sum(self.strategy)
        if normalizing_sum > 0:
            self.strategy = [s/normalizing_sum for s in self.strategy] 
        else:
            self.strategy = [(1.0/self.num_actions) for i in range(self.num_actions)]
        
        # Accumulate strategy weighted by realization weight
        self.strategy_sum = [self.strategy_sum[i] + realization_weight * self.strategy[i] for i in range(len(self.strategy))]
        return self.strategy

    def get_average_strategy(self):
        normalizing_sum = sum(self.strategy_sum)
        if normalizing_sum > 0:
            return [s / normalizing_sum for s in self.strategy_sum]
        else:
            return [(1.0/self.num_actions) for i in range(self.num_actions)]
    
    def is_terminal(self, history):
        raise NotImplementedError
    def is_chance_node(self, history):
        raise NotImplementedError
    def get_terminal_utility(self, history, cards, fixed_player):
        raise NotImplementedError
    
class CFR:
    def __init__(self, num_actions, action_map = {0: 'p', 1: 'b', 2: 'f'}):
        self.node_map = {}
        self.num_actions = num_actions
        self.action_map = action_map
    def create_node(self, info_set):
        return Node(info_set, self.num_actions)
    def cfr(self, cards, history, fixed_player, p0, p1):

         # Determine current player
        current_player = len(history) % 2
        # Create information set key
        info_set = cards[current_player] + history

        if info_set not in self.node_map:
            self.node_map[info_set] = self.create_node(info_set)
        node = self.node_map[info_set]
        # Check if we're at a terminal state
        if node.is_terminal(history):
            return node.get_terminal_utility(history, cards, fixed_player)     
        
        # Get current strategy
        strategy = node.get_strategy(p0 if current_player == 0 else p1)
        
        # Initialize utility arrays
        util = [0.0, 0.0]
        node_util = 0.0
        
        # Recursively calculate utility for each action
        for a in range(self.num_actions):
            next_history = history + (self.action_map[a])            
            # Update probabilities based on current player
            if current_player == 0:
                util[a] = self.cfr(cards, next_history, fixed_player, p0 * strategy[a], p1)
            else:
                util[a] = self.cfr(cards, next_history, fixed_player, p0, p1 * strategy[a])
            
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