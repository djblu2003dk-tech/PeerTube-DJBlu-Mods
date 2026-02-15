import { exists } from './misc.js'

export function isEventMarkerSyncProviderValid (value: any) {
  if (!exists(value)) return false
  return value === 'api-football'
}

export function isEventMarkerSyncFixtureIdValid (value: any) {
  if (!exists(value)) return false
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128
}

export function isEventMarkerSyncKickoffTimeValid (value: any) {
  if (!exists(value)) return false
  if (typeof value !== 'string') return false
  return /^\d{2}:\d{2}$/.test(value)
}

export function isEventMarkerSyncKickoffTimecodeValid (value: any) {
  if (!exists(value)) return false
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (value < 0) return false
  return true
}

export function isEventMarkerSyncEnabledValid (value: any) {
  if (!exists(value)) return false
  return typeof value === 'boolean'
}
