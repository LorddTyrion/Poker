from deuces import Card
from deuces import Evaluator
from deuces import Deck
import numpy as np
from sklearn.cluster import KMeans
# card = Card.new('Qh')
# board = [
#     Card.new('Ah'),
#     Card.new('Kd'),
#     Card.new('Jc')
# ]
# hand = [
#    Card.new('Qs'),
#    Card.new('Th')
# ]
# Card.print_pretty_cards(board + hand)

# evaluator = Evaluator()
# print(evaluator.evaluate(board, hand))

class HandEvaluator:
    def __init__(self, hand, board):
        self.hand = hand
        self.board = board
        full_deck = Deck().GetFullDeck()
        known_cards = np.concatenate([board, hand], axis=0)
        self.remaining_cards = [card for card in full_deck if card not in known_cards]

    def simulate_games(self, num_simulations):
        evaluator = Evaluator()
        base_eval = evaluator.evaluate(self.board, self.hand)
        wins = 0
        draws = 0
        losses = 0
        for i in range(num_simulations):
            simulated_hand = np.random.choice(self.remaining_cards, 2, replace=False)
            simulated_eval = evaluator.evaluate(self.board, simulated_hand.tolist())
            if base_eval < simulated_eval:
                wins +=1
            elif base_eval == simulated_eval:
                draws +=1
            else:
                losses +=1
        return [wins/num_simulations, draws/num_simulations, losses/num_simulations]
    
    def simulate_games_by_eval(self, eval, num_simulations, board_size):
        evaluator = Evaluator()
        wins = 0
        draws = 0
        losses = 0
        for i in range(num_simulations):
            deck = Deck()
            simulated_hand = deck.draw(2)
            simulated_board = deck.draw(board_size)
            simulated_eval = evaluator.evaluate(simulated_board, simulated_hand)
            if eval < simulated_eval:
                wins +=1
            elif eval == simulated_eval:
                draws +=1
            else:
                losses +=1
        return [wins/num_simulations, draws/num_simulations, losses/num_simulations]
    def simulate_preflop_games(self, num_simulations):
        evaluator = Evaluator()
        wins = 0
        draws = 0
        losses = 0
        remaining_cards = np.concatenate([self.remaining_cards, self.board], axis=0)
        for i in range(num_simulations):
            simulated_hand = np.random.choice(remaining_cards, 2, replace=False)
            cards_for_board = [card for card in remaining_cards if card not in simulated_hand]
            simulated_board = np.random.choice(cards_for_board, 5, replace=False)
            eval = evaluator.evaluate(simulated_board.tolist(), self.hand)
            simulated_eval = evaluator.evaluate(simulated_board.tolist(), simulated_hand.tolist())
            if eval < simulated_eval:
                wins +=1
            elif eval == simulated_eval:
                draws +=1
            else:
                losses +=1
        return [wins/num_simulations, draws/num_simulations, losses/num_simulations]
    
class HandClustering:

    def __init__(self):
        self.preflop_map = {}
        self.flop_map = {}
        self.turn_map = {}
        self.river_map = {}

    def get_preflop_cluster(self, hand):
        if tuple(hand) in self.preflop_map:
            return self.preflop_map[tuple(hand)]
        
    def get_flop_cluster(self, eval):
        if eval in self.flop_map:
            return self.flop_map[eval]
        
    def get_turn_cluster(self, eval):
        if eval in self.turn_map:
            return self.turn_map[eval]
        
    def get_river_cluster(self, eval):
        if eval in self.river_map:
            return self.river_map[eval]
    
    def build_preflop_table(self, num_simulations):
        full_deck1 = Deck().GetFullDeck()
        full_deck2 = Deck().GetFullDeck()
        pairs = [(card1, card2) for card1 in full_deck1 for card2 in full_deck2 if card1 != card2]
        results = []
        for pair in pairs:
            remaining_cards = [card for card in full_deck1 if card not in pair]
            board = np.random.choice(remaining_cards, 5, replace=False)
            he = HandEvaluator(list(pair), board)
            results.append(he.simulate_preflop_games(num_simulations))
        clusters = self.get_clusters(10, results)
        for i, pair in enumerate(pairs):
            self.preflop_map[pair] = clusters[i]

        
    def build_flop_table(self, num_simulations):
        deck = Deck()
        hand = deck.draw(2)
        board = deck.draw(3)
        results = []
        he = HandEvaluator(hand, board)
        for i in range(1, 7463):
            results.append(he.simulate_games_by_eval(i, num_simulations, 3))
        clusters = self.get_clusters(10, results)
        for i in range (len(clusters)):
            self.flop_map[i+1] = clusters[i]

    def build_turn_table(self, num_simulations):
        deck = Deck()
        hand = deck.draw(2)
        board = deck.draw(4)
        results = []
        he = HandEvaluator(hand, board)
        for i in range(1, 7463):
            results.append(he.simulate_games_by_eval(i, num_simulations, 4))
        clusters = self.get_clusters(10, results)
        for i in range (len(clusters)):
            self.turn_map[i+1] = clusters[i]

    def build_river_table(self, num_simulations):
        deck = Deck()
        hand = deck.draw(2)
        board = deck.draw(5)
        results = []
        he = HandEvaluator(hand, board)
        for i in range(1, 7463):
            results.append(he.simulate_games_by_eval(i, num_simulations, 5))
        clusters = self.get_clusters(10, results)
        for i in range (len(clusters)):
            self.river_map[i+1] = clusters[i]

    def get_clusters(self, num_clusters, X):
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init="auto").fit(X)
        y = kmeans.fit_predict(X)
        return y

hc = HandClustering()
hc.build_river_table(100)
print(hc.get_river_cluster(4500))
hc.build_preflop_table(100)
deck = Deck()
hand = deck.draw(2)
print(hc.get_preflop_cluster(hand))