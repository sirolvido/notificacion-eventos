import { useState } from 'react'
import { Calendar, User, Mail, Phone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ name: '', dni: '', email: '', phone: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Introduce tu nombre completo'
    if (!/^[0-9]{8}[A-Za-z]$/.test(form.dni.trim())) e.dni = 'DNI no válido (8 números + letra)'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email no válido'
    if (form.phone && !/^[0-9+\s]{9,15}$/.test(form.phone)) e.phone = 'Teléfono no válido'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const v = validate()
    if (Object.keys(v).length > 0) { setErrors(v); return }
    setErrors({})
    setStatus('loading')

    const { error } = await supabase.from('attendees').insert({
      name: form.name.trim(),
      dni: form.dni.trim().toUpperCase(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        setErrors({ dni: 'Ese DNI ya está registrado para este evento' })
        setStatus('idle')
      } else {
        setStatus('error')
      }
      return
    }
    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">¡Inscripción confirmada!</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Te hemos registrado para el evento. Si hay algún cambio de horario, te avisaremos por email
            con un enlace para verificar tu inscripción mediante tu DNI.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={20} />
          </div>
          <h1 className="text-xl font-bold">Conferencia Anual 2026</h1>
          <p className="text-sm text-white/80 mt-1">20 de junio · 10:00 - 16:00</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <p className="text-sm text-gray-500">
            Inscríbete para recibir notificaciones si hay algún cambio en el horario del evento.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><User size={13}/> Nombre completo *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Ej: Ana Pérez García"
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><CreditCard size={13}/> DNI *</label>
            <input
              type="text" value={form.dni}
              onChange={e => setForm({...form, dni: e.target.value})}
              placeholder="12345678A"
              maxLength={9}
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.dni ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.dni && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.dni}</p>}
            <p className="text-xs text-gray-400 mt-1">Lo usaremos para verificar tu identidad si cambia el horario.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><Mail size={13}/> Email *</label>
            <input
              type="email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="tucorreo@ejemplo.com"
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><Phone size={13}/> Teléfono (opcional)</label>
            <input
              type="text" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="+34 600 000 000"
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.phone}</p>}
          </div>

          {status === 'error' && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertCircle size={13}/> Ha ocurrido un error. Inténtalo de nuevo.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-lg transition-all"
          >
            {status === 'loading' ? 'Enviando...' : 'Inscribirme'}
          </button>
        </form>
      </div>
    </div>
  )
}
