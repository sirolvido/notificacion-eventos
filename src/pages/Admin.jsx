import { useState, useEffect } from 'react'
import { Lock, Calendar, Clock, Send, CheckCircle, AlertCircle, LogOut, Loader, Users, History, UserCheck, UserX } from 'lucide-react'
import { supabase } from '../lib/supabase'

function toLocalInput(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [event, setEvent] = useState(null)
  const [startOverride, setStartOverride] = useState('')
  const [endOverride, setEndOverride] = useState('')
  const [attendees, setAttendees] = useState([])
  const [eventHistory, setEventHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => { if (authed) loadData() }, [authed])

  const loadData = async () => {
    setLoading(true)
    const { data: eventData } = await supabase.from('event').select('*').eq('id', 1).single()
    const { data: attendeesData } = await supabase.from('attendees').select('*').order('created_at', { ascending: false })
    const { data: historyData } = await supabase.from('event_history').select('*').order('changed_at', { ascending: false }).limit(10)
    setEvent(eventData)
    setStartOverride(toLocalInput(eventData?.start_override || eventData?.start_default))
    setEndOverride(toLocalInput(eventData?.end_override || eventData?.end_default))
    setAttendees(attendeesData || [])
    setEventHistory(historyData || [])
    setLoading(false)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (user === import.meta.env.VITE_ADMIN_USER && pass === import.meta.env.VITE_ADMIN_PASS) {
      setAuthed(true); setLoginError('')
    } else {
      setLoginError('Usuario o contraseña incorrectos')
    }
  }

  const hasChanges = () => {
    if (!event) return false
    return new Date(startOverride).toISOString() !== new Date(event.start_override || event.start_default).toISOString() ||
           new Date(endOverride).toISOString() !== new Date(event.end_override || event.end_default).toISOString()
  }

  const handleSave = async () => {
    setSaving(true); setResult(null)
    const newStart = new Date(startOverride).toISOString()
    const newEnd = new Date(endOverride).toISOString()
    const changed = hasChanges()

    const { error } = await supabase.from('event').update({
      start_override: newStart, end_override: newEnd, updated_at: new Date().toISOString(),
    }).eq('id', 1)

    if (error) { setResult({ type: 'error', message: 'Error al guardar los cambios.' }); setSaving(false); return }

    if (changed) {
      try {
        const res = await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: newStart, end: newEnd, previousStart: event.start_override || event.start_default, previousEnd: event.end_override || event.end_default }),
        })
        const data = await res.json()
        setResult(res.ok
          ? { type: 'success', message: `Horario actualizado. Notificaciones enviadas a ${data.sent} inscritos.` }
          : { type: 'warning', message: 'Horario actualizado, pero hubo un problema al enviar notificaciones.' })
      } catch {
        setResult({ type: 'warning', message: 'Horario actualizado, pero no se pudieron enviar las notificaciones (función no disponible en local).' })
      }
    } else {
      setResult({ type: 'info', message: 'No se han detectado cambios de horario.' })
    }
    await loadData()
    setSaving(false)
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full p-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <Lock size={20} className="text-indigo-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 mb-1">Panel de administración</h1>
          <p className="text-sm text-gray-500 mb-6">EventNotify · Acceso restringido</p>
          <div className="space-y-3">
            <input type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {loginError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-3"><AlertCircle size={13}/> {loginError}</div>}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-all mt-4">Entrar</button>
        </form>
      </div>
    )
  }

  const verifiedCount = attendees.filter(a => a.verified_at).length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel de administración</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestión de horario del evento</p>
          </div>
          <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><LogOut size={14}/> Salir</button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center"><Loader size={16} className="animate-spin"/> Cargando...</div>
        ) : (
          <>
            {/* Info del evento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-indigo-500"/>
                <span className="font-semibold text-gray-800">{event.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-800">{attendees.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Users size={11}/> Inscritos</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-700">{verifiedCount}</div>
                  <div className="text-xs text-green-600 mt-0.5 flex items-center justify-center gap-1"><UserCheck size={11}/> Verificados</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-amber-700">{attendees.length - verifiedCount}</div>
                  <div className="text-xs text-amber-600 mt-0.5 flex items-center justify-center gap-1"><UserX size={11}/> Sin verificar</div>
                </div>
              </div>
            </div>

            {/* Horario predeterminado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Horario predeterminado (fijo)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock size={12}/> Inicio</label>
                  <div className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{formatDateTime(event.start_default)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock size={12}/> Fin</label>
                  <div className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{formatDateTime(event.end_default)}</div>
                </div>
              </div>
            </div>

            {/* Horario actual editable */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Horario actual del evento</div>
              <p className="text-xs text-gray-400 mb-3">Si modificas estos campos y guardas, se notificará a todos los inscritos por email.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex items-center gap-1.5"><Clock size={12}/> Nuevo inicio</label>
                  <input type="datetime-local" value={startOverride} onChange={e => setStartOverride(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex items-center gap-1.5"><Clock size={12}/> Nuevo fin</label>
                  <input type="datetime-local" value={endOverride} onChange={e => setEndOverride(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              {hasChanges() && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-3">
                  <AlertCircle size={13}/> Has modificado el horario. Al guardar se notificará a los {attendees.length} inscritos.
                </div>
              )}
              {result && (
                <div className={`text-xs rounded-lg px-3 py-2 flex items-center gap-1.5 mt-3 ${
                  result.type === 'success' ? 'text-green-700 bg-green-50 border border-green-200' :
                  result.type === 'error' ? 'text-red-700 bg-red-50 border border-red-200' :
                  result.type === 'warning' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                  'text-gray-600 bg-gray-50 border border-gray-200'
                }`}>
                  {result.type === 'success' ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                  {result.message}
                </div>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-lg transition-all mt-4">
                {saving ? <Loader size={15} className="animate-spin"/> : <Send size={15}/>}
                {saving ? 'Guardando y notificando...' : 'Guardar y notificar'}
              </button>
            </div>

            {/* Lista de inscritos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-indigo-500"/>
                <span className="text-sm font-semibold text-gray-700">Lista de inscritos</span>
              </div>
              {attendees.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No hay inscritos todavía.</p>
              ) : (
                <div className="space-y-2">
                  {attendees.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{a.name}</div>
                        <div className="text-xs text-gray-400">{a.email} · {a.dni}</div>
                      </div>
                      <div>
                        {a.verified_at ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <UserCheck size={11}/> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <UserX size={11}/> Sin verificar
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historial de cambios */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-indigo-500"/>
                <span className="text-sm font-semibold text-gray-700">Historial de cambios</span>
              </div>
              {eventHistory.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No hay cambios registrados todavía.</p>
              ) : (
                <div className="space-y-3">
                  {eventHistory.map(h => (
                    <div key={h.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                      <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock size={13} className="text-indigo-400"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">{formatDateTime(h.changed_at)}</div>
                        <div className="text-xs text-gray-500 line-through">{formatDateTime(h.previous_start)} — {formatDateTime(h.previous_end)}</div>
                        <div className="text-xs font-medium text-gray-700">{formatDateTime(h.new_start)} — {formatDateTime(h.new_end)}</div>
                      </div>
                      <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">{h.notified_count} notif.</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
