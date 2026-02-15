import { VideoEventMarkerType } from '@peertube/peertube-models'
import { exists, isArray } from './misc.js'

const ALLOWED_TYPES = new Set<string>(Object.values(VideoEventMarkerType))

export function isEventMarkerTypeValid (value: any) {
  if (!exists(value)) return false
  return ALLOWED_TYPES.has(value)
}

export function isEventMarkerTimecodeValid (value: any) {
  if (!exists(value)) return false
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (value < 0) return false
  return true
}

export function isEventMarkerLabelValid (value: any) {
  if (!exists(value)) return true
  if (typeof value !== 'string') return false
  if (value.length > 200) return false
  return true
}

export function isEventMarkerExternalIdValid (value: any) {
  if (!exists(value)) return true
  if (typeof value !== 'string') return false
  if (value.length > 200) return false
  return true
}

export function areEventMarkersValid (markers: any) {
  if (!isArray(markers)) return false

  return markers.every(m =>
    isEventMarkerTimecodeValid(m?.timecode) &&
    isEventMarkerTypeValid(m?.type) &&
    isEventMarkerLabelValid(m?.label)
  )
}
