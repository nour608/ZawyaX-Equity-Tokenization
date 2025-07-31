/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THIRDWEB_CLIENT_ID: string
  readonly VITE_THIRDWEB_SECRET_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_CHAIN_ID_MAINNET: string
  readonly VITE_FACTORY_CONTRACT: string
  readonly VITE_EQUITY_TOKEN_CONTRACT: string
  readonly VITE_CURRENCY_MANAGER_CONTRACT: string
  readonly VITE_USER_REGISTRY_CONTRACT: string
  readonly VITE_FREELANCE_CONTRACT: string
  readonly VITE_PROFILE_CONTRACT: string
  readonly VITE_CHAT_CONTRACT: string
  readonly VITE_ENABLE_GASLESS_TRANSACTIONS: string
  readonly VITE_ENABLE_BUY_CRYPTO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}