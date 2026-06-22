# Guía de diseño y contenido para emails de EventNotify

## Identidad visual
- Color principal: índigo (#6366f1)
- Color secundario: púrpura (#9333ea)
- Color de fondo general: gris muy claro (#f9fafb)
- Color de fondo tarjeta info: índigo muy claro (#eef2ff)
- Color texto principal: gris oscuro (#111827)
- Color texto secundario: gris medio (#6b7280)
- Color borde: gris claro (#e5e7eb)
- Tipografía: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Border radius: 12px para contenedores, 8px para botones
- Tono de voz: cercano, claro y humano. Nunca corporativo ni frío.

## Imagen de cabecera
Incluye esta imagen en la parte superior del email, antes del gradiente:
URL: https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=540&q=80
Estilos: width: 100%, max-height: 200px, object-fit: cover, border-radius: 12px 12px 0 0, display: block

## Estructura HTML obligatoria

### 1. Contenedor exterior
Fondo: #f9fafb, padding: 24px, max-width: 540px, margin: 0 auto, font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### 2. Tarjeta principal
Border-radius: 12px, overflow: hidden, box-shadow: 0 4px 6px rgba(0,0,0,0.07)

### 3. Imagen de cabecera
<img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=540&q=80" style="width:100%;max-height:200px;object-fit:cover;display:block;" alt="Conferencia Anual 2026">

### 4. Cabecera con gradiente
Background: linear-gradient(135deg, #6366f1, #9333ea)
Padding: 28px 32px
Color texto: blanco
Incluye: emoji 📅, nombre del evento en H2 (22px, bold, margin 0 0 4px 0), fecha y hora (14px, opacidad 0.85)

### 5. Cuerpo principal
Fondo: blanco, padding: 32px

Incluye en este orden:
- Saludo: "Hola, [nombre de pila] 👋" en H3 (18px, color #111827, margin 0 0 12px 0)
- Párrafo de confirmación (máximo 2 líneas, color #374151, font-size 15px)
- Bloque informativo del evento
- Párrafo sobre notificaciones (1 línea, color #6b7280, font-size 14px)
- Botón de acción

### 6. Bloque informativo del evento
Fondo: #eef2ff, border-left: 3px solid #6366f1, border-radius: 8px, padding: 16px, margin: 20px 0
Contenido (font-size 14px, color #374151, line-height 1.8):
- 📅 <strong>Fecha:</strong> 20 de junio de 2026
- 🕐 <strong>Horario:</strong> 10:00 - 16:00h
- 📍 <strong>Modalidad:</strong> Presencial

### 7. Botón de acción
<a href="https://notificacion-eventos.vercel.app/verify" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:20px;">Verificar mi inscripción →</a>

### 8. Pie de página
Border-top: 1px solid #e5e7eb, padding-top: 20px, margin-top: 28px
Texto (font-size 12px, color #9ca3af, line-height 1.6):
"Recibirás una notificación si hay algún cambio en el horario. Puedes cancelar tu inscripción en cualquier momento desde el enlace de verificación."
"EventNotify © 2026"

## Instrucciones para el email de bienvenida
- Usa SOLO el primer nombre del usuario en el saludo
- Tono cálido y humano, como si lo escribiera una persona real
- NO uses: "Gracias por registrarte", "Bienvenido a nuestra plataforma", "Tu solicitud ha sido procesada"
- SÍ puedes usar: "Ya estás dentro", "Todo listo para el 20 de junio", "Te esperamos"
- Máximo 150 palabras en el cuerpo del email

## Formato de salida
Devuelve ÚNICAMENTE el HTML completo con estilos inline.
Sin comentarios, sin explicaciones, sin bloques de código markdown.
El HTML debe comenzar con <div y terminar con </div>.
Compatible con Gmail, Outlook y Apple Mail.