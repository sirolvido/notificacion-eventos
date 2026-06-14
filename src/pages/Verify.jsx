import { useState } from 'react'
import { CreditCard, AlertCircle, CheckCircle, Calendar, Clock, Loader, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Verify() {
  const [dni, setDni] = useState('')
  const [status, setStatus] = useState('idle')
  const [event, setEvent] = useState(null)
  const [attendeeName, setAttendeeName] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanDni = dni.trim().toUpperCase()
    if (!/^[0-9]{8}[A-Z]$/.test(cleanDni)) { setStatus('error'); return }
    setStatus('loading')

    const { data: attendee } = await supabase
      .from('attendees').select('name').eq('dni', cleanDni).maybeSingle()

    if (!attendee) { setStatus('notfound'); return }

    // Marcar como verificado
    await supabase.from('attendees')
      .update({ verified_at: new Date().toISOString() })
      .eq('dni', cleanDni)

    const { data: eventData } = await supabase.from('event').select('*').eq('id', 1).single()

    setAttendeeName(attendee.name)
    setEvent(eventData)
    setStatus('found')
  }

  const handleCancelInscription = async () => {
    setCancelling(true)
    const cleanDni = dni.trim().toUpperCase()
    const { error } = await supabase.from('attendees').delete().eq('dni', cleanDni)
    setCancelling(false)
    if (!error) setStatus('cancelled')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <h1 className="text-xl font-bold">Verificación de inscripción</h1>
          <p className="text-sm text-white/80 mt-1">Introduce tu DNI para ver el horario actualizado</p>
        </div>

        <div className="px-8 py-6">
          {status !== 'found' && status !== 'cancelled' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><CreditCard size={13}/> DNI</label>
                <input type="text" value={dni} onChange={e => setDni(e.target.value)} placeholder="12345678A" maxLength={9}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {status === 'error' && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertCircle size={13}/> Formato de DNI no válido (8 números + letra).</div>}
              {status === 'notfound' && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertCircle size={13}/> No encontramos ninguna inscripción con ese DNI.</div>}
              <button type="submit" disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
                {status === 'loading' ? <Loader size={15} className="animate-spin"/> : null}
                {status === 'loading' ? 'Verificando...' : 'Verificar'}
              </button>
            </form>
          )}

          {status === 'found' && event && (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Hola, {attendeeName.split(' ')[0]}</h2>
              <p className="text-sm text-gray-500 mb-5">Este es el horario actualizado de tu evento:</p>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-left space-y-2">
                <div className="font-semibold text-gray-800 text-sm">{event.name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} className="text-indigo-500"/>
                  <span>Inicio: <strong>{new Date(event.start_override || event.start_default).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={14} className="text-indigo-500"/>
                  <span>Fin: <strong>{new Date(event.end_override || event.end_default).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</strong></span>
                </div>
              </div>

              {(event.start_override || event.end_override) && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  ⚠ El horario de este evento ha sido modificado respecto al original.
                </p>
              )}

              {!confirmCancel ? (
                <button onClick={() => setConfirmCancel(true)}
                  className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 text-xs font-medium mt-5 py-2 transition-colors">
                  <Trash2 size={13}/> Cancelar mi inscripción
                </button>
              ) : (
                <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                  <p className="text-xs text-red-700 mb-3">¿Seguro que quieres cancelar tu inscripción? Dejarás de recibir notificaciones.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmCancel(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-all">
                      <X size={13}/> No, mantener
                    </button>
                    <button onClick={handleCancelInscription} disabled={cancelling}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 px-3 py-2 rounded-lg transition-all">
                      {cancelling ? <Loader size={13} className="animate-spin"/> : <Trash2 size={13}/>}
                      {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'cancelled' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-gray-400" />
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1">Inscripción cancelada</h2>
              <p className="text-sm text-gray-500 mb-5">Tu inscripción ha sido eliminada. Ya no recibirás notificaciones sobre este evento.</p>
              <a href="/" className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
                Volver al inicio
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
