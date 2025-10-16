// Minimal fallback in case @types/qrcode isn't installed at build time
declare module "qrcode" {
  export function toDataURL(
    text: string,
    options?: { margin?: number; scale?: number }
  ): Promise<string>;
  const _default: {
    toDataURL: typeof toDataURL;
  };
  export default _default;
}
