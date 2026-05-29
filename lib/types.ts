export type NoteColor = 'none' | 'amber' | 'green' | 'blue' | 'purple' | 'red'

export interface Tag {
  id: string
  user_id: string
  name: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color: NoteColor
  is_pinned: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface NoteWithTags extends Note {
  tags: Tag[]
}

export type CreateNoteInput = {
  title?: string
  content?: string
  color?: NoteColor
}

export type UpdateNoteInput = {
  title?: string
  content?: string
  color?: NoteColor
  is_pinned?: boolean
  is_deleted?: boolean
}

export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ViewType = 'all' | 'pinned' | 'trash'
