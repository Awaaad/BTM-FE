import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import {
  formatDateInput,
  formatTimeInput,
  parseDateInput,
  parseTimeInput,
} from '../dateInput'

interface Props {
  /** ISO value: "yyyy-MM-dd" for dates, "HH:mm" for times. Empty string when unset. */
  value: string
  onChange: (isoValue: string) => void
  label: string
  required?: boolean
  autoFocus?: boolean
  /** Server-side error for this field, shown instead of the parse hint. */
  error?: string
}

interface Config {
  kind: 'date' | 'time'
  placeholder: string
  icon: 'calendar' | 'clock'
  hint: string
  parse: (raw: string) => string | null
  format: (iso: string) => string
}

const DATE: Config = {
  kind: 'date',
  placeholder: 'dd/mm/yyyy',
  icon: 'calendar',
  hint: 'Type a date like 14/03/2026, or use the calendar.',
  parse: parseDateInput,
  format: formatDateInput,
}

const TIME: Config = {
  kind: 'time',
  placeholder: 'hh:mm',
  icon: 'clock',
  hint: 'Type a time like 18:30 or 6.30pm.',
  parse: parseTimeInput,
  format: formatTimeInput,
}

/**
 * A text field you can simply type into, backed by the browser's native picker
 * behind a button. The native control alone is fiddly to type into and looks
 * different in every browser.
 */
function Field({ config, value, onChange, label, required, autoFocus, error }: Props & { config: Config }) {
  const textRef = useRef<HTMLInputElement>(null)
  const nativeRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(() => config.format(value))
  const [invalid, setInvalid] = useState(false)

  // Reflect external changes (loading a record, resetting the form), but never
  // rewrite what someone is in the middle of typing.
  useEffect(() => {
    if (document.activeElement === textRef.current) return
    setText(config.format(value))
    setInvalid(false)
  }, [value, config])

  function handleChange(raw: string) {
    setText(raw)
    if (!raw.trim()) {
      setInvalid(false)
      onChange('')
      return
    }
    const parsed = config.parse(raw)
    if (parsed) {
      setInvalid(false)
      onChange(parsed)
    }
  }

  function handleBlur() {
    const raw = text.trim()
    if (!raw) {
      setInvalid(false)
      return
    }
    const parsed = config.parse(raw)
    if (parsed) {
      setText(config.format(parsed))
      setInvalid(false)
      onChange(parsed)
    } else {
      setInvalid(true)
    }
  }

  function openNativePicker() {
    const native = nativeRef.current
    if (!native) return
    // showPicker is Chrome/Edge/Safari 16+; elsewhere fall back to the text field.
    if (typeof native.showPicker === 'function') {
      try {
        native.showPicker()
        return
      } catch {
        // Ignore and fall through — some browsers refuse outside a user gesture.
      }
    }
    textRef.current?.focus()
  }

  return (
    <label className={invalid ? 'field-invalid' : undefined}>
      {label}
      <span className="picker-field">
        <input
          ref={textRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={config.placeholder}
          value={text}
          required={required}
          autoFocus={autoFocus}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
        <button
          type="button"
          className="picker-btn"
          onClick={openNativePicker}
          aria-label={`Choose ${config.kind}`}
          tabIndex={-1}
        >
          <Icon name={config.icon} size={18} />
        </button>
        <input
          ref={nativeRef}
          type={config.kind}
          className="native-picker"
          value={value}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
      {error ? (
        <span className="field-error">{error}</span>
      ) : invalid ? (
        <span className="field-error">{config.hint}</span>
      ) : null}
    </label>
  )
}

export function DateField(props: Props) {
  return <Field {...props} config={DATE} />
}

export function TimeField(props: Props) {
  return <Field {...props} config={TIME} />
}
