'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Undo2, X } from 'lucide-react'
import type { NoteWithTags } from '@/lib/types'
import { restoreNote, permanentDeleteNote } from '@/actions/notes'

const COLOR_MAP: Record<string, string> = {
  amber:  '#f5e0c0',
  green:  '#d0e8d8',
  blue:   '#d0ddf5',
  purple: '#ddd0f5',
  red:    '#f5d0d0',
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)       return 'Baru saja'
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)} mnt lalu`
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)} jam lalu`
  if (diff < 604_800_000)  return `${Math.floor(diff / 86_400_000)} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface NoteCardProps {
  note: NoteWithTags
  onClick: () => void
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isTrash = note.is_deleted
  const colorHex = COLOR_MAP[note.color]
  const preview = note.content.replace(/\n+/g, ' ').trim()
  const visibleTags = note.tags.slice(0, 3)

  function handleRestore(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await restoreNote(note.id)
      router.refresh()
    })
  }

  function handlePermanentDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Hapus permanen? Tindakan ini tidak bisa dibatalkan.')) return
    startTransition(async () => {
      await permanentDeleteNote(note.id)
      router.refresh()
    })
  }

  return (
    <div
      style={{
        ...styles.card,
        ...(note.is_pinned ? styles.cardPinned : {}),
        ...(isTrash ? styles.cardTrash : {}),
        cursor: isTrash ? 'default' : 'pointer',
        opacity: isPending ? 0.5 : 1,
      }}
      onClick={isTrash ? undefined : onClick}
    >
      {colorHex && (
        <div style={{
          ...styles.colorBar,
          background: `linear-gradient(90deg, ${colorHex}, transparent)`,
        }} />
      )}

      {note.is_pinned && (
        <span style={styles.pinIcon}>
          <Pin size={12} />
        </span>
      )}

      <div style={{
        ...styles.title,
        ...(!note.title ? styles.titleUntitled : {}),
      }}>
        {note.title || 'Tanpa judul'}
      </div>

      {preview && <div style={styles.preview}>{preview}</div>}

      <div style={styles.footer}>
        <span style={styles.date}>{formatDate(note.updated_at)}</span>

        {isTrash ? (
          <div style={styles.trashActions}>
            <button
              className="btn btn-ghost"
              style={styles.trashBtn}
              onClick={handleRestore}
              disabled={isPending}
            >
              <Undo2 size={11} /> Pulihkan
            </button>
            <button
              className="btn btn-danger"
              style={styles.trashBtn}
              onClick={handlePermanentDelete}
              disabled={isPending}
            >
              <X size={11} /> Hapus
            </button>
          </div>
        ) : (
          visibleTags.map(t => (
            <span key={t.id} style={styles.tagPill}>{t.name}</span>
          ))
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--paper)',
    border: '1px solid var(--paper-3)',
    borderRadius: 'var(--radius-md)',
    padding: '18px 20px',
    position: 'relative',
    boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow 180ms ease, transform 180ms ease',
    animation: 'cardIn 240ms ease-out',
  },
  cardPinned: {
    borderColor: 'var(--amber)',
    background: 'linear-gradient(135deg, #fff9f0 0%, var(--paper) 100%)',
  },
  cardTrash: {
    opacity: 0.7,
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
    opacity: 0.8,
  },
  pinIcon: {
    position: 'absolute',
    top: '12px',
    right: '14px',
    color: 'var(--amber)',
    opacity: 0.7,
    display: 'flex',
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--ink)',
    marginBottom: '8px',
    lineHeight: 1.3,
    paddingRight: '16px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  titleUntitled: {
    color: 'var(--ink-4)',
    fontStyle: 'italic',
    fontWeight: 400,
  },
  preview: {
    fontSize: '13px',
    color: 'var(--ink-3)',
    lineHeight: 1.55,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    marginBottom: '12px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  date: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    color: 'var(--ink-4)',
    marginRight: 'auto',
  },
  tagPill: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '99px',
    background: 'var(--paper-2)',
    color: 'var(--ink-3)',
    border: '1px solid var(--paper-3)',
  },
  trashActions: {
    display: 'flex',
    gap: '6px',
  },
  trashBtn: {
    fontSize: '10px',
    padding: '4px 10px',
  },
}
