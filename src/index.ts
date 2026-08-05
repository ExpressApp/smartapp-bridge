import { PLATFORM } from './lib/constants'
import getPlatform from './lib/platformDetector'
import AndroidBridge from './lib/platforms/android'
import AuroraBridge from './lib/platforms/aurora'
import IosBridge from './lib/platforms/ios'
import WebBridge from './lib/platforms/web'
import { Bridge } from './types/bridgeInterface'
import { LIB_VERSION } from './version'

const getBridge = (): Bridge | null => {
  if (process.env.NODE_ENV === 'test') return null

  const platform = getPlatform()
  console.log('Bridge ~ version', LIB_VERSION)

  switch (platform) {
    case PLATFORM.ANDROID:
      return new AndroidBridge()
    case PLATFORM.AURORA:
      return new AuroraBridge()
    case PLATFORM.IOS:
      return new IosBridge()
    case PLATFORM.WEB:
      return new WebBridge()
    default:
      console.error('Wrong platform')
      break
  }

  return null
}

export default getBridge()
