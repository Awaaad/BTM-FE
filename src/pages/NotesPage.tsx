import { useRef, useState } from 'react'
import AppLayout from '../components/AppLayout'
import Icon from '../components/Icon'
import NotesPanel from '../components/NotesPanel'
import type { NotesPanelHandle } from '../components/NotesPanel'

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`
}

export default function NotesPage() {
  const panel = useRef<NotesPanelHandle>(null)
  const [formOpen, setFormOpen] = useState(false)

  const startNewNote = () => panel.current?.startNewNote()

  return (
    <AppLayout
      title="My notes"
      subtitle="Private jottings — nobody else can see these."
      actions={
        formOpen ? undefined : (
          <button className="btn" onClick={startNewNote}>
            <Icon name="plus" size={18} />
            Add note
          </button>
        )
      }
      fab={
        formOpen ? undefined : (
          <button className="fab" onClick={startNewNote} aria-label="Add note">
            <Icon name="plus" size={24} />
          </button>
        )
      }
    >
      <NotesPanel
        ref={panel}
        defaultDate={todayIso()}
        standalone
        externalTrigger
        onFormOpenChange={setFormOpen}
      />
    </AppLayout>
  )
}
