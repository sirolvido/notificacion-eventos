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

  // Log para diagnóstico
  console.log('Procesando bienvenida para:', name, email)
  console.log('API Key presente:', !!process.env.ANTHROPIC_API_KEY)

  // Leer plantilla
  let template = ''
  try {
    const templatePath = path.join(process.cwd(), 'email-template.md')
    template = fs.readFileSync(templatePath, 'utf-8')
    console.log('Plantilla leída, longitud:', template.length)
  } catch (err) {
    console.error('Error leyendo plantilla:', err.message)
    template = 'Genera un email de bienvenida profesional y amigable.'
  }

  // Llamar a Claude
  let emailHtml = ''
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Eres un generador de emails HTML. Genera un email de bienvenida para ${name} (${email}) para la Conferencia Anual 2026 el 20 de junio de 10:00 a 16:00. Usa colores índigo y púrpura. Devuelve SOLO el HTML, sin explicaciones.`,
          },
        ],
      }),
    })

    console.log('Status Claude:', claudeResponse.status)
    const claudeData = await claudeResponse.json()
    console.log('Respuesta Claude keys:', Object.keys(claudeData))

    if (claudeData.error) {
      console.error('Error Claude:', claudeData.error)
      throw new Error(claudeData.error.message)
    }

    emailHtml = claudeData.content?.[0]?.text || ''
    console.log('HTML generado, longitud:', emailHtml.length)

  } catch (err) {
    console.error('Error llamando a Claude:', err.message)
    // Fallback: email simple sin IA
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1, #9333ea); border-radius: 12px; padding: 24px; color: white; margin-bottom: 16px;">
          <h2 style="margin: 0 0 8px 0;">¡Bienvenido, ${name.split(' ')[0]}!</h2>
          <p style="margin: 0; opacity: 0.9;">Tu inscripción a la Conferencia Anual 2026 está confirmada.</p>
        </div>
        <p style="color: #374151;">El evento se celebra el <strong>20 de junio de 2026, de 10:00 a 16:00</strong>.</p>
        <p style="color: #374151;">Si hay algún cambio de horario, te notificaremos por email y WhatsApp.</p>
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