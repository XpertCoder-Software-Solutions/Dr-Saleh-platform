// Credentials from the register form, kept in memory only (never stored) so the
// user is signed in straight after verifying their email.
let pending: { email: string; password: string } | null = null

export const pendingSignup = {
  set(value: { email: string; password: string }) {
    pending = value
  },
  take(email: string) {
    const value = pending && pending.email.toLowerCase() === email.toLowerCase() ? pending : null
    pending = null
    return value
  },
}
