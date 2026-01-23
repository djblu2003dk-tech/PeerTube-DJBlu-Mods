import { VideoEventMarkerType } from './video-event-marker-type.enum.js'

export interface VideoEventMarker {
  id: number
  timecode: number
  type: VideoEventMarkerType
  label?: string
}
