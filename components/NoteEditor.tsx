'use client'

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from 'react'
import { Pin, Trash2, X, Check, Loader2 } from 'lucide-react'
import type { NoteColor, NoteWithTags } from '@/lib/types'
import {
  updateNote,
  softDeleteNote,
  setNoteTag,
  removeNoteTag,
} from '@/actions/notes'

const NOTE_COLORS: { id: NoteColor; hex: string; label: string }[] = [
  { id: 'none',   hex: '#e0d9ce', label: 'Default' },
  { id: 'amber',  hex: '#f5e0c0', label: 'Amber'   },
  { id: 'green',  hex: '#d0e8d8', label: 'Hijau'   },
  { id: 'blue',   hex: '#d0ddf5', label: 'Biru'    },
  { id: 'purple', hex: '#ddd0f5', label: 'Ungu'    },
  { id: 'red',    hex: '#f5d0d0', label: 'Merah'   },
]

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface NoteEditorProps {
  note: NoteWithTags | null
  noteId: string
  onClose: () => void
}

export default function NoteEditor({ note, noteId, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [color, setColor] = useState<NoteColor>(note?.color ?? 'none')
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? false)
  const [tagInput, setTagInput] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [, startTransition] = useTransition()

  const pendingRef = useRef<Record<string, unknown>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    if (Object.keys(pendingRef.current).length === 0) return
    const patch = { ...pendingRef.current }
    pendingRef.current = {}
    startTransition(async () => {
      await updateNote(noteId, patch)
      setSaveStatus('saved')
    })
  }, [noteId])

  function schedule(patch: Record<string, unknown>) {
    Object.assign(pendingRef.current, patch)
    setSaveStatus('saving')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 800)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      flush()
    }
  }, [flush])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleTitleChange(v: string) {
    setTitle(v)
    schedule({ title: v })
  }

  function handleContentChange(v: string) {
    setContent(v)
    schedule({ content: v })
  }

  function handleColorChange(c: NoteColor) {
    setColor(c)
    schedule({ color: c })
  }

  function handlePinToggle() {
    const next = !isPinned
    setIsPinned(next)
    schedule({ is_pinned: next })
  }

  function handleDelete() {
    if (!confirm('Pindahkan ke sampah?')) return
    startTransition(async () => {
      await softDeleteNote(noteId)
      onClose()
    })
  }

  function handleTagKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      submitTag()
    }
    if (e.key === 'Backspace' && tagInput === '' && note?.tags?.length) {
      const last = note.tags[note.tags.length - 1]
      startTransition(async () => { await removeNoteTag(noteId, last.id) })
    }
  }

  function submitTag() {
    const name = tagInput.trim().replace(/,/g, '').toLowerCase()
    if (!name) return
    const exists = note?.tags?.some(t => t.name === name)
    if (exists || (note?.tags?.length ?? 0) >= 10) { setTagInput(''); return }
    startTransition(async () => {
      await setNoteTag(noteId, name)
      setTagInput('')
    })
  }

  function handleRemoveTag(tagId: string) {
    startTransition(async () => { await removeNoteTag(noteId, tagId) })
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <input
              style={styles.titleInput}
              type="text"
              placeholder="Judul catatan..."
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              maxLength={200}
              autoFocus
            />
            {note && (
              <div style={styles.meta}>
                Dibuat {formatDateLong(note.created_at)}
                {note.updated_at !== note.created_at && (
                  <> · Diperbarui {formatDateLong(note.updated_at)}</>
                )}
              </div>
            )}
          </div>

          <div style={styles.headerActions}>
            <button
              className={`icon-btn${isPinned ? ' active' : ''}`}
              title={isPinned ? 'Lepas sematan' : 'Sematkan'}
              onClick={handlePinToggle}
            >
              <Pin size={14} />
            </button>
            <button
              className="icon-btn danger"
              title="Hapus"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </button>
            <button
              className="icon-btn"
              title="Tutup"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={styles.body}>
          <textarea
            style={styles.contentInput}
            placeholder="Tulis catatanmu di sini..."
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            maxLength={50000}
          />
        </div>

        <div style={styles.footer}>
          <div style={styles.colorPicker}>
            {NOTE_COLORS.map(c => (
              <span
                key={c.id}
                title={c.label}
                onClick={() => handleColorChange(c.id)}
                style={{
                  ...styles.colorDot,
                  background: c.hex,
                  boxShadow: color === c.id
                    ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink-3)'
                    : 'none',
                  transform: color === c.id ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <div style={styles.tagsWrap}>
            {(note?.tags ?? []).map(t => (
              <span key={t.id} style={styles.tagBadge}>
                {t.name}
                <span style={styles.removeTag} onClick={() => handleRemoveTag(t.id)}>
                  <X size={10} />
                </span>
              </span>
            ))}
            <input
              style={styles.tagInput}
              type="text"
              placeholder="+ tag"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeydown}
              onBlur={submitTag}
              maxLength={30}
            />
          </div>

          <span style={styles.saveIndicator}>
            {saveStatus === 'saving'
              ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
              : <Check size={11} style={{ color: 'var(--green)' }} />
            }
            <span>{saveStatus === 'saved' ? 'tersimpan' : 'menyimpan...'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,24,20,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 20px',
    animation: 'fadeIn 160ms ease',
  },
  modal: {
    background: 'var(--paper)',
    borderRadius: 'var(--radius-md)',
    width: '100%',
    maxWidth: '680px',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 80px)',
    animation: 'modalIn 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  header: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--paper-3)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  titleInput: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--ink)',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    lineHeight: 1.3,
  },
  meta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  contentInput: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '15px',
    lineHeight: 1.8,
    color: 'var(--ink-2)',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    minHeight: '300px',
    resize: 'none',
  },
  footer: {
    padding: '14px 24px',
    borderTop: '1px solid var(--paper-3)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  colorPicker: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  colorDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    cursor: 'pointer',
    border: '1.5px solid rgba(0,0,0,0.1)',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    flexShrink: 0,
  },
  tagsWrap: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
    flex: 1,
  },
  tagBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '99px',
    background: 'var(--paper-2)',
    color: 'var(--ink-2)',
    border: '1px solid var(--paper-3)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  removeTag: {
    cursor: 'pointer',
    opacity: 0.5,
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 180ms ease',
  },
  tagInput: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--ink)',
    minWidth: '60px',
    maxWidth: '120px',
  },
  saveIndicator: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    flexShrink: 0,
  },
}
