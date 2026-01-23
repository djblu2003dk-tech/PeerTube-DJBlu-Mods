import videojs from 'video.js'
import { EventMarkersToggleButtonOptions, VideojsButton, VideojsButtonOptions, VideojsPlayer } from '../../types'

const Button = videojs.getComponent('Button') as typeof VideojsButton

class EventMarkersToggleButton extends Button {
  private static readonly HIDDEN_CLASS = 'vjs-event-markers-hidden'
  private static readonly OFF_CLASS = 'vjs-event-markers-toggle-off'

  declare private toggleOptions: EventMarkersToggleButtonOptions

  constructor (player: VideojsPlayer, options: EventMarkersToggleButtonOptions & VideojsButtonOptions) {
    super(player, options)

    this.toggleOptions = options
    if (this.toggleOptions.defaultHidden) {
      this.player_.addClass(EventMarkersToggleButton.HIDDEN_CLASS)
      const controlBarEl = this.player_.controlBar?.el?.()
      if (controlBarEl) controlBarEl.classList.add(EventMarkersToggleButton.HIDDEN_CLASS)
    }

    this.updateState()
    this.updateShowing()

    this.player().on('video-change', () => this.updateShowing())
  }

  buildCSSClass () {
    return `vjs-event-markers-toggle ${super.buildCSSClass()}`
  }

  handleClick () {
    const isHidden = this.player_.hasClass(EventMarkersToggleButton.HIDDEN_CLASS)
    if (isHidden) {
      this.player_.removeClass(EventMarkersToggleButton.HIDDEN_CLASS)
    } else {
      this.player_.addClass(EventMarkersToggleButton.HIDDEN_CLASS)
    }

    // Keep control bar styles in sync for nested selectors
    const controlBarEl = this.player_.controlBar?.el?.()
    if (controlBarEl) {
      if (isHidden) controlBarEl.classList.remove(EventMarkersToggleButton.HIDDEN_CLASS)
      else controlBarEl.classList.add(EventMarkersToggleButton.HIDDEN_CLASS)
    }

    this.updateState()
  }

  private updateState () {
    const hidden = this.player_.hasClass(EventMarkersToggleButton.HIDDEN_CLASS)

    if (hidden) {
      this.addClass(EventMarkersToggleButton.OFF_CLASS)
      this.controlText('Show event markers')
    } else {
      this.removeClass(EventMarkersToggleButton.OFF_CLASS)
      this.controlText('Hide event markers')
    }
  }

  private updateShowing () {
    if (this.toggleOptions.isDisplayed()) this.show()
    else this.hide()
  }
}

videojs.registerComponent('EventMarkersToggleButton', EventMarkersToggleButton)

export { EventMarkersToggleButton }
