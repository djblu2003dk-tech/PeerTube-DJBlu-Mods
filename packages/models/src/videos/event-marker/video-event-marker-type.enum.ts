export const VideoEventMarkerType = {
  KICKOFF: 'kickoff',
  GOAL: 'goal',
  PENALTY: 'penalty',
  HALF_TIME: 'half-time',
  RED_CARD: 'red-card',
  YELLOW_CARD: 'yellow-card',
  FULL_TIME: 'full-time'
} as const

export type VideoEventMarkerType = typeof VideoEventMarkerType[keyof typeof VideoEventMarkerType]
