// Type declarations for novnc-next
declare module 'novnc-next' {
  export default class RFB {
    constructor(
      target: HTMLElement,
      url: string,
      options?: {
        credentials?: { password?: string; username?: string }
        shared?: boolean
        repeaterID?: string
        wsProtocols?: string[]
      }
    )

    addEventListener(type: string, listener: (e: any) => void): void
    removeEventListener(type: string, listener: (e: any) => void): void
    disconnect(): void
    sendCredentials(credentials: { password?: string; username?: string }): void
    sendKey(keysym: number, code: string, down?: boolean): void
    sendCtrlAltDel(): void
    focus(): void
    blur(): void
    machineShutdown(): void
    machineReboot(): void
    machineReset(): void
    clipboardPasteFrom(text: string): void

    scaleViewport: boolean
    resizeSession: boolean
    showDotCursor: boolean
    background: string
    qualityLevel: number
    compressionLevel: number
    viewOnly: boolean
    clipViewport: boolean
    dragViewport: boolean
    focusOnClick: boolean
  }
}
