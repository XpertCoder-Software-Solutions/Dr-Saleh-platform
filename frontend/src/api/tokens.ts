// Token storage. The refresh token survives reloads; the access token is
// kept alongside it so a reload does not force a refresh round-trip.

const ACCESS_KEY = 'drs.accessToken'
const REFRESH_KEY = 'drs.refreshToken'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable (private mode). Tokens then live for the tab only.
  }
}

let accessToken = read(ACCESS_KEY)
let refreshToken = read(REFRESH_KEY)

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,
  set(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken
    refreshToken = tokens.refreshToken
    write(ACCESS_KEY, accessToken)
    write(REFRESH_KEY, refreshToken)
  },
  clear() {
    accessToken = null
    refreshToken = null
    write(ACCESS_KEY, null)
    write(REFRESH_KEY, null)
  },
}
