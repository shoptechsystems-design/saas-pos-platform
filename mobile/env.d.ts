/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** Base URL of the hosted Karyano server (no trailing slash), e.g. https://pos.example.com */
  readonly VITE_API_URL?: string;
}
