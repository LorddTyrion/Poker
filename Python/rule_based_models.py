from holdem import HoldemNode

class RuleBasedModel:
    def __init__(self, action_map, strategy):
        self.action_map = action_map
        self.node_map = {}
        self.strategy = strategy


class RuleBasedNode(HoldemNode):
    def __init__(self, info_set_key, strategy):
        self.info_set_key = info_set_key
        self.strategy = strategy
    
    def get_average_strategy(self):
        return self.strategy
    
    def get_strategy(self, realization_weight):
        return self.strategy
    
