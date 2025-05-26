import random
import deuces
import holdem
import evaluator

def play_hand(cfr_player0, cfr_player1, hc5, hc6):
    deck = deuces.Deck()
    cards = [deck.draw(2), deck.draw(2)]
    flop = deck.draw(3)
    turn, river = deck.draw(2)

    history = holdem.HoldemInfoSet()  # shared copy for simulation
    evaluator = deuces.Evaluator()

    round = 0
    current_player = 0
    board = []

    while True:
        # Update round state
        round = history.get_round()
        board = []
        clustering = hc5 if current_player == 0 else hc6
        if round >= 1: board += flop
        if round >= 2: board.append(turn)
        if round >= 3: board.append(river)

        history.clear_clusters()
        history.add_cluster(clustering.get_preflop_cluster(cards[current_player]))
        if round >= 1:
            eval_f = evaluator.evaluate(cards[current_player], flop)
            history.add_cluster(clustering.get_flop_cluster(eval_f))
        if round >= 2:
            eval_t = evaluator.evaluate(cards[current_player], flop + [turn])
            history.add_cluster(clustering.get_turn_cluster(eval_t))
        if round >= 3:
            eval_r = evaluator.evaluate(cards[current_player], flop + [turn, river])
            history.add_cluster(clustering.get_river_cluster(eval_r))

        info_set_key = history.key()
        model = cfr_player0 if current_player == 0 else cfr_player1
        if info_set_key not in model.node_map:
            node = holdem.HoldemNode(info_set_key, 3)
            model.node_map[info_set_key] = node
        node = model.node_map[info_set_key]

        # Terminal state?
        if node.is_terminal(history):
            return node.get_terminal_utility(history, cards, board, 0)

        # Chance node (advance round)
        if node.is_chance_node(history):
            history.increment_round()
            continue

        strategy = node.get_average_strategy()
        strategy = [max(s, 0.0) for s in strategy]  # ensure no negatives
        total = sum(strategy)
        if total > 0:
            strategy = [s / total for s in strategy]
        else:
            strategy = [1.0 / 3] * 3

        # Choose action
        action = random.choices(range(3), weights=strategy)[0]

        # Only allow 2 raises/bets
        if history.get_history().count('b') >= 2 and action == 1:
            action = 0  # force to 'p'

        # Pot handling
        amount = 0
        if action==0 and (history.get_history() == "" or history.get_history() == "p"):
            amount= 0
        elif action == 0 or (action == 1 and (history.get_history() == "" or history.get_history() == "p")):
            amount = 1
        elif action == 1:
            amount = 2
        history.set_history(history.get_history() + model.action_map[action])
        if action != 2:
            history.add_to_pot(current_player, amount)

        current_player = 1 - current_player

def evaluate_models(cfr5, cfr6, hc5, hc6, num_games=10000):
    results = {"cfr5_win": 0, "cfr6_win": 0, "tie": 0, "total": 0}
    for i in range(num_games):
        result = play_hand(cfr5, cfr6, hc5, hc6)
        if result > 0:
            results["cfr5_win"] += 1
        elif result < 0:
            results["cfr6_win"] += 1
        else:
            results["tie"] += 1
        results["total"] += 1
        if (i + 1) % 1000 == 0:
            print(f"Played {i+1} games")
    return results

hc5 = evaluator.HandClustering()
hc6 = evaluator.HandClustering()
print("Building lookup tables...")
hc5.build_preflop_table(20000, 5)
hc6.build_preflop_table(20000, 6)
print("Building preflop table finished.")
hc5.build_flop_table(20000, 5)
hc6.build_flop_table(20000, 6)
print("Building flop table finished.")
hc5.build_turn_table(20000, 5)
hc6.build_turn_table(20000, 6)
print("Building turn table finished.")
hc5.build_river_table(20000, 5)
hc6.build_river_table(20000, 6)
print("Building river table finished.")

cfr5 = holdem.HoldemCFR(3, hc5, action_map={0: 'p', 1: 'b', 2: 'f'}, node_map=holdem.load_node_map("with_antes_5.parquet", 3))
cfr6 = holdem.HoldemCFR(3, hc6, action_map={0: 'p', 1: 'b', 2: 'f'}, node_map=holdem.load_node_map("with_antes_6.parquet", 3))

results = evaluate_models(cfr5, cfr6, hc5, hc6, num_games=100000)
print("Evaluation Results:", results)