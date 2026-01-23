import { VideoEventMarkerType } from './video-event-marker-type.enum.js'

export interface VideoEventMarkerUpdate {
  timecode?: number
  type?: VideoEventMarkerType
  label?: string | null
}
