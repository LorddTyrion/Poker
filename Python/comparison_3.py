import random
import deuces
import holdem_3 as holdem
import evaluator
from rule_based_models import RuleBasedModel, RuleBasedNode

def play_hand(cfr_players: list, clustering):
    deck = deuces.Deck()
    cards = [deck.draw(2) for i in range(len(cfr_players))]
    flop = deck.draw(3)
    turn, river = deck.draw(2)

    history = holdem.HoldemInfoSet(len(cfr_players))
    evaluator = deuces.Evaluator()

    round = 0
    current_player = 0
    board = []

    while True:
        # Update round state
        round = history.get_round()
        history.set_player_id(current_player)
        board = []
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
        model = cfr_players[current_player]

        
        if isinstance(model, RuleBasedModel):
            node = RuleBasedNode(info_set_key, model.strategy)
        elif info_set_key not in model.node_map:
            node = holdem.HoldemNode(info_set_key, 3)
            model.node_map[info_set_key] = node
        else:
            node = model.node_map[info_set_key]

        # Terminal state?
        if node.is_terminal(history):
            return [node.get_terminal_utility(history, cards, board, i) for i in range(len(cfr_players))]

        # Chance node (advance round)
        if node.is_chance_node(history):
            history.increment_round()
            continue

        # Check if current player has already folded (across all rounds)
        all_history = ''.join(history.history)
        player_actions = all_history[current_player::len(cfr_players)]
        if 'f' in player_actions:
            # Player already folded, they auto-fold again
            history.set_history(history.get_history() + 'f')
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

        amount_bet = 0
        current_round_history = history.get_history()

        # Calculate current bet level and this player's contribution so far this round
        current_bet_level = 0
        player_contribution = [0] * len(cfr_players)
        
        for i, _action in enumerate(current_round_history):
                player = i % len(cfr_players)
                if _action == 'b':
                    if current_bet_level > 0:
                        # Raising: call current bet + raise by 1
                        amount_to_add = current_bet_level - player_contribution[player] + 1
                        player_contribution[player] += amount_to_add
                        current_bet_level += 1
                    else:
                        # Initial bet
                        player_contribution[player] += 1
                        current_bet_level = 1
                elif _action == 'p' and current_bet_level > 0:
                    # Calling
                    amount_to_call = current_bet_level - player_contribution[player]
                    player_contribution[player] += amount_to_call

        # Pot handling
        if action == 0:  # Pass (check or call)
            if current_bet_level > 0:
                amount_bet = current_bet_level - player_contribution[current_player]  # Call
            else:
                amount_bet = 0  # Check
        elif action == 1:  # Bet or raise
            if current_bet_level > 0:
                # Raising: need to call current bet + add 1 more
                current_bet_level += 1
                amount_bet = current_bet_level - player_contribution[current_player]
            else:
                # Initial bet
                current_bet_level = 1
                amount_bet = 1
        history.set_history(history.get_history() + model.action_map[action])
        if action != 2:
            history.add_to_pot(current_player, amount_bet)

        current_player = (current_player+1) % len (cfr_players)

def evaluate_models_by_sum(cfr_players: list, clustering, num_games=10000):
    results = [{f"player{i}_utility": 0} for i in range(len(cfr_players))]
    for i in range(num_games):
        result = play_hand(cfr_players, clustering)
        for j in range(len(cfr_players)):
            results[j][f"player{j}_utility"] += result[j]
        if (i + 1) % 1000 == 0:
            print(f"Played {i+1} games") 
    return results


hc = evaluator.HandClustering()

hc.load_tables()

action_map = {0: 'p', 1: 'b', 2: 'f'}

always_call_model = RuleBasedModel(
    action_map=action_map,
    strategy=[1.0, 0.0, 0.0]  # 100% call/check, 0% bet/raise, 0% fold
)

always_raise_model = RuleBasedModel(
    action_map=action_map,
    strategy=[0.0, 1.0, 0.0]  # 0% call/check, 100% bet/raise, 0% fold
)

cfr2 = holdem.HoldemCFR(3, hc, 3, action_map, node_map=holdem.load_node_map("3_players_2k.parquet", 3))
cfr5 = holdem.HoldemCFR(3, hc, 3,  action_map, node_map=holdem.load_node_map("3_players_5k.parquet", 3))
cfr10 = holdem.HoldemCFR(3, hc, 3, action_map, node_map=holdem.load_node_map("3_players_10k.parquet", 3))

cfr_against_calling_station = holdem.HoldemCFR(3, hc, 3, action_map, node_map=holdem.load_node_map("against_calling_machine_50k.parquet", 3))
cfr_against_maniac = holdem.HoldemCFR(3, hc, 3, action_map, node_map=holdem.load_node_map("anti_maniac_30k.parquet",3))


cfr_list = [cfr2, cfr5, cfr10]

result = evaluate_models_by_sum(cfr_list, hc, num_games=10000)
print("Evaluation Results:", result)

