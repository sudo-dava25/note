'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Email atau password salah'
            : authError.message
        )
        return
      }

      router.push('/')
      router.refresh()
    })
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Catatan<br />Pribadi</h1>
        <p style={styles.subtitle}>Masuk ke akunmu</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label className="input-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div style={styles.field}>
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertTriangle size={13} style={{ color: "var(--red)", flexShrink: 0 }} />
            <span className="input-error" style={{ marginTop: 0 }}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isPending}
          style={{ marginTop: '8px' }}
        >
          {isPending ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <div style={styles.divider}>
        <span style={styles.dividerText}>atau</span>
      </div>

      <OAuthButton />

      <p style={styles.footer}>
        Belum punya akun?{' '}
        <Link href="/register" style={styles.link}>Daftar sekarang</Link>
      </p>
    </div>
  )
}

function OAuthButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleGoogleLogin() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    })
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-full"
      onClick={handleGoogleLogin}
      disabled={isPending}
      style={{ marginBottom: '20px' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {isPending ? 'Mengarahkan...' : 'Lanjutkan dengan Google'}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--paper)',
    border: '1px solid var(--paper-3)',
    borderRadius: 'var(--radius-md)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideUp 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  header: {
    marginBottom: '32px',
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--ink)',
    lineHeight: 1.2,
    marginBottom: '10px',
  },
  subtitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    color: 'var(--ink-4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--red-light)',
    border: '1px solid var(--red)',
    borderRadius: 'var(--radius)',
    padding: '8px 12px',
  },
  errorIcon: {
    fontSize: '12px',
    color: 'var(--red)',
    flexShrink: 0,
  },
  divider: {
    position: 'relative' as const,
    textAlign: 'center' as const,
    margin: '4px 0',
  },
  dividerText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    background: 'var(--paper)',
    padding: '0 12px',
    position: 'relative' as const,
    zIndex: 1,
  },
  footer: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    color: 'var(--ink-4)',
    textAlign: 'center' as const,
    marginTop: '4px',
  },
  link: {
    color: 'var(--amber)',
    textDecoration: 'none',
    fontWeight: 500,
  },
}
