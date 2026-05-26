export const REACTION_TYPES = {
  fire: "🔥",
  clown: "🤡",
  crying: "😭",
  trophy: "🏆",
  goat: "🐐",
  shocked: "😱",
  laughing: "😂",
  thumbs_up: "👍",
} as const;

export type ReactionType = keyof typeof REACTION_TYPES;
