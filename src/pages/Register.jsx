import { useState } from 'react'
import { Calendar, User, Mail, Phone, CreditCard, CheckCircle, AlertCircle, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import conferenceBg from '../assets/conference.jpg'

export default function Register() {
  const [form, setForm] = useState({ name: '', dni: '', email: '', phone: '' })
  const [status, setStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [copied, setCopied] = useState(false)

  const shareUrl = 'https://notificacion-eventos.vercel.app'
  const shareText = 'Me he inscrito a la Conferencia Anual 2026. ¡Apúntate tú también!'

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Conferencia Anual 2026', text: shareText, url: shareUrl })
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddToCalendar = () => {
    const startDate = '20260620T100000'
    const endDate = '20260620T160000'
    const title = encodeURIComponent('Conferencia Anual 2026')
    const details = encodeURIComponent('Inscripción confirmada. Verifica tu inscripción en: https://notificacion-eventos.vercel.app/verify')
    const location = encodeURIComponent('Madrid, España')
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`
    window.open(url, '_blank')
  }

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundImage: `url(${conferenceBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/55"></div>

      {status === 'success' ? (
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-lg w-full p-10 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">¡Inscripción confirmada!</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Te hemos registrado para el evento. Si hay algún cambio de horario, te avisaremos por email y WhatsApp
            con un enlace para verificar tu inscripción mediante tu DNI.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleAddToCalendar}
              style={{ flex: 1, backgroundColor: '#ffffff', color: '#4f46e5', border: '2px solid #4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              <Calendar size={15} />
              Google Calendar
            </button>
            <button
              onClick={handleShare}
              style={{ flex: 1, backgroundColor: '#4f46e5', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              <Share2 size={15} />
              {copied ? '¡Copiado!' : 'Compartir'}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-8 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <Calendar size={20} />
            </div>
            <h1 className="text-2xl font-bold">Conferencia Anual 2026</h1>
            <p className="text-sm text-white/80 mt-1">20 de junio · 10:00 - 16:00 · Madrid</p>
          </div>

          <form onSubmit={handleSubmit} className="px-10 py-8">
            <p className="text-sm text-gray-500 mb-6">
              Inscríbete para recibir notificaciones si hay algún cambio en el horario del evento.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><User size={13}/> Nombre completo *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ej: Ana Pérez García"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.name}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><CreditCard size={13}/> DNI *</label>
                <input type="text" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})}
                  placeholder="12345678A" maxLength={9}
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.dni ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.dni && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.dni}</p>}
                <p className="text-xs text-gray-400 mt-1">Para verificar tu identidad si hay cambios.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><Phone size={13}/> Teléfono (WhatsApp)</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="+34 600 000 000"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.phone}</p>}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><Mail size={13}/> Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="tucorreo@ejemplo.com"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.email}</p>}
              </div>
            </div>

            {status === 'error' && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5 mb-4">
                <AlertCircle size={13}/> Ha ocurrido un error. Inténtalo de nuevo.
              </div>
            )}

            <button type="submit" disabled={status === 'loading'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
              {status === 'loading' ? 'Enviando...' : 'Inscribirme'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
