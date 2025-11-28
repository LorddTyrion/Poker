from holdem import HoldemNode

class RuleBasedModel:
    """Rule-based poker model for baseline evaluation."""
    def __init__(self, action_map, strategy):
        self.action_map = action_map
        self.node_map = {}
        self.strategy = strategy  # fixed strategy [p_prob, b_prob, f_prob]


class RuleBasedNode(HoldemNode):
    """Node that always returns a fixed strategy."""
    def __init__(self, info_set_key, strategy):
        self.info_set_key = info_set_key
        self.strategy = strategy
    
    def get_average_strategy(self):
        """Return the fixed strategy."""
        return self.strategy
    
    def get_strategy(self, realization_weight):
        return self.strategy
    
