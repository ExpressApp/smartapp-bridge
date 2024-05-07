import { HANDLER } from '../lib/constants'

import { EmitterEventPayload, EventEmitterCallback } from './eventEmitter'

export type BridgeSendClientEventParams = {
  readonly method: string
  readonly params: object | undefined
  readonly timeout?: number
}

export type BridgeSendBotEventParams = BridgeSendClientEventParams & {
  readonly files?: any
  readonly guaranteed_delivery_required?: boolean | undefined
  readonly sync_request?: boolean
  readonly sync_request_timeout?: number
}

export type BridgeSendEventParams = BridgeSendClientEventParams &
  BridgeSendBotEventParams & {
  readonly handler: HANDLER
}

export type Bridge = {
  readonly onReceive: (callback: EventEmitterCallback) => void
  readonly sendBotEvent: (event: BridgeSendBotEventParams) => Promise<EmitterEventPayload>
  readonly sendClientEvent: (event: BridgeSendClientEventParams) => Promise<EmitterEventPayload>
  readonly disableRenameParams: () => void
  readonly enableRenameParams: () => void
  readonly enableLogs: () => void
  readonly disableLogs: () => void
  readonly log?: (data: string | object) => void
}
