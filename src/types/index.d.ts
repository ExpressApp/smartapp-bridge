export * from './eventEmitter'
export * from './bridgeInterface'
declare global {
  interface Window {
    // Android interface
    handleAndroidEvent: Function
    express: {
      handleSmartAppEvent: (json: string) => void
    }

    // iOS interface
    handleIosEvent: Function
    webkit: {
      messageHandlers: {
        express: {
          postMessage: (data: object) => void
        }
      }
    }

    // Aurora interface
    handleAuroraEvent: Function
    sendAsyncMessage?: (type: string, event: object | string) => void
  }
}
