export class Random {
  private static pools: number[][] = [];
  private static poolItemIdx: number = -1;

  public static newPool() {
    Random.pools.push([]);
    Random.poolItemIdx = -1;
  }

  public static resetPool() {
    Random.poolItemIdx = Random.pools.length > 0 && Random.pools[Random.pools.length - 1].length > 0 ? 0 : -1;
  }

  public static next(): number {
    if (Random.pools.length > 0) {
      if (Random.poolItemIdx >= 0 && Random.poolItemIdx < Random.pools[Random.pools.length - 1].length) {
        return Random.pools[Random.pools.length - 1][Random.poolItemIdx++];
      } else {
        const nextRand = Math.random();
        Random.pools[Random.pools.length - 1].push(nextRand);
        Random.poolItemIdx = Random.pools[Random.pools.length - 1].length;
        return nextRand;
      }
    }
    Random.newPool();
    return Random.next();
  }
}
