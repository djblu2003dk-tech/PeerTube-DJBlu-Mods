import videojs from 'video.js'
import { ProgressBarMarkerComponentOptions, VideojsClickableComponent, VideojsClickableComponentOptions, VideojsPlayer } from '../../types'

const ClickableComponent = videojs.getComponent('ClickableComponent') as typeof VideojsClickableComponent

export class ProgressBarMarkerComponent extends ClickableComponent {
  declare options_: ProgressBarMarkerComponentOptions & VideojsClickableComponentOptions

  constructor (player: VideojsPlayer, options?: ProgressBarMarkerComponentOptions & VideojsClickableComponentOptions) {
    super(player, options)

    const updateMarker = () => {
      if (!this.hasValidDuration()) return

      const el = this.el() as HTMLElement

      const left = this.buildLeftStyle()

      if (left === null) {
        el.style.setProperty('display', 'none')
        return
      }

      el.style.setProperty('left', left)
      el.style.setProperty('display', 'inline')
    }
    this.player().on('durationchange', updateMarker)
    this.player().on('timeupdate', updateMarker)

    const stopPropagation = (event: Event) => event.stopPropagation()

    this.on([ 'mousedown', 'touchstart' ], stopPropagation)

    this.one('dispose', () => {
      if (this.player()) {
        this.player().off('durationchange', updateMarker)
        this.player().off('timeupdate', updateMarker)
      }

      if (this.el()) {
        this.off([ 'mousedown', 'touchstart' ], stopPropagation)
      }
    })
  }

  createEl () {
    return videojs.dom.createEl('span', {
      className: this.options_.className || 'vjs-chapter-marker',
      title: this.options_.title || undefined,
      'data-type': this.options_.dataType || undefined,
      style: this.hasValidDuration() && this.buildLeftStyle() !== null
        ? `left: ${this.buildLeftStyle()}`
        : 'display: none;'
    }) as HTMLButtonElement
  }

  handleClick (event: Event) {
    event.stopPropagation()

    const seekTime = this.options_.getSeekTimecode
      ? this.options_.getSeekTimecode()
      : this.options_.timecode

    if (this.player() && typeof seekTime === 'number' && !isNaN(seekTime)) {
      this.player().currentTime(seekTime)
    }
  }

  private buildLeftStyle () {
    if (!this.player()) return null

    const timecode = this.options_.getTimecode
      ? this.options_.getTimecode()
      : this.options_.timecode

    if (timecode === undefined || timecode === null || isNaN(timecode)) return null

    const duration = this.player().duration()
    if (isNaN(duration) || !duration) return null

    if (timecode < 0 || timecode > duration) return null

    return `${(timecode / duration) * 100}%`
  }

  private hasValidDuration () {
    const duration = this.player().duration()

    if (isNaN(duration) || !duration) return false

    return true
  }
}

videojs.registerComponent('ProgressBarMarkerComponent', ProgressBarMarkerComponent)
