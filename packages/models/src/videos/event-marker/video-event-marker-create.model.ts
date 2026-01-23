import { VideoEventMarkerType } from './video-event-marker-type.enum.js'

export interface VideoEventMarkerCreate {
  timecode: number
  type: VideoEventMarkerType
  label?: string
}
