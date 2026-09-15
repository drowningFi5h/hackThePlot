const calculateScore = (p: number, k: number, n: number): number => {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += 1 / i;
  }
  return p / (k * sum);
};

export default calculateScore;
