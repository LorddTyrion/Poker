from deuces import Card
from deuces import Evaluator
from deuces import Deck
import numpy as np

def make_clusters(num_clusters, board_size):
    borders = []
    for i in range(10):
        print("Iteration {i} started")
        evals = []
        for j in range((i+1)*10000):
            deck = Deck()
            hand = deck.draw(2)
            board = deck.draw(board_size)
            evaluator = Evaluator()
            evals.append(evaluator.evaluate(hand, board))
        evals.sort()
        cluster_size = int(np.floor(len(evals) / num_clusters))
        cluster_borders = []        
        for cluster in range(num_clusters):
            if (cluster+1)*cluster_size < len(evals):
                cluster_borders.append(evals[(cluster+1)*cluster_size])
            else:
                cluster_borders.append(evals[-1])
        borders.append(cluster_borders)
    absolute_differences = []
    for i in range(len(borders)):
        if i == 0:
            continue
        diff = 0
        for j in range(len(borders[i])):
            diff += abs(borders[i][j] - borders[i-1][j])
        absolute_differences.append(diff)
    
    return absolute_differences

print(make_clusters(5, 3))


