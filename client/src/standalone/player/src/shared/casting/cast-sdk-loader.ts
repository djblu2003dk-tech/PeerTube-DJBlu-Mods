const CAST_SDK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'

let loadPromise: Promise<boolean> | null = null

function isCastAvailable () {
  const win = window as typeof window & { cast?: any, chrome?: any }
  return !!(win.cast?.framework || win.chrome?.cast?.isAvailable)
}

export function loadCastSdk (): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (isCastAvailable()) return Promise.resolve(true)
  if (loadPromise) return loadPromise

  loadPromise = new Promise(resolve => {
    const win = window as typeof window & { __onGCastApiAvailable?: (isAvailable: boolean) => void }

    const previousHandler = win.__onGCastApiAvailable
    win.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (typeof previousHandler === 'function') previousHandler(isAvailable)
      resolve(!!isAvailable)
    }

    const existingScript = document.querySelector(`script[src="${CAST_SDK_URL}"]`) as HTMLScriptElement
    if (existingScript) return

    const script = document.createElement('script')
    script.src = CAST_SDK_URL
    script.async = true
    script.defer = true
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })

  return loadPromise
}
