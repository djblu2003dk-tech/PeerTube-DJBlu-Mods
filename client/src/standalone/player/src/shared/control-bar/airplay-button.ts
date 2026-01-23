import videojs from 'video.js'
import { AirPlayButtonOptions, VideojsButton, VideojsButtonOptions, VideojsPlayer } from '../../types'

const Button = videojs.getComponent('Button') as typeof VideojsButton

class AirPlayButton extends Button {
  declare private airPlayButtonOptions: AirPlayButtonOptions

  constructor (player: VideojsPlayer, options: AirPlayButtonOptions & VideojsButtonOptions) {
    super(player, options)

    this.airPlayButtonOptions = options
    this.controlText('AirPlay')

    this.updateShowing()
    this.player().on('video-change', () => this.updateShowing())
    this.player().on('loadedmetadata', () => this.updateShowing())
  }

  buildCSSClass () {
    return `vjs-airplay-button ${super.buildCSSClass()}`
  }

  handleClick () {
    const video = this.getVideoElement()
    if (!video) return

    const webkitVideo = video as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }
    webkitVideo.webkitShowPlaybackTargetPicker?.()
  }

  private getVideoElement () {
    const video = this.player_.el()?.querySelector('video')
    return (video instanceof HTMLVideoElement) ? video : null
  }

  private isSupported () {
    const video = this.getVideoElement()
    if (!video) return false
    return typeof (video as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }).webkitShowPlaybackTargetPicker === 'function'
  }

  private updateShowing () {
    if (!this.airPlayButtonOptions.isDisplayed() || !this.isSupported()) {
      this.hide()
      return
    }

    this.show()
  }
}

videojs.registerComponent('AirPlayButton', AirPlayButton)

export { AirPlayButton }
