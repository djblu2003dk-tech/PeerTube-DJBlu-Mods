import videojs from 'video.js'
import { ChromecastButtonOptions, VideojsButton, VideojsButtonOptions, VideojsPlayer } from '../../types'
import { loadCastSdk } from '../casting/cast-sdk-loader'

const Button = videojs.getComponent('Button') as typeof VideojsButton

type CastFramework = {
  CastContext: { getInstance: () => CastContext }
  CastContextEventType: { CAST_STATE_CHANGED: string }
  CastState: { NO_DEVICES_AVAILABLE: string, CONNECTED: string }
}

type CastContext = {
  setOptions: (options: { receiverApplicationId: string, autoJoinPolicy: string }) => void
  getCastState: () => string
  addEventListener: (event: string, handler: (event: { castState: string }) => void) => void
  requestSession: () => Promise<any>
  endCurrentSession: (stopCasting: boolean) => void
}

type ChromeCastNamespace = {
  cast: {
    media: {
      DEFAULT_MEDIA_RECEIVER_APP_ID: string
      StreamType: { LIVE: string, BUFFERED: string }
      MediaInfo: new (src: string, type: string) => any
      LoadRequest: new (mediaInfo: any) => any
      GenericMediaMetadata: new () => any
      Image: new (url: string) => any
    }
    AutoJoinPolicy: { ORIGIN_SCOPED: string }
  }
}

class ChromecastButton extends Button {
  declare private chromecastButtonOptions: ChromecastButtonOptions
  private castContext: CastContext | null = null
  private castFramework: CastFramework | null = null
  private chromeCastNamespace: ChromeCastNamespace['cast'] | null = null
  private castListenerRegistered = false
  private isRequestingSession = false

  constructor (player: VideojsPlayer, options: ChromecastButtonOptions & VideojsButtonOptions) {
    super(player, options)

    this.chromecastButtonOptions = options
    this.controlText('Cast')

    this.updateShowing()
    this.player().on('video-change', () => this.updateShowing())

    this.initializeCast()
  }

  buildCSSClass () {
    return `vjs-chromecast-button ${super.buildCSSClass()}`
  }

  async handleClick () {
    const castContext = await this.ensureCastContext()
    if (!castContext || !this.castFramework || !this.chromeCastNamespace) return

    const castState = castContext.getCastState()
    if (castState === this.castFramework.CastState.CONNECTED) {
      castContext.endCurrentSession(true)
      return
    }

    if (this.isRequestingSession) return
    this.isRequestingSession = true

    const source = await this.chromecastButtonOptions.getCastSource()
    if (!source) {
      this.isRequestingSession = false
      return
    }

    try {
      // eslint-disable-next-line no-console
      console.warn('Chromecast button clicked')

      const existingSession = (castContext as any).getCurrentSession?.()
      if (!existingSession) await castContext.requestSession()

      const session = (castContext as any).getCurrentSession?.() || existingSession
      if (!session) return
      if (!session) return

      if (typeof session.addUpdateListener === 'function') {
        session.addUpdateListener((isAlive: boolean) => {
          // eslint-disable-next-line no-console
          console.warn('Chromecast session update', { isAlive })
        })
      }

      const cast = this.chromeCastNamespace
      const contentType = source.type || 'application/vnd.apple.mpegurl'
      const mediaInfo = new cast.media.MediaInfo(source.src, contentType)

      mediaInfo.streamType = source.isLive ? cast.media.StreamType.LIVE : cast.media.StreamType.BUFFERED

      const metadata = new cast.media.GenericMediaMetadata()
      metadata.title = this.chromecastButtonOptions.getCastTitle()

      const poster = this.chromecastButtonOptions.getCastPoster()
      if (poster) {
        const ImageCtor = (cast.media as any).Image
        metadata.images = ImageCtor ? [ new ImageCtor(poster) ] : [ { url: poster } ]
      }
      mediaInfo.metadata = metadata

      if (source.type?.includes('mpegurl')) {
        const hlsSegmentFormat = (cast.media as any).HlsSegmentFormat?.TS
        const hlsVideoSegmentFormat = (cast.media as any).HlsVideoSegmentFormat?.TS
        if (hlsSegmentFormat) mediaInfo.hlsSegmentFormat = hlsSegmentFormat
        if (hlsVideoSegmentFormat) mediaInfo.hlsVideoSegmentFormat = hlsVideoSegmentFormat
      }

      const request = new cast.media.LoadRequest(mediaInfo)
      request.autoplay = true

      if (!source.isLive) {
        const startAt = Math.max(0, Math.floor(this.player_.currentTime?.() ?? 0))
        if (startAt > 0) request.currentTime = startAt
      }

      await session.loadMedia(request)
      this.player_.pause()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Chromecast load failed', {
        error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        description: (error as any)?.description,
        details: (error as any)?.details,
        cause: (error as any)?.cause
      })
    } finally {
      this.isRequestingSession = false
    }
  }

  private async initializeCast () {
    const castContext = await this.ensureCastContext()
    if (!castContext || !this.castFramework) return
    this.updateCastState(castContext.getCastState())
  }

  private async ensureCastContext () {
    if (this.castContext) return this.castContext

    const available = await loadCastSdk()
    if (!available) return null

    const win = window as typeof window & { cast?: { framework?: CastFramework }, chrome?: ChromeCastNamespace }
    if (!win.cast?.framework || !win.chrome?.cast) return null

    this.castFramework = win.cast.framework
    this.chromeCastNamespace = win.chrome.cast

    this.castContext = this.castFramework.CastContext.getInstance()
    this.castContext.setOptions({
      receiverApplicationId: this.chromeCastNamespace.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
      autoJoinPolicy: this.chromeCastNamespace.AutoJoinPolicy.ORIGIN_SCOPED
    })

    if (!this.castListenerRegistered) {
      this.castListenerRegistered = true
      this.castContext.addEventListener(
        this.castFramework.CastContextEventType.CAST_STATE_CHANGED,
        event => this.updateCastState(event.castState)
      )
    }

    return this.castContext
  }

  private updateCastState (castState: string) {
    if (!this.castFramework) return
    if (!this.el()) return

    if (castState === this.castFramework.CastState.NO_DEVICES_AVAILABLE) {
      this.addClass('vjs-hidden')
      this.disable()
    } else {
      this.removeClass('vjs-hidden')
      this.enable()
    }

    if (castState === this.castFramework.CastState.CONNECTED) {
      this.addClass('vjs-chromecast-casting-state')
      this.controlText('Stop casting')
    } else {
      this.removeClass('vjs-chromecast-casting-state')
      this.controlText('Cast')
    }
  }

  private updateShowing () {
    if (this.chromecastButtonOptions.isDisplayed()) this.show()
    else this.hide()
  }
}

videojs.registerComponent('ChromecastButton', ChromecastButton)

export { ChromecastButton }
