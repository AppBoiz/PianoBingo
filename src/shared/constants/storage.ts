import type { IndexedDbConfig } from '../types/models'

export const PACK_ID_PARTITION_SIZE = 1000000

export const INDEXED_BD_CONFIG: IndexedDbConfig = {
  DB_NAME: 'PianoBingoDB',
  DB_VERSION: 1,
  PARTITION_SIZE: PACK_ID_PARTITION_SIZE,
  SCHEMAS: {
    PACKS: 'packs',
    SONGS: 'songs',
  },
} as const

export const DB_TRANSACTION_TYPES = {
  READ_WRITE: 'readwrite',
  READ: 'readonly',
} as const