import {
  NextPreviousVideoButtonOptions,
  PeerTubeLinkButtonOptions,
  PeerTubePlayerConstructorOptions,
  PeerTubePlayerLoadOptions,
  PopoutButtonOptions,
  EventMarkersToggleButtonOptions,
  ChromecastButtonOptions,
  AirPlayButtonOptions,
  TheaterButtonOptions
} from '../../types'

type ControlBarOptionsBuilderConstructorOptions =
  & Pick<PeerTubePlayerConstructorOptions, 'peertubeLink' | 'instanceName' | 'theaterButton' | 'popoutButton'>
  & {
    videoShortUUID: () => string
    p2pEnabled: () => boolean
    embedUrl: () => string
    eventMarkersToggleButton: () => boolean
    eventMarkersToggleButtonDefaultHidden?: () => boolean
    getCastSource: ChromecastButtonOptions['getCastSource']
    getCastTitle: ChromecastButtonOptions['getCastTitle']
    getCastPoster: ChromecastButtonOptions['getCastPoster']
    chromecastButton: () => boolean
    airPlayButton: () => boolean

    previousVideo: () => PeerTubePlayerLoadOptions['previousVideo']
    nextVideo: () => PeerTubePlayerLoadOptions['nextVideo']
  }

export class ControlBarOptionsBuilder {
  constructor (private options: ControlBarOptionsBuilderConstructorOptions) {
  }

  getChildrenOptions () {
    const children = {
      ...this.getPreviousVideo(),

      playToggle: {},

      ...this.getNextVideo(),

      ...this.getTimeControls(),

      ...this.getProgressControl(),

      p2PInfoButton: {},

      volumePanel: {
        inline: false
      },

      captionToggleButton: {},

      ...this.getSettingsButton(),

      ...this.getCastButtons(),

      ...this.getPeerTubeLinkButton(),

      ...this.getPopoutButton(),

      ...this.getTheaterButton(),

      fullscreenToggle: {}
    }

    return children
  }

  private getSettingsButton () {
    const settingEntries: string[] = []

    settingEntries.push('playbackRateMenuButton')
    settingEntries.push('captionsButton')
    settingEntries.push('resolutionMenuButton')

    return {
      settingsButton: {
        setup: {
          maxHeightOffset: 60
        },
        entries: settingEntries
      }
    }
  }

  private getTimeControls () {
    return {
      peerTubeLiveDisplay: {},
      eventMarkersToggleButton: this.getEventMarkersToggleButtonOptions(),

      currentTimeDisplay: {},
      timeDivider: {},
      durationDisplay: {}
    }
  }

  private getCastButtons () {
    const buttons: Record<string, object> = {}

    if (this.options.chromecastButton()) {
      const options: ChromecastButtonOptions = {
        isDisplayed: () => this.options.chromecastButton(),
        getCastSource: this.options.getCastSource,
        getCastTitle: this.options.getCastTitle,
        getCastPoster: this.options.getCastPoster
      }

      buttons.chromecastButton = options
    }

    if (this.options.airPlayButton()) {
      const options: AirPlayButtonOptions = {
        isDisplayed: () => this.options.airPlayButton()
      }

      buttons.airPlayButton = options
    }

    return buttons
  }

  private getProgressControl () {
    return {
      progressControl: {
        children: {
          seekBar: {
            children: [ 'loadProgressBar', 'playProgressBar' ]
          }
        }
      }
    }
  }

  private getPreviousVideo () {
    const buttonOptions: NextPreviousVideoButtonOptions = {
      type: 'previous',
      handler: () => this.options.previousVideo().handler(),
      isDisabled: () => !this.options.previousVideo().enabled,
      isDisplayed: () => this.options.previousVideo().displayControlBarButton
    }

    return { previousVideoButton: buttonOptions }
  }

  private getNextVideo () {
    const buttonOptions: NextPreviousVideoButtonOptions = {
      type: 'next',
      handler: () => this.options.nextVideo().handler(),
      isDisabled: () => !this.options.nextVideo().enabled,
      isDisplayed: () => this.options.nextVideo().displayControlBarButton
    }

    return { nextVideoButton: buttonOptions }
  }

  private getPeerTubeLinkButton () {
    const options: PeerTubeLinkButtonOptions = {
      isDisplayed: this.options.peertubeLink,
      shortUUID: this.options.videoShortUUID,
      instanceName: this.options.instanceName
    }

    return { peerTubeLinkButton: options }
  }

  private getTheaterButton () {
    const options: TheaterButtonOptions = {
      isDisplayed: () => this.options.theaterButton
    }

    return {
      theaterButton: options
    }
  }

  private getPopoutButton () {
    const options: PopoutButtonOptions = {
      isDisplayed: () => this.options.popoutButton,
      embedUrl: this.options.embedUrl
    }

    return {
      popoutButton: options
    }
  }

  private getEventMarkersToggleButtonOptions () {
    const options: EventMarkersToggleButtonOptions = {
      isDisplayed: () => this.options.eventMarkersToggleButton(),
      defaultHidden: this.options.eventMarkersToggleButtonDefaultHidden?.()
    }

    return options
  }
}
