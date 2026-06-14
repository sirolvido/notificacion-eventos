import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { start, end, previousStart, previousEnd } = req.body

  const { data: attendees, error } = await supabase
    .from('attendees')
    .select('name, email')

  if (error) {
    return res.status(500).json({ error: 'Error al obtener inscritos' })
  }

  if (!attendees || attendees.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No hay inscritos' })
  }

  const verifyUrl = `${req.headers.origin || 'https://notificacion-eventos.vercel.app'}/verify`

  let sent = 0
  const errors = []

  for (const attendee of attendees) {
    try {
      await resend.emails.send({
        from: 'EventNotify <onboarding@resend.dev>',
        to: attendee.email,
        subject: '⚠️ Cambio de horario en tu evento',
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #6366f1, #9333ea); border-radius: 12px; padding: 24px; color: white; margin-bottom: 16px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px;">Aviso de cambio de horario</h2>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Hola ${attendee.name.split(' ')[0]}, el horario de tu evento ha cambiado.</p>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Horario anterior:</p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; text-decoration: line-through;">
                ${formatDate(previousStart)} — ${formatDate(previousEnd)}
              </p>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Nuevo horario:</p>
              <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">
                ${formatDate(start)} — ${formatDate(end)}
              </p>
            </div>
            <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
              Verificar mi inscripción
            </a>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
              Para confirmar tu inscripción con el nuevo horario, accede al enlace e introduce tu DNI.
            </p>
          </div>
        `,
      })
      sent++
    } catch (err) {
      errors.push({ email: attendee.email, error: err.message })
    }
  }

  // Guardar en historial
  await supabase.from('event_history').insert({
    previous_start: previousStart,
    previous_end: previousEnd,
    new_start: start,
    new_end: end,
    notified_count: sent,
  })

  return res.status(200).json({ sent, total: attendees.length, errors })
}
