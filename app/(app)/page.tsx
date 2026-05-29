import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNotes } from '@/actions/notes'
import Sidebar from '@/components/Sidebar'
import NoteGrid from '@/components/NoteGrid'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const result = await getNotes()
  const notes = result.success ? result.data : []

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar notes={notes} userEmail={user.email ?? ''} />
      <NoteGrid initialNotes={notes} />
    </div>
  )
}
