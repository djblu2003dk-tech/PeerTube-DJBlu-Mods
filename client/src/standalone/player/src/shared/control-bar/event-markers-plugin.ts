import { VideoEventMarker, VideoEventMarkerType } from '@peertube/peertube-models'
import videojs from 'video.js'
import { EventMarkersOptions, VideojsPlayer, VideojsPlugin } from '../../types'
import { ProgressBarMarkerComponent } from './progress-bar-marker-component'

const Plugin = videojs.getPlugin('plugin') as typeof VideojsPlugin

const EVENT_LABELS: Record<VideoEventMarkerType, string> = {
  'kickoff': 'Kick off',
  'goal': 'Goal',
  'penalty': 'Penalty',
  'half-time': 'Half-time',
  'red-card': 'Red card',
  'yellow-card': 'Yellow card',
  'full-time': 'Full-time'
}

class EventMarkersPlugin extends Plugin {
  declare private markers: VideoEventMarker[]
  declare private markerComponents: ProgressBarMarkerComponent[]

  private liveStartAt?: string
  private isLive = false
  private isLiveDvr = false

  constructor (player: VideojsPlayer, options: EventMarkersOptions) {
    super(player)

    this.markerComponents = []
    this.setOptions(options)

    this.player.ready(() => {
      this.player.addClass('vjs-event-markers')
      this.renderMarkers()
    })
  }

  setMarkers (options: EventMarkersOptions) {
    this.disposeMarkers()
    this.setOptions(options)
    this.renderMarkers()
  }

  dispose () {
    this.disposeMarkers()
    super.dispose()
  }

  private setOptions (options: EventMarkersOptions) {
    this.markers = options.markers || []
    this.liveStartAt = options.liveStartAt
    this.isLive = options.isLive
    this.isLiveDvr = options.isLiveDvr
  }

  private renderMarkers () {
    const seekBar = this.getSeekBar()
    if (!seekBar) return

    for (const marker of this.markers) {
      const markerComponent = new ProgressBarMarkerComponent(this.player, {
        timecode: marker.timecode,
        className: `vjs-event-marker vjs-event-marker-${marker.type}`,
        title: marker.label || EVENT_LABELS[marker.type] || '',
        dataType: marker.type,
        getTimecode: () => this.getDisplayTimecode(marker),
        getSeekTimecode: () => this.getDisplayTimecode(marker)
      })

      this.markerComponents.push(markerComponent)
      seekBar.addChild(markerComponent)
    }
  }

  private getDisplayTimecode (marker: VideoEventMarker) {
    const player = this.player
    if (!player) return marker.timecode
    if (!this.isLive || !this.isLiveDvr || !this.liveStartAt) return marker.timecode

    const liveStartMs = new Date(this.liveStartAt).getTime()
    if (isNaN(liveStartMs)) return marker.timecode

    const liveEdgeSeconds = (Date.now() - liveStartMs) / 1000
    const windowDuration = player.duration()
    if (isNaN(windowDuration) || windowDuration <= 0) return marker.timecode

    const windowStart = Math.max(0, liveEdgeSeconds - windowDuration)
    return marker.timecode - windowStart
  }

  private disposeMarkers () {
    const seekBar = this.getSeekBar()
    if (!seekBar) return

    for (const marker of this.markerComponents) {
      seekBar.removeChild(marker)
    }

    this.markerComponents = []
  }

  private getSeekBar () {
    return this.player.getDescendant('ControlBar', 'ProgressControl', 'SeekBar')
  }
}

videojs.registerPlugin('eventMarkers', EventMarkersPlugin)

export { EventMarkersPlugin }
