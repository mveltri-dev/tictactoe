export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar?: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
  rank: number;
}
