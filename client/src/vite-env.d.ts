/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TENANT_SERVER_URL: string | undefined;
  readonly VITE_APP_TYPE: 'user' | 'admin' | undefined;
  readonly VITE_IS_NATIVE_BUILD: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
