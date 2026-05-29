'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ClipboardList, Pin, Trash2 } from 'lucide-react'
import { signOut } from '@/actions/notes'
import type { NoteWithTags, ViewType } from '@/lib/types'
import { useNoteStore } from '@/components/NoteGrid'

interface SidebarProps {
  notes: NoteWithTags[]
  userEmail: string
}

export default function Sidebar({ notes, userEmail }: SidebarProps) {
  const { view, setView, activeTag, setActiveTag } = useNoteStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const active = notes.filter(n => !n.is_deleted)
  const pinned = active.filter(n => n.is_pinned)
  const deleted = notes.filter(n => n.is_deleted)

  const allTags = Array.from(
    new Set(active.flatMap(n => n.tags.map(t => t.name)))
  ).sort()

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
      router.push('/login')
      router.refresh()
    })
  }

  function handleNav(v: ViewType) {
    setView(v)
    setActiveTag(null)
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h1 style={styles.logoTitle}>Catatan<br />Pribadi</h1>
        <span style={styles.logoSub}>personal notes</span>
      </div>

      <nav style={styles.nav}>
        <span style={styles.navLabel}>Tampilan</span>

        <NavItem
          icon={<ClipboardList size={15} />}
          label="Semua Catatan"
          count={active.length}
          active={view === 'all' && !activeTag}
          onClick={() => handleNav('all')}
        />
        <NavItem
          icon={<Pin size={15} />}
          label="Disematkan"
          count={pinned.length}
          active={view === 'pinned' && !activeTag}
          onClick={() => handleNav('pinned')}
        />
        <NavItem
          icon={<Trash2 size={15} />}
          label="Sampah"
          count={deleted.length}
          active={view === 'trash' && !activeTag}
          onClick={() => handleNav('trash')}
        />
      </nav>

      {allTags.length > 0 && (
        <div style={styles.tagsSection}>
          <span style={styles.navLabel}>Tag</span>
          <div style={styles.tagsList}>
            {allTags.map(tag => (
              <button
                key={tag}
                style={{
                  ...styles.tagChip,
                  ...(activeTag === tag ? styles.tagChipActive : {}),
                }}
                onClick={() => {
                  setActiveTag(activeTag === tag ? null : tag)
                  setView('all')
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={styles.footer}>
        <span style={styles.userEmail}>{userEmail}</span>
        <button
          style={styles.signOutBtn}
          onClick={handleSignOut}
          disabled={isPending}
        >
          {isPending ? '...' : 'Keluar'}
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  icon, label, count, active, onClick,
}: {
  icon: React.ReactNode
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{
        ...styles.navCount,
        ...(active ? styles.navCountActive : {}),
      }}>
        {count}
      </span>
      {active && <span style={styles.navActiveLine} />}
    </button>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    minWidth: '260px',
    background: 'var(--ink)',
    color: 'var(--paper-2)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  logo: {
    padding: '28px 24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  logoTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--paper)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginTop: '4px',
  },
  nav: {
    padding: '16px 0',
  },
  navLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--ink-3)',
    padding: '4px 24px 8px',
    display: 'block',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 24px',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
    color: 'var(--ink-4)',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    position: 'relative',
    transition: 'background 180ms ease, color 180ms ease',
  },
  navItemActive: {
    color: 'var(--amber-2)',
    background: 'rgba(196,131,42,0.12)',
  },
  navIcon: {
    width: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  navCount: {
    fontSize: '10px',
    background: 'rgba(255,255,255,0.08)',
    padding: '1px 7px',
    borderRadius: '99px',
    color: 'var(--ink-4)',
  },
  navCountActive: {
    background: 'rgba(196,131,42,0.2)',
    color: 'var(--amber-2)',
  },
  navActiveLine: {
    position: 'absolute',
    left: 0,
    top: '4px',
    bottom: '4px',
    width: '2px',
    background: 'var(--amber-2)',
    borderRadius: '0 2px 2px 0',
  },
  tagsSection: {
    borderTop: '1px solid rgba(255,255,255,0.07)',
    padding: '12px 0 16px',
    flex: 1,
  },
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '4px 16px 0',
  },
  tagChip: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    padding: '3px 9px',
    borderRadius: '99px',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--ink-4)',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 180ms ease',
  },
  tagChipActive: {
    background: 'rgba(196,131,42,0.2)',
    color: 'var(--amber-2)',
    borderColor: 'rgba(196,131,42,0.3)',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: 'auto',
  },
  userEmail: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  signOutBtn: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius)',
    padding: '4px 10px',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    flexShrink: 0,
  },
}
