import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const record = req.body?.record
  if (!record) {
    return res.status(400).json({ error: 'No record provided' })
  }

  const { name, email } = record
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' })
  }

  console.log('Procesando bienvenida para:', name, email)

  // Leer plantilla
  let template = ''
  try {
    const templatePath = path.join(process.cwd(), 'email-template.md')
    template = fs.readFileSync(templatePath, 'utf-8')
    console.log('Plantilla leída, longitud:', template.length)
  } catch (err) {
    console.error('Error leyendo plantilla:', err.message)
    template = 'Genera un email de bienvenida profesional y amigable con colores índigo y púrpura.'
  }

  // Llamar a OpenRouter
  let emailHtml = ''
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://notificacion-eventos.vercel.app',
        'X-Title': 'EventNotify',
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Eres un generador de emails HTML para EventNotify. Sigue esta guía de diseño al pie de la letra:

${template}

Genera el email de bienvenida para este usuario:
- Nombre completo: ${name}
- Email: ${email}

IMPORTANTE: Devuelve ÚNICAMENTE el HTML con estilos inline. Sin explicaciones. Sin bloques de código markdown. Empieza directamente con <div.`,
          },
        ],
      }),
    })

    console.log('Status OpenRouter:', response.status)
    const data = await response.json()

    if (data.error) {
      console.error('Error OpenRouter:', data.error)
      throw new Error(data.error.message)
    }

    emailHtml = data.choices?.[0]?.message?.content || ''
    // Limpiar posibles bloques de código markdown
    emailHtml = emailHtml.replace(/```html|```/g, '').trim()
    console.log('HTML generado, longitud:', emailHtml.length)

  } catch (err) {
    console.error('Error llamando a OpenRouter:', err.message)
    // Fallback: email simple
    emailHtml = `
      <div style="font-family: -apple-system, sans-serif; max-width: 540px; margin: 0 auto; background: #f9fafb; padding: 24px;">
        <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=540&q=80" style="width:100%;max-height:200px;object-fit:cover;display:block;" alt="Conferencia Anual 2026">
          <div style="background: linear-gradient(135deg, #6366f1, #9333ea); padding: 28px 32px; color: white;">
            <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.85;">📅 Conferencia Anual 2026</p>
            <h2 style="margin: 0; font-size: 22px;">¡Hola, ${name.split(' ')[0]}! 👋</h2>
          </div>
          <div style="background: white; padding: 32px;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 20px 0;">Tu inscripción está confirmada. Te esperamos el 20 de junio.</p>
            <div style="background: #eef2ff; border-left: 3px solid #6366f1; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
              📅 <strong>Fecha:</strong> 20 de junio de 2026<br>
              🕐 <strong>Horario:</strong> 10:00 - 16:00h<br>
              📍 <strong>Modalidad:</strong> Presencial
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">Si hay algún cambio de horario, te notificaremos por email y WhatsApp.</p>
            <a href="https://notificacion-eventos.vercel.app/verify" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Verificar mi inscripción →</a>
            <div style="border-top: 1px solid #e5e7eb; margin-top: 28px; padding-top: 20px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.6;">Puedes cancelar tu inscripción en cualquier momento desde el enlace de verificación.<br>EventNotify © 2026</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Enviar email
  try {
    await resend.emails.send({
      from: 'EventNotify <onboarding@resend.dev>',
      to: email,
      subject: '¡Inscripción confirmada! Conferencia Anual 2026',
      html: emailHtml,
    })
    console.log('Email enviado a:', email)
    return res.status(200).json({ success: true, email })
  } catch (err) {
    console.error('Error enviando email:', err.message)
    return res.status(500).json({ error: 'Error enviando el email' })
  }
}