'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  CreateNoteInput,
  NoteWithTags,
  UpdateNoteInput,
} from '@/lib/types'

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')
  return { supabase, user }
}

export async function getNotes(): Promise<ActionResult<NoteWithTags[]>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags (
          tags ( id, name, user_id )
        )
      `)
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) throw error

    const notes: NoteWithTags[] = (data ?? []).map((note) => ({
      ...note,
      tags: (note.note_tags ?? []).map((nt: any) => nt.tags).filter(Boolean),
    }))

    return { success: true, data: notes }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal memuat catatan' }
  }
}

export async function createNote(
  input: CreateNoteInput = {}
): Promise<ActionResult<NoteWithTags>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: input.title ?? '',
        content: input.content ?? '',
        color: input.color ?? 'none',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: { ...data, tags: [] } }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal membuat catatan' }
  }
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { error } = await supabase
      .from('notes')
      .update(input)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: null }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal memperbarui catatan' }
  }
}

export async function softDeleteNote(id: string): Promise<ActionResult<null>> {
  return updateNote(id, { is_deleted: true, is_pinned: false })
}

export async function restoreNote(id: string): Promise<ActionResult<null>> {
  return updateNote(id, { is_deleted: false })
}

export async function permanentDeleteNote(
  id: string
): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: null }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal menghapus catatan' }
  }
}

export async function setNoteTag(
  noteId: string,
  tagName: string
): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const normalizedName = tagName.trim().toLowerCase().slice(0, 30)
    if (!normalizedName) return { success: false, error: 'Nama tag kosong' }

    const { data: existingTag, error: tagFetchError } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', normalizedName)
      .maybeSingle()

    if (tagFetchError) throw tagFetchError

    let tagId: string

    if (existingTag) {
      tagId = existingTag.id
    } else {
      const { data: newTag, error: tagCreateError } = await supabase
        .from('tags')
        .insert({ user_id: user.id, name: normalizedName })
        .select('id')
        .single()

      if (tagCreateError) throw tagCreateError
      tagId = newTag.id
    }

    const { error: linkError } = await supabase
      .from('note_tags')
      .upsert({ note_id: noteId, tag_id: tagId })

    if (linkError) throw linkError

    revalidatePath('/')
    return { success: true, data: null }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal menambah tag' }
  }
}

export async function removeNoteTag(
  noteId: string,
  tagId: string
): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { error: verifyError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (verifyError) throw new Error('Catatan tidak ditemukan')

    const { error } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)
      .eq('tag_id', tagId)

    if (error) throw error

    revalidatePath('/')
    return { success: true, data: null }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal menghapus tag' }
  }
}

export async function searchNotes(
  query: string
): Promise<ActionResult<NoteWithTags[]>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const trimmed = query.trim()

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags (
          tags ( id, name, user_id )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .textSearch('fts_vector', trimmed, { type: 'websearch' })
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const notes: NoteWithTags[] = (data ?? []).map((note) => ({
      ...note,
      tags: (note.note_tags ?? []).map((nt: any) => nt.tags).filter(Boolean),
    }))

    return { success: true, data: notes }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal mencari catatan' }
  }
}

export async function exportNotes(): Promise<ActionResult<NoteWithTags[]>> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        note_tags (
          tags ( id, name, user_id )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    const notes: NoteWithTags[] = (data ?? []).map((note) => ({
      ...note,
      tags: (note.note_tags ?? []).map((nt: any) => nt.tags).filter(Boolean),
    }))

    return { success: true, data: notes }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal mengekspor' }
  }
}

export async function signOut(): Promise<ActionResult<null>> {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    revalidatePath('/')
    return { success: true, data: null }
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Gagal logout' }
  }
}
