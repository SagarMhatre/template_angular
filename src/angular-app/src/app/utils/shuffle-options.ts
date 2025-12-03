export type QuestionOption = { text: string; score: number };

export function shuffleOptions<T extends QuestionOption>(options?: T[]): T[] | undefined {
  if (!options?.length) {
    return options;
  }

  const copy = [...options];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
