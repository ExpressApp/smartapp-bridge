export enum PLATFORM {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
  UNKNOWN = 'unknown',
}

export enum EVENT_TYPE {
  RECEIVE = 'recv',
  SEND = 'send',
}

export enum HANDLER {
  BOTX = 'botx',
  EXPRESS = 'express',
}

export const RESPONSE_TIMEOUT = 30000
export const SYNC_RESPONSE_TIMEOUT = 5000
export const WEB_COMMAND_TYPE = 'smartapp'
export const WEB_COMMAND_TYPE_RPC = 'smartapp_rpc'
export const WEB_COMMAND_TYPE_RPC_LOGS = 'smartAppLogs'
