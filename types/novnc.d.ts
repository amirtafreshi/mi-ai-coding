/**
 * Type declarations for noVNC RFB module
 * noVNC is a JavaScript VNC client library
 */

declare module '@novnc/novnc/lib/rfb.js' {
  export default class RFB {
    constructor(
      target: HTMLElement,
      url: string,
      options?: {
        shared?: boolean;
        credentials?: {
          username?: string;
          password?: string;
          target?: string;
        };
        repeaterID?: string;
        wsProtocols?: string[];
      }
    );

    addEventListener(event: string, callback: (e: any) => void): void;
    removeEventListener(event: string, callback: (e: any) => void): void;
    disconnect(): void;
    sendCredentials(credentials: { username?: string; password?: string; target?: string }): void;
    sendKey(keysym: number, code: string, down?: boolean): void;
    sendCtrlAltDel(): void;
    machineShutdown(): void;
    machineReboot(): void;
    machineReset(): void;
    clipboardPasteFrom(text: string): void;
    focus(): void;
    blur(): void;

    scaleViewport: boolean;
    resizeSession: boolean;
    showDotCursor: boolean;
    background: string;
    qualityLevel: number;
    compressionLevel: number;
    viewOnly: boolean;
  }
}
