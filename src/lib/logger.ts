import { BridgeSendBotEvent } from '../types'

const DATA_MASK = '***'
class Logger {
  logsEnabled: boolean
  private hideRecvLogPayload: Map<string, boolean>

  constructor() {
    this.logsEnabled = false
    this.hideRecvLogPayload = new Map<string, boolean>()
  }

  /** @ignore */
  alert(...args: ReadonlyArray<unknown>) {
    const text = args.map((arg: unknown): string => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ')
    alert(text)
  }

  /**
   * Enabling logs.
   *
   * ```js
   * bridge
   *   .enableLogs()
   * ```
   */
  enableLogs() {
    this.logsEnabled = true
  }

  /**
   * Disabling logs.
   *
   * ```js
   * bridge
   *   .disableLogs()
   * ```
   */
  disableLogs() {
    this.logsEnabled = false
  }

  /**
   * Log outgouing event
   * @param event Bridge event
   */
  logSendEvent(event: BridgeSendBotEvent) {
    this.hideRecvLogPayload.set(event.ref, !!event.hide_recv_event_data)

    if (!this.logsEnabled) return

    const logEvent = event.hide_send_event_data
      ? {
          ...event,
          payload: DATA_MASK,
        }
      : event

    console.log('Bridge ~ Outgoing event', JSON.stringify(logEvent, null, '  '))
  }

  logRecvEvent(event: { ref: string; data: object; files: [] }) {
    const hideRecvLogPayload = !!this.hideRecvLogPayload.get(event.ref)
    this.hideRecvLogPayload.delete(event.ref)

    if (!this.logsEnabled) return

    const logEvent = hideRecvLogPayload
      ? {
          ...event,
          data: DATA_MASK,
        }
      : event

    console.log('Bridge ~ Incoming event', JSON.stringify(logEvent, null, 2))
  }
}

export default Logger
