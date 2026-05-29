'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'verify'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Format email tidak valid'
    if (password.length < 8) next.password = 'Password minimal 8 karakter'
    if (password !== confirm) next.confirm = 'Password tidak cocok'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setErrors({})

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setErrors({
          form:
            error.message === 'User already registered'
              ? 'Email ini sudah terdaftar. Coba masuk.'
              : error.message,
        })
        return
      }

      setStep('verify')
    })
  }

  if (step === 'verify') {
    return (
      <div style={styles.card}>
        <div style={styles.verifyIcon}><Mail size={40} /></div>
        <h2 style={styles.verifyTitle}>Cek emailmu</h2>
        <p style={styles.verifyText}>
          Kami mengirimkan tautan konfirmasi ke{' '}
          <strong style={{ color: 'var(--ink)' }}>{email}</strong>.
          Klik tautan tersebut untuk mengaktifkan akunmu.
        </p>
        <p style={styles.verifyNote}>
          Tidak menerima email? Periksa folder spam atau{' '}
          <button
            style={styles.retryBtn}
            onClick={() => setStep('form')}
          >
            coba lagi
          </button>
          .
        </p>
        <Link href="/login" className="btn btn-ghost btn-full" style={{ marginTop: '24px' }}>
          Kembali ke halaman masuk
        </Link>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Catatan<br />Pribadi</h1>
        <p style={styles.subtitle}>Buat akun baru</p>
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
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        <div style={styles.field}>
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <div style={styles.field}>
          <label className="input-label" htmlFor="confirm">Konfirmasi Password</label>
          <input
            id="confirm"
            className="input"
            type="password"
            placeholder="Ulangi password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          {errors.confirm && <span className="input-error">{errors.confirm}</span>}
        </div>

        {errors.form && (
          <div style={styles.errorBox}>
            <AlertTriangle size={13} style={{ color: "var(--red)", flexShrink: 0 }} />
            <span className="input-error" style={{ marginTop: 0 }}>{errors.form}</span>
          </div>
        )}

        <PasswordStrength password={password} />

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isPending}
          style={{ marginTop: '8px' }}
        >
          {isPending ? 'Mendaftarkan...' : 'Buat Akun'}
        </button>
      </form>

      <p style={styles.footer}>
        Sudah punya akun?{' '}
        <Link href="/login" style={styles.link}>Masuk di sini</Link>
      </p>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat']
  const colors = ['', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--green)']

  return (
    <div style={{ marginTop: '-4px' }}>
      <div style={styles.strengthBars}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              ...styles.strengthBar,
              background: i <= score ? colors[score] : 'var(--paper-3)',
              transition: 'background 200ms ease',
            }}
          />
        ))}
      </div>
      <span style={{ ...styles.strengthLabel, color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
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
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
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
  strengthBars: {
    display: 'flex',
    gap: '4px',
    marginBottom: '4px',
    marginTop: '8px',
  },
  strengthBar: {
    flex: 1,
    height: '3px',
    borderRadius: '99px',
  },
  strengthLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.05em',
  },
  footer: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    color: 'var(--ink-4)',
    textAlign: 'center',
    marginTop: '4px',
  },
  link: {
    color: 'var(--amber)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  verifyIcon: {
    fontSize: '40px',
    marginBottom: '20px',
    display: 'block',
  },
  verifyTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '12px',
    color: 'var(--ink)',
  },
  verifyText: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    color: 'var(--ink-3)',
    lineHeight: 1.7,
    marginBottom: '12px',
  },
  verifyNote: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    color: 'var(--ink-4)',
    lineHeight: 1.6,
  },
  retryBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--amber)',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    padding: 0,
    textDecoration: 'underline',
  },
}
