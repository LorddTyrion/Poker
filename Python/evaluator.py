from deuces import Card
from deuces import Evaluator
from deuces import Deck
import numpy as np
from sklearn.cluster import KMeans
import itertools
import random
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

def generate_169_hands():
    ranks = 'AKQJT98765432'
    hands = set()
    for i, r1 in enumerate(ranks):
        for j, r2 in enumerate(ranks):
            if i < j:
                hands.add((r1, r2, 's'))  # suited
                hands.add((r1, r2, 'o'))  # offsuit
            elif i == j:
                hands.add((r1, r2, ''))   # pair
    return list(hands)

def random_suited_cards(r1, r2):
    suit = random.choice('cdhs')
    return [r1 + suit, r2 + suit]

def random_offsuit_cards(r1, r2):
    suits = random.sample('cdhs', 2)
    return [r1 + suits[0], r2 + suits[1]]

def hand_to_cards(hand_class):
    r1, r2, suited = hand_class
    if r1 == r2:
        suits = random.sample('cdhs', 2)
        return [r1 + suits[0], r2 + suits[1]]
    elif suited == 's':
        return random_suited_cards(r1, r2)
    else:
        return random_offsuit_cards(r1, r2)
def hand_to_cards_from_deck(hand_class, deck):
    r1, r2, suited = hand_class
    suits = 'cdhs'

    while True:
        if r1 == r2:
            suits_chosen = random.sample(suits, 2)
        elif suited == 's':
            s = random.choice(suits)
            suits_chosen = [s, s]
        else:
            suits_chosen = random.sample(suits, 2)

        card1_str = r1 + suits_chosen[0]
        card2_str = r2 + suits_chosen[1]
        card1 = Card.new(card1_str)
        card2 = Card.new(card2_str)

        if card1 in deck.cards and card2 in deck.cards and card1 != card2:
            deck.cards.remove(card1)
            deck.cards.remove(card2)
            return [card1, card2]

def str_to_card(card_str):
    return Card.new(card_str)

def card_obj_to_str(card):
    return Card.int_to_str(card)  # e.g., 'Ah', 'Td', etc.

def canonical_hand_key(card1, card2):
    r1 = card_obj_to_str(card1)[0]
    r2 = card_obj_to_str(card2)[0]
    s1 = card_obj_to_str(card1)[1]
    s2 = card_obj_to_str(card2)[1]

    if r1 == r2:
        return tuple(sorted([r1, r2])) + ('',)  # Pair, e.g., ('Q', 'Q', '')
    elif s1 == s2:
        return tuple(sorted([r1, r2], reverse=True)) + ('s',)  # Suited
    else:
        return tuple(sorted([r1, r2], reverse=True)) + ('o',)  # Offsuit

def estimate_equity(evaluator, hand_class, num_simulations=1000):
    wins = 0
    ties = 0

    for _ in range(num_simulations):
        deck = Deck()
        hero = hand_to_cards_from_deck(hand_class, deck)
        opp = deck.draw(2)
        board = deck.draw(5)

        hscore = evaluator.evaluate(board, hero)
        oscore = evaluator.evaluate(board, opp)

        if hscore < oscore:
            wins += 1
        elif hscore == oscore:
            ties += 1
        # else: opponent wins

    equity = (wins + 0.5 * ties) / num_simulations
    return equity

def estimate_all_equities(num_simulations=1000):
    evaluator = Evaluator()
    hands = generate_169_hands()
    equity_map = {}

    for i, hand in enumerate(hands):
        eq = estimate_equity(evaluator, hand, num_simulations)
        equity_map[hand] = eq
        # print(f"{i+1}/{len(hands)}: {hand} -> {eq:.3f}")

    return equity_map

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
        [card1, card2] = hand
        key = canonical_hand_key(card1, card2)
        if key in self.preflop_map:
            return self.preflop_map[key]
        
    def get_flop_cluster(self, eval):
        if eval in self.flop_map:
            return self.flop_map[eval]
        
    def get_turn_cluster(self, eval):
        if eval in self.turn_map:
            return self.turn_map[eval]
        
    def get_river_cluster(self, eval):
        if eval in self.river_map:
            return self.river_map[eval]
    
    def build_preflop_table(self, num_simulations, num_clusters):
        # full_deck1 = Deck().GetFullDeck()
        # full_deck2 = Deck().GetFullDeck()
        # pairs = [(card1, card2) for card1 in full_deck1 for card2 in full_deck2 if card1 != card2]
        # results = []
        # for pair in pairs:
        #     remaining_cards = [card for card in full_deck1 if card not in pair]
        #     board = np.random.choice(remaining_cards, 5, replace=False)
        #     he = HandEvaluator(list(pair), board)
        #     results.append(he.simulate_preflop_games(num_simulations))
        # clusters = self.get_clusters(10, results)
        # for i, pair in enumerate(pairs):
        #     self.preflop_map[pair] = clusters[i]
        equity_map = estimate_all_equities(num_simulations)
        sorted_items = sorted(equity_map.items(), key=lambda x: x[1])
        cluster_size = len(sorted_items) // num_clusters
        clusters = {}

        for cluster_id in range(num_clusters):
            start = cluster_id * cluster_size
            end = (cluster_id + 1) * cluster_size if cluster_id < num_clusters - 1 else len(sorted_items)
            for i in range(start, end):
                clusters[sorted_items[i][0]] = cluster_id
        self.preflop_map = clusters
        print(self.preflop_map)

        
    def build_flop_table(self, num_simulations, num_clusters):
        # deck = Deck()
        # hand = deck.draw(2)
        # board = deck.draw(3)
        # results = []
        # he = HandEvaluator(hand, board)
        # for i in range(1, 7463):
        #     results.append(he.simulate_games_by_eval(i, num_simulations, 3))
        # clusters = self.get_clusters(10, results)
        # for i in range (len(clusters)):
        #     self.flop_map[i+1] = clusters[i]
        evals = []
        for _ in range(num_simulations):
            deck = Deck()
            hand = deck.draw(2)
            board = deck.draw(3)
            evaluator = Evaluator()
            evals.append(evaluator.evaluate(hand, board))
        evals.sort()
        cluster_borders = []
        for i in range(1, num_clusters):
            border_index = int(i * len(evals) / num_clusters)
            cluster_borders.append(evals[border_index])
        
        for i in range(1, 7463):  
            for cluster_id, border in enumerate(cluster_borders):
                if i < border:
                    self.flop_map[i] = cluster_id
                    break
            else:
                self.flop_map[i] = num_clusters - 1
        

        

    def build_turn_table(self, num_simulations, num_clusters):
        # deck = Deck()
        # hand = deck.draw(2)
        # board = deck.draw(4)
        # results = []
        # he = HandEvaluator(hand, board)
        # for i in range(1, 7463):
        #     results.append(he.simulate_games_by_eval(i, num_simulations, 4))
        # clusters = self.get_clusters(10, results)
        # for i in range (len(clusters)):
        #     self.turn_map[i+1] = clusters[i]
        evals = []
        for _ in range(num_simulations):
            deck = Deck()
            hand = deck.draw(2)
            board = deck.draw(4)
            evaluator = Evaluator()
            evals.append(evaluator.evaluate(hand, board))
        evals.sort()
        cluster_borders = []
        for i in range(1, num_clusters):
            border_index = int(i * len(evals) / num_clusters)
            cluster_borders.append(evals[border_index])
        
        for i in range(1, 7463):  
            for cluster_id, border in enumerate(cluster_borders):
                if i < border:
                    self.turn_map[i] = cluster_id
                    break
            else:
                self.turn_map[i] = num_clusters - 1

    def build_river_table(self, num_simulations, num_clusters):
        # deck = Deck()
        # hand = deck.draw(2)
        # board = deck.draw(5)
        # results = []
        # he = HandEvaluator(hand, board)
        # for i in range(1, 7463):
        #     results.append(he.simulate_games_by_eval(i, num_simulations, 5))
        # clusters = self.get_clusters(10, results)
        # for i in range (len(clusters)):
        #     self.river_map[i+1] = clusters[i]
        evals = []
        for _ in range(num_simulations):
            deck = Deck()
            hand = deck.draw(2)
            board = deck.draw(5)
            evaluator = Evaluator()
            evals.append(evaluator.evaluate(hand, board))
        evals.sort()
        cluster_borders = []
        for i in range(1, num_clusters):
            border_index = int(i * len(evals) / num_clusters)
            cluster_borders.append(evals[border_index])
        print(cluster_borders)
        for i in range(1, 7463):  
            for cluster_id, border in enumerate(cluster_borders):
                if i < border:
                    self.river_map[i] = cluster_id
                    break
            else:
                self.river_map[i] = num_clusters - 1

    def get_clusters(self, num_clusters, X):
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init="auto").fit(X)
        y = kmeans.fit_predict(X)
        return y

hc = HandClustering()
hc.build_river_table(1000, 5)
print(hc.get_river_cluster(7460))
hc.build_preflop_table(1000, 5)
deck = Deck()
hand = deck.draw(2)
print(hc.get_preflop_cluster(hand))