'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search, PenLine, SearchX, Trash2, Pin, NotebookPen } from 'lucide-react'
import type { NoteWithTags, ViewType } from '@/lib/types'
import NoteCard from '@/components/NoteCard'
import NoteEditor from '@/components/NoteEditor'
import { createNote, searchNotes } from '@/actions/notes'

interface StoreState {
  view: ViewType
  setView: (v: ViewType) => void
  activeTag: string | null
  setActiveTag: (t: string | null) => void
  openNote: (id: string) => void
  editingId: string | null
}

const StoreContext = createContext<StoreState>({} as StoreState)
export function useNoteStore() { return useContext(StoreContext) }

interface NoteGridProps {
  initialNotes: NoteWithTags[]
}

export default function NoteGrid({ initialNotes }: NoteGridProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewType>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NoteWithTags[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
      if (e.key === 'Escape') setEditingId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleNewNote() {
    startTransition(async () => {
      const result = await createNote()
      if (result.success) {
        router.refresh()
        setEditingId(result.data.id)
      }
    })
  }

  function onSearch(q: string) {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults(null); return }
    searchTimer.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchNotes(q.trim())
        if (result.success) setSearchResults(result.data)
      })
    }, 400)
  }

  const notes = searchResults ?? initialNotes

  const filtered = (() => {
    if (searchResults) return searchResults
    let list = notes
    if (view === 'trash') return list.filter(n => n.is_deleted)
    list = list.filter(n => !n.is_deleted)
    if (view === 'pinned') list = list.filter(n => n.is_pinned)
    if (activeTag) list = list.filter(n => n.tags.some(t => t.name === activeTag))
    return list.slice().sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  })()

  const pinnedNotes = filtered.filter(n => n.is_pinned && !n.is_deleted)
  const otherNotes = filtered.filter(n => !n.is_pinned || n.is_deleted)
  const showSections = view === 'all' && !activeTag && !searchQuery && pinnedNotes.length > 0

  const toolbarTitle = (() => {
    if (searchQuery) return `Hasil: "${searchQuery}"`
    if (activeTag) return `Tag: ${activeTag}`
    if (view === 'pinned') return 'Disematkan'
    if (view === 'trash') return 'Sampah'
    return 'Semua Catatan'
  })()

  const editingNote = editingId
    ? initialNotes.find(n => n.id === editingId) ?? null
    : null

  const openNote = useCallback((id: string) => setEditingId(id), [])

  return (
    <StoreContext.Provider value={{ view, setView, activeTag, setActiveTag, openNote, editingId }}>
      <div style={styles.main}>
        <div style={styles.toolbar}>
          <span style={styles.toolbarTitle}>{toolbarTitle}</span>

          <div style={styles.searchWrap}>
            <Search size={13} style={styles.searchIcon} />
            <input
              className="input"
              style={styles.searchInput}
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={e => onSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleNewNote}
            disabled={isPending}
          >
            <PenLine size={13} />
            {isPending ? '...' : 'Catatan Baru'}
          </button>
        </div>

        <div style={styles.area}>
          {filtered.length === 0 ? (
            <EmptyState view={view} searchQuery={searchQuery} />
          ) : showSections ? (
            <>
              <SectionHeader label="Disematkan" />
              <div style={styles.grid}>
                {pinnedNotes.map(n => (
                  <NoteCard key={n.id} note={n} onClick={() => openNote(n.id)} />
                ))}
              </div>
              {otherNotes.length > 0 && (
                <>
                  <SectionHeader label="Lainnya" />
                  <div style={styles.grid}>
                    {otherNotes.map(n => (
                      <NoteCard key={n.id} note={n} onClick={() => openNote(n.id)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={styles.grid}>
              {filtered.map(n => (
                <NoteCard key={n.id} note={n} onClick={() => openNote(n.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {editingId && (
        <NoteEditor
          note={editingNote}
          noteId={editingId}
          onClose={() => {
            setEditingId(null)
            router.refresh()
          }}
        />
      )}
    </StoreContext.Provider>
  )
}

function SectionHeader({ label }: { label: string }) {
  return <div style={styles.sectionHeader}><span>{label}</span></div>
}

function EmptyState({ view, searchQuery }: { view: ViewType; searchQuery: string }) {
  const configs = {
    search: { icon: <SearchX size={40} />, title: 'Tidak ditemukan', desc: 'Tidak ada catatan yang cocok.' },
    trash:  { icon: <Trash2 size={40} />,  title: 'Sampah kosong',   desc: 'Catatan yang dihapus akan muncul di sini.' },
    pinned: { icon: <Pin size={40} />,     title: 'Belum ada sematan', desc: 'Sematkan catatan penting agar mudah ditemukan.' },
    all:    { icon: <NotebookPen size={40} />, title: 'Belum ada catatan', desc: 'Tekan "Catatan Baru" atau Ctrl+N untuk mulai menulis.' },
  }
  const key = searchQuery ? 'search' : view
  const { icon, title, desc } = configs[key] ?? configs.all

  return (
    <div style={styles.emptyState}>
      <span style={styles.emptyIcon}>{icon}</span>
      <h3 style={styles.emptyTitle}>{title}</h3>
      <p style={styles.emptyDesc}>{desc}</p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    minWidth: 0,
  },
  toolbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'rgba(247,243,238,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--paper-3)',
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toolbarTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '18px',
    fontStyle: 'italic',
    color: 'var(--ink-2)',
    flex: '0 0 auto',
    minWidth: '140px',
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    maxWidth: '360px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--ink-4)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  searchInput: {
    borderRadius: '99px',
    paddingLeft: '36px',
    paddingRight: '16px',
    background: 'var(--paper-2)',
    width: '100%',
  },
  area: {
    flex: 1,
    padding: '28px',
    overflowY: 'auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  sectionHeader: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--ink-4)',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    color: 'var(--ink-4)',
  },
  emptyIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    opacity: 0.35,
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '22px',
    fontStyle: 'italic',
    color: 'var(--ink-3)',
    marginBottom: '10px',
  },
  emptyDesc: {
    fontSize: '13px',
    color: 'var(--ink-4)',
    maxWidth: '280px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
}
