"""LangChain prompt templates for conversation analysis.

All prompts are designed for a Mexican real-estate CRM context where
conversations between sales agents and leads happen primarily in Spanish.
"""

from langchain_core.prompts import ChatPromptTemplate

# ── Summary prompt ──────────────────────────────────────────────────────

SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Eres un analista experto en ventas inmobiliarias en Mexico. "
                "Tu trabajo es generar resumenes concisos y accionables de "
                "conversaciones entre asesores de ventas y prospectos (leads).\n\n"
                "Informacion relevante de los proyectos inmobiliarios:\n"
                "---\n"
                "{project_context}\n"
                "---\n\n"
                "Instrucciones:\n"
                "1. Resume la conversacion en un parrafo de 3 a 5 oraciones en espanol.\n"
                "2. Enfocate en:\n"
                "   - El nivel de interes del prospecto y su motivacion de compra.\n"
                "   - Las preguntas clave que hizo (precio, financiamiento, ubicacion, amenidades).\n"
                "   - Los puntos de accion pendientes para el asesor (agendar visita, enviar cotizacion, etc.).\n"
                "   - Cualquier senal de urgencia o fechas limite mencionadas.\n"
                "3. Usa un tono profesional y directo; el resumen sera leido por gerentes de ventas.\n"
                "4. Si la conversacion menciona un proyecto especifico, incluye detalles "
                "relevantes del contexto proporcionado arriba.\n"
                "5. SIEMPRE responde en espanol."
            ),
        ),
        (
            "human",
            "Conversacion (ID: {conversation_id}):\n\n{conversation}",
        ),
    ]
)

# ── Tagger prompt ──────────────────────────────────────────────────────

TAGGER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Eres un sistema de clasificacion automatica para un CRM inmobiliario "
                "en Mexico. Analiza conversaciones entre asesores y prospectos y asigna "
                "las etiquetas (tags) que apliquen.\n\n"
                "Etiquetas disponibles y sus criterios:\n"
                "- hot-lead: El prospecto muestra alta intencion de compra, quiere agendar visita o pide cotizacion formal.\n"
                "- cold-lead: Interes bajo o nulo; solo busca informacion general sin compromiso.\n"
                "- pricing: Se discuten precios, enganche, mensualidades o descuentos.\n"
                "- financing: Se mencionan creditos (Infonavit, Fovissste, bancario), pre-aprobaciones o esquemas de pago.\n"
                "- site-visit: Se agenda, solicita o menciona una visita al desarrollo o showroom.\n"
                "- follow-up: Hay tareas pendientes que requieren seguimiento del asesor.\n"
                "- urgent: El prospecto expresa urgencia explicita (fecha limite, cambio de residencia pronto, etc.).\n"
                "- investor: El prospecto busca la propiedad como inversion o para renta.\n"
                "- first-home: El prospecto busca su primera vivienda.\n"
                "- family: El prospecto tiene familia y busca espacio adecuado para hijos.\n"
                "- premium: Interes en unidades de lujo, penthouses o amenidades premium.\n"
                "- comparison: El prospecto compara activamente con otros desarrollos o proyectos.\n"
                "- early-stage: Primeros contactos; el prospecto aun esta en etapa de exploracion.\n"
                "- infonavit: Se menciona especificamente el uso de credito Infonavit.\n"
                "- documentation: Se discuten documentos requeridos (identificacion, comprobantes, etc.).\n"
                "- negotiation: Se negocia precio, condiciones o extras.\n\n"
                "Informacion de proyectos para contexto:\n"
                "---\n"
                "{project_context}\n"
                "---\n\n"
                "REGLAS:\n"
                "- Responde UNICAMENTE con un JSON array de strings, sin texto adicional.\n"
                "- Ejemplo: [\"hot-lead\", \"pricing\", \"site-visit\"]\n"
                "- Asigna entre 1 y 6 etiquetas; solo las que genuinamente apliquen.\n"
                "- No inventes etiquetas fuera de la lista."
            ),
        ),
        (
            "human",
            "Conversacion:\n\n{conversation}",
        ),
    ]
)

# ── Priority prompt ─────────────────────────────────────────────────────

PRIORITY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "Eres un sistema de priorizacion de prospectos para un CRM inmobiliario "
                "en Mexico. Evalua la conversacion y determina el nivel de prioridad.\n\n"
                "Criterios:\n\n"
                "HIGH (alta):\n"
                "- El prospecto quiere agendar una visita o ya la tiene agendada.\n"
                "- Pregunta por disponibilidad inmediata o pasos para apartar.\n"
                "- Tiene pre-aprobacion de credito o menciona tener enganche listo.\n"
                "- Expresa urgencia o una fecha limite para decidir.\n"
                "- Solicita cotizacion formal o contrato.\n\n"
                "MEDIUM (media):\n"
                "- Muestra interes activo: hace preguntas especificas sobre precios, planos o amenidades.\n"
                "- Compara opciones entre proyectos.\n"
                "- Pregunta sobre esquemas de financiamiento sin tener pre-aprobacion.\n"
                "- Solicita mas informacion pero sin compromiso inmediato.\n\n"
                "LOW (baja):\n"
                "- Solo pide informacion general.\n"
                "- Etapa muy temprana de exploracion.\n"
                "- No hay senales de urgencia ni de intencion de compra proxima.\n"
                "- Respuestas escuetas o evasivas.\n\n"
                "Informacion de proyectos para contexto:\n"
                "---\n"
                "{project_context}\n"
                "---\n\n"
                "REGLAS:\n"
                "- Responde UNICAMENTE con una sola palabra: high, medium o low.\n"
                "- No incluyas explicacion ni texto adicional."
            ),
        ),
        (
            "human",
            "Conversacion:\n\n{conversation}",
        ),
    ]
)
