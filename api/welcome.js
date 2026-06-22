import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Supabase envía el payload con los datos del nuevo registro
  const record = req.body?.record
  if (!record) {
    return res.status(400).json({ error: 'No record provided' })
  }

  const { name, email } = record
  if (!name || !email) {
    return res.status(400).json({ error: 'Missing name or email' })
  }

  // Leer la plantilla de estilo
  let template = ''
  try {
    const templatePath = path.join(process.cwd(), 'email-template.md')
    template = fs.readFileSync(templatePath, 'utf-8')
  } catch (err) {
    console.error('Error leyendo email-template.md:', err.message)
    return res.status(500).json({ error: 'No se pudo leer la plantilla' })
  }

  // Llamar a Claude para generar el email personalizado
  let emailHtml = ''
  try {
    console.log('API Key presente:', !!process.env.ANTHROPIC_API_KEY)
    console.log('API Key primeros chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10))
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
            content: `Eres un generador de emails de bienvenida para EventNotify. 
            
Aquí tienes la guía de estilo y contenido que debes seguir:

${template}

Genera el email de bienvenida para este usuario:
- Nombre completo: ${name}
- Email: ${email}

Recuerda: devuelve ÚNICAMENTE el HTML del email, sin explicaciones ni texto adicional.`,
          },
        ],
      }),
    })

    const claudeData = await claudeResponse.json()
    emailHtml = claudeData.content?.[0]?.text || ''

    if (!emailHtml) {
      throw new Error('Claude no devolvió contenido')
    }
  } catch (err) {
    console.error('Error llamando a Claude:', err.message)
    return res.status(500).json({ error: 'Error generando el email con IA' })
  }

  // Enviar el email con Resend
  try {
    await resend.emails.send({
      from: 'EventNotify <onboarding@resend.dev>',
      to: email,
      subject: `¡Inscripción confirmada! Conferencia Anual 2026`,
      html: emailHtml,
    })

    console.log(`Email de bienvenida enviado a ${email}`)
    return res.status(200).json({ success: true, email })
  } catch (err) {
    console.error('Error enviando email:', err.message)
    return res.status(500).json({ error: 'Error enviando el email' })
  }
}
