import { v4 as uuid } from 'uuid'

import {
  Bridge,
  BridgeSendBotEventParams,
  BridgeSendClientEventParams,
  BridgeSendEventParams,
  EventEmitterCallback,
} from '../../types'
import { camelCaseToSnakeCase, snakeCaseToCamelCase } from '../case'
import {
  EVENT_TYPE,
  HANDLER,
  RESPONSE_TIMEOUT,
  SYNC_RESPONSE_TIMEOUT,
  WEB_COMMAND_TYPE,
  WEB_COMMAND_TYPE_RPC,
  WEB_COMMAND_TYPE_RPC_LOGS,
} from '../constants'
import ExtendedEventEmitter from '../eventEmitter'

class WebBridge implements Bridge {
  private readonly eventEmitter: ExtendedEventEmitter
  logsEnabled: boolean
  isRenameParamsEnabledForBotx: boolean

  constructor() {
    this.eventEmitter = new ExtendedEventEmitter()
    this.addGlobalListener()
    this.logsEnabled = false
    this.isRenameParamsEnabledForBotx = true
  }

  addGlobalListener() {
    window.addEventListener('message', (event: MessageEvent): void => {
      if (
          typeof event.data !== 'object' ||
          typeof event.data.data !== 'object' ||
          typeof event.data.data.type !== 'string'
      )
        return

      const {
        ref,
        data: { type, ...payload },
        files,
      } = event.data

      const isRenameParamsEnabled = this.isRenameParamsEnabledForBotx // TODO fix when handler is passed

      if (this.logsEnabled) console.log('Bridge ~ Incoming event', event.data)

      const emitterType = ref || EVENT_TYPE.RECEIVE

      const eventFiles = isRenameParamsEnabled ?
          files?.map((file: any) => snakeCaseToCamelCase(file)) : files

      this.eventEmitter.emit(emitterType, {
        ref,
        type,
        payload: this.isRenameParamsEnabledForBotx ? snakeCaseToCamelCase(payload) : payload,
        files: eventFiles,
      })
    })
  }

  /**
   * Set callback function to handle events without **ref**
   * (notifications for example).
   *
   * ```js
   * bridge.onReceive(({ type, handler, payload }) => {
   *   // Handle event data
   *   console.log('event', type, handler, payload)
   * })
   * ```
   */
  onReceive(callback: EventEmitterCallback) {
    this.eventEmitter.on(EVENT_TYPE.RECEIVE, callback)
  }

  private sendEvent(
      {
        handler,
        method,
        params,
        files,
        timeout = RESPONSE_TIMEOUT,
        guaranteed_delivery_required = false,
        sync_request = false,
        sync_request_timeout = SYNC_RESPONSE_TIMEOUT,
      }: BridgeSendEventParams,
  ) {
    const isRenameParamsEnabled = handler === HANDLER.BOTX ? this.isRenameParamsEnabledForBotx : false

    const ref = uuid() // UUID to detect express response.
    const payload = {
      ref,
      type: WEB_COMMAND_TYPE_RPC,
      method,
      handler,
      payload: isRenameParamsEnabled ? camelCaseToSnakeCase(params) : params,
      guaranteed_delivery_required,
      sync_request,
      sync_request_timeout,
    }

    const eventFiles = isRenameParamsEnabled ?
        files?.map((file: any) => camelCaseToSnakeCase(file)) : files

    const event = files ? { ...payload, files: eventFiles } : payload

    if (this.logsEnabled) console.log('Bridge ~ Outgoing event', event)

    window.parent.postMessage(
        {
          type: WEB_COMMAND_TYPE,
          payload: event,
        },
        '*',
    )

    return this.eventEmitter.onceWithTimeout(ref, timeout)
  }

  /**
   * Send event and wait response from express client.
   *
   * ```js
   * bridge
   *   .sendClientEvent(
   *     {
   *       method: 'get_weather',
   *       params: {
   *         city: 'Moscow',
   *       },
   *     }
   *   )
   *   .then(data => {
   *     // Handle response
   *     console.log('response', data)
   *   })
   * ```
   */
  sendBotEvent(
      {
        method,
        params,
        files,
        timeout,
        guaranteed_delivery_required,
        sync_request,
        sync_request_timeout,
      }: BridgeSendBotEventParams,
  ) {
    return this.sendEvent({
      handler: HANDLER.BOTX,
      method,
      params,
      files,
      timeout,
      guaranteed_delivery_required,
      sync_request,
      sync_request_timeout,
    })
  }

  /**
   * Send event and wait response from express client.
   *
   * ```js
   * bridge
   *   .sendClientEvent(
   *     {
   *       method: 'get_weather',
   *       params: {
   *         city: 'Moscow',
   *       },
   *     }
   *   )
   *   .then(data => {
   *     // Handle response
   *     console.log('response', data)
   *   })
   * ```
   */
  sendClientEvent(
      { method, params, timeout }: BridgeSendClientEventParams,
  ) {
    return this.sendEvent(
        {
          handler: HANDLER.EXPRESS,
          method,
          params,
          timeout,
        },
    )
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
    const _log = console.log

    console.log = function(...rest: unknown[]) {
      window.parent.postMessage(
          {
            type: WEB_COMMAND_TYPE_RPC_LOGS,
            payload: rest,
          },
          '*',
      )

      _log.apply(console, rest)
    }
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
   * Enabling renaming event params from camelCase to snake_case and vice versa
   * ```js
   * bridge
   *    .enableRenameParams()
   * ```
   */
  enableRenameParams() {
    this.isRenameParamsEnabledForBotx = true
    console.log('Bridge ~ Enabled renaming event params from camelCase to snake_case and vice versa')
  }

  /**
   * Enabling renaming event params from camelCase to snake_case and vice versa
   * ```js
   * bridge
   *    .disableRenameParams()
   * ```
   */
  disableRenameParams() {
    this.isRenameParamsEnabledForBotx = false
    console.log('Bridge ~ Disabled renaming event params from camelCase to snake_case and vice versa')
  }
}

export default WebBridge
