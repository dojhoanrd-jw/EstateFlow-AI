-- Up Migration
-- EstateFlow AI — Seed Data
-- Passwords: all seeded users use "password123" (bcrypt hash below)
-- $2a$12$nFTjbZ3MGpDaBlKH.I21MeglDFoNIGZZv4mOddlGa6Z6P.8sKwnFa

-- Users (2 agents + 1 admin)
INSERT INTO users (id, name, email, password_hash, role, avatar_url) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Carlos López', 'admin@estateflow.com',
     '$2a$12$nFTjbZ3MGpDaBlKH.I21MeglDFoNIGZZv4mOddlGa6Z6P.8sKwnFa', 'admin', NULL),
    ('a2000000-0000-0000-0000-000000000002', 'María García', 'maria@estateflow.com',
     '$2a$12$nFTjbZ3MGpDaBlKH.I21MeglDFoNIGZZv4mOddlGa6Z6P.8sKwnFa', 'agent', NULL),
    ('a3000000-0000-0000-0000-000000000003', 'Pedro Ruiz', 'pedro@estateflow.com',
     '$2a$12$nFTjbZ3MGpDaBlKH.I21MeglDFoNIGZZv4mOddlGa6Z6P.8sKwnFa', 'agent', NULL)
ON CONFLICT (id) DO NOTHING;

-- Leads (8 leads with varied profiles)
INSERT INTO leads (id, name, email, phone, project_interest, source, budget, notes, assigned_agent_id) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Juan Pérez', 'juan.perez@gmail.com', '+52 55 1234 5678',
     'Torre Álvarez', 'Facebook Ads', 2500000.00, 'Interesado en depto 2 recámaras, piso alto', 'a2000000-0000-0000-0000-000000000002'),
    ('b2000000-0000-0000-0000-000000000002', 'Ana Martínez', 'ana.mtz@outlook.com', '+52 55 2345 6789',
     'Residencial del Parque', 'Referido', 3800000.00, 'Busca casa con jardín para familia de 4', 'a2000000-0000-0000-0000-000000000002'),
    ('b3000000-0000-0000-0000-000000000003', 'Roberto Sánchez', 'roberto.s@yahoo.com', '+52 55 3456 7890',
     'Torre Álvarez', 'Google Ads', 2000000.00, 'Inversionista, quiere conocer rendimiento de renta', 'a2000000-0000-0000-0000-000000000002'),
    ('b4000000-0000-0000-0000-000000000004', 'Laura Domínguez', 'laura.dom@gmail.com', '+52 33 4567 8901',
     'Lomas Verdes', 'Sitio Web', 5500000.00, 'Busca penthouse con vista panorámica', 'a3000000-0000-0000-0000-000000000003'),
    ('b5000000-0000-0000-0000-000000000005', 'Miguel Torres', 'miguel.t@gmail.com', '+52 81 5678 9012',
     'Residencial del Parque', 'Instagram', 2800000.00, 'Primera vivienda, recién casado', 'a3000000-0000-0000-0000-000000000003'),
    ('b6000000-0000-0000-0000-000000000006', 'Sofía Hernández', 'sofia.h@hotmail.com', '+52 55 6789 0123',
     'Torre Álvarez', 'Espectacular', 3200000.00, 'Quiere mudarse en 3 meses máximo', 'a3000000-0000-0000-0000-000000000003'),
    ('b7000000-0000-0000-0000-000000000007', 'Fernando Ruiz', 'fer.ruiz@gmail.com', '+52 55 7890 1234',
     'Lomas Verdes', 'Referido', 4200000.00, 'Comparando con proyecto de la competencia', 'a2000000-0000-0000-0000-000000000002'),
    ('b8000000-0000-0000-0000-000000000008', 'Carmen Vega', 'carmen.v@gmail.com', '+52 55 8901 2345',
     'Residencial del Parque', 'Facebook Ads', 1800000.00, 'Solo explorando opciones, sin urgencia', 'a3000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Conversations
-- HIGH priority
INSERT INTO conversations (id, lead_id, assigned_agent_id, status, ai_summary, ai_priority, ai_tags, is_read, last_message_at) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
     'active',
     'Lead altamente interesado en departamento de 2 recámaras en Torre Álvarez. Preguntó por precio y financiamiento. Quiere agendar visita esta semana. Requiere seguimiento inmediato.',
     'high', ARRAY['hot-lead', 'pricing', 'site-visit', 'financing'], true, NOW() - INTERVAL '10 minutes'),
    ('c2000000-0000-0000-0000-000000000002', 'b4000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000003',
     'active',
     'Lead premium buscando penthouse en Lomas Verdes. Presupuesto alto ($5.5M). Solicita tour virtual y planos detallados. Alta intención de compra.',
     'high', ARRAY['hot-lead', 'premium', 'site-visit'], true, NOW() - INTERVAL '30 minutes'),
    ('c3000000-0000-0000-0000-000000000003', 'b6000000-0000-0000-0000-000000000006', 'a3000000-0000-0000-0000-000000000003',
     'active',
     'Lead con urgencia de mudarse en 3 meses. Interesada en Torre Álvarez. Ya visitó el showroom. Necesita cotización formal y opciones de financiamiento.',
     'high', ARRAY['hot-lead', 'urgent', 'financing', 'follow-up'], false, NOW() - INTERVAL '2 hours'),

-- MEDIUM priority
    ('c4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002',
     'active',
     'Lead buscando casa familiar en Residencial del Parque. Familia de 4 personas. Interesada en modelos de 3 recámaras con jardín. Pidió comparativo de precios.',
     'medium', ARRAY['pricing', 'family', 'follow-up'], true, NOW() - INTERVAL '1 hour'),
    ('c5000000-0000-0000-0000-000000000005', 'b3000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000002',
     'active',
     'Inversionista interesado en rendimiento de renta en Torre Álvarez. Solicitó tabla de capitalización y comparativo de ROI. Requiere información financiera detallada.',
     'medium', ARRAY['investor', 'pricing'], true, NOW() - INTERVAL '3 hours'),
    ('c6000000-0000-0000-0000-000000000006', 'b5000000-0000-0000-0000-000000000005', 'a3000000-0000-0000-0000-000000000003',
     'active',
     'Pareja joven buscando primera vivienda. Presupuesto de $2.8M. Interesados en Residencial del Parque. Preguntaron por crédito Infonavit.',
     'medium', ARRAY['first-home', 'financing', 'infonavit'], false, NOW() - INTERVAL '5 hours'),

-- LOW priority
    ('c7000000-0000-0000-0000-000000000007', 'b7000000-0000-0000-0000-000000000007', 'a2000000-0000-0000-0000-000000000002',
     'active',
     'Lead comparando con proyecto de la competencia. Pidió folleto digital. No ha mostrado urgencia. Necesita nurturing.',
     'low', ARRAY['comparison', 'early-stage'], true, NOW() - INTERVAL '1 day'),
    ('c8000000-0000-0000-0000-000000000008', 'b8000000-0000-0000-0000-000000000008', 'a3000000-0000-0000-0000-000000000003',
     'active',
     'Lead en etapa exploratoria. Solo quiere información general. Sin proyecto definido ni urgencia. Requiere seguimiento a largo plazo.',
     'low', ARRAY['early-stage', 'follow-up'], false, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Messages (realistic real estate conversations)
-- Only insert if no messages exist yet (messages use auto-generated IDs)
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM messages LIMIT 1) THEN

-- Conversation 1: Juan Pérez <-> María García (HOT LEAD)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'lead', 'b1000000-0000-0000-0000-000000000001',
     'Hola, buenas tardes. Vi su anuncio en Facebook sobre Torre Álvarez y me interesa mucho. ¿Tienen disponibilidad en departamentos de 2 recámaras?',
     NOW() - INTERVAL '2 hours'),
    ('c1000000-0000-0000-0000-000000000001', 'agent', 'a2000000-0000-0000-0000-000000000002',
     '¡Hola Juan! Muchas gracias por tu interés en Torre Álvarez. Sí, tenemos varias unidades de 2 recámaras disponibles. Van desde 75m² hasta 92m². ¿Tienes alguna preferencia de piso o orientación?',
     NOW() - INTERVAL '1 hour 55 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'lead', 'b1000000-0000-0000-0000-000000000001',
     'Prefiero piso alto, del 8 en adelante si es posible. ¿Cuál es el rango de precios?',
     NOW() - INTERVAL '1 hour 50 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'agent', 'a2000000-0000-0000-0000-000000000002',
     'Excelente elección. En pisos altos tenemos la unidad 8B de 85m² en $2,450,000 y la 12A de 92m² en $2,780,000. Ambas con vista al parque. ¿Te gustaría agendar una visita para conocerlas?',
     NOW() - INTERVAL '1 hour 45 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'lead', 'b1000000-0000-0000-0000-000000000001',
     'La 8B suena bien para mi presupuesto. ¿Tienen algún plan de financiamiento directo?',
     NOW() - INTERVAL '1 hour 40 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'agent', 'a2000000-0000-0000-0000-000000000002',
     'Sí, manejamos financiamiento directo con la desarrolladora: 10% de enganche, 30% durante construcción en 18 mensualidades, y el 60% restante con crédito bancario. También tenemos convenio con Banorte y Scotiabank para tasas preferenciales.',
     NOW() - INTERVAL '1 hour 35 minutes'),
    ('c1000000-0000-0000-0000-000000000001', 'lead', 'b1000000-0000-0000-0000-000000000001',
     'Perfecto, quiero agendar una visita esta semana. ¿Tienen disponibilidad el jueves por la tarde?',
     NOW() - INTERVAL '10 minutes');

-- Conversation 2: Laura Domínguez <-> Pedro Ruiz (PREMIUM)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c2000000-0000-0000-0000-000000000002', 'lead', 'b4000000-0000-0000-0000-000000000004',
     'Buenas tardes, estoy buscando un penthouse en zona exclusiva de Guadalajara. ¿Qué opciones tienen en Lomas Verdes?',
     NOW() - INTERVAL '4 hours'),
    ('c2000000-0000-0000-0000-000000000002', 'agent', 'a3000000-0000-0000-0000-000000000003',
     '¡Hola Laura! Bienvenida. Lomas Verdes es nuestro proyecto premium. Tenemos 3 penthouses disponibles: PH1 de 180m² ($5,200,000), PH2 de 210m² ($5,800,000), y PH3 de 240m² con terraza privada ($6,500,000). Todos con vista panorámica a la ciudad.',
     NOW() - INTERVAL '3 hours 50 minutes'),
    ('c2000000-0000-0000-0000-000000000002', 'lead', 'b4000000-0000-0000-0000-000000000004',
     'El PH2 me interesa mucho. ¿Podrían enviarme los planos detallados y un tour virtual?',
     NOW() - INTERVAL '3 hours 40 minutes'),
    ('c2000000-0000-0000-0000-000000000002', 'agent', 'a3000000-0000-0000-0000-000000000003',
     'Por supuesto. Te envío el link del tour virtual: cuenta con 3 recámaras, estudio, sala-comedor con doble altura, cocina abierta con isla, cuarto de servicio y 3 cajones de estacionamiento. Los planos detallados te los envío por correo. ¿Cuándo te gustaría visitarlo presencialmente?',
     NOW() - INTERVAL '3 hours 30 minutes'),
    ('c2000000-0000-0000-0000-000000000002', 'lead', 'b4000000-0000-0000-0000-000000000004',
     'Me encanta la distribución. Quiero visitarlo este fin de semana si es posible. También me gustaría saber sobre las amenidades del desarrollo.',
     NOW() - INTERVAL '30 minutes');

-- Conversation 3: Sofía Hernández <-> Pedro Ruiz (URGENT)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c3000000-0000-0000-0000-000000000003', 'lead', 'b6000000-0000-0000-0000-000000000006',
     'Hola, necesito mudarme antes de 3 meses por cambio de trabajo. Ya visité el showroom de Torre Álvarez el fin de semana y me gustó mucho el modelo de 2 recámaras.',
     NOW() - INTERVAL '6 hours'),
    ('c3000000-0000-0000-0000-000000000003', 'agent', 'a3000000-0000-0000-0000-000000000003',
     '¡Hola Sofía! Qué gusto que hayas visitado el showroom. Para entrega inmediata tenemos 2 unidades listas: la 5C (78m², $2,950,000) y la 7A (85m², $3,200,000). Ambas incluyen cocina integral y clósets.',
     NOW() - INTERVAL '5 hours 45 minutes'),
    ('c3000000-0000-0000-0000-000000000003', 'lead', 'b6000000-0000-0000-0000-000000000006',
     'La 7A me interesa. ¿Puedo tener una cotización formal con todas las opciones de pago? Necesito presentarla al banco para mi crédito hipotecario.',
     NOW() - INTERVAL '5 hours 30 minutes'),
    ('c3000000-0000-0000-0000-000000000003', 'agent', 'a3000000-0000-0000-0000-000000000003',
     'Claro que sí. Te preparo la cotización con 3 esquemas: crédito bancario tradicional, Infonavit + crédito bancario, y financiamiento directo. ¿Con qué banco planeas tramitar tu crédito?',
     NOW() - INTERVAL '5 hours 15 minutes'),
    ('c3000000-0000-0000-0000-000000000003', 'lead', 'b6000000-0000-0000-0000-000000000006',
     'Estoy entre BBVA y Santander. ¿Con cuál tienen mejor convenio? También me interesa saber los gastos de escrituración.',
     NOW() - INTERVAL '2 hours');

-- Conversation 4: Ana Martínez <-> María García (FAMILY)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c4000000-0000-0000-0000-000000000004', 'lead', 'b2000000-0000-0000-0000-000000000002',
     'Hola María, somos una familia de 4 (2 hijos pequeños) y estamos buscando una casa con jardín. ¿Qué tienen disponible en Residencial del Parque?',
     NOW() - INTERVAL '1 day'),
    ('c4000000-0000-0000-0000-000000000004', 'agent', 'a2000000-0000-0000-0000-000000000002',
     '¡Hola Ana! Residencial del Parque es ideal para familias. Tenemos casas de 3 y 4 recámaras, todas con jardín privado. El modelo Roble (3 rec, 145m², jardín de 25m²) arranca en $3,500,000. ¿Les interesa ese rango?',
     NOW() - INTERVAL '23 hours'),
    ('c4000000-0000-0000-0000-000000000004', 'lead', 'b2000000-0000-0000-0000-000000000002',
     'Suena bien, pero nuestro presupuesto máximo es $3,800,000. ¿Tienen algo que se ajuste? También es importante que haya áreas comunes para niños.',
     NOW() - INTERVAL '22 hours'),
    ('c4000000-0000-0000-0000-000000000004', 'agent', 'a2000000-0000-0000-0000-000000000002',
     'Perfecto, el modelo Roble entra justo en tu presupuesto. El residencial cuenta con parque central, área de juegos infantiles, casa club y alberca. También hay seguridad 24/7. ¿Te gustaría recibir el comparativo de precios por correo?',
     NOW() - INTERVAL '1 hour');

-- Conversation 5: Roberto Sánchez <-> María García (INVESTOR)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c5000000-0000-0000-0000-000000000005', 'lead', 'b3000000-0000-0000-0000-000000000003',
     'Hola, soy inversionista y busco propiedades con buen rendimiento en renta. ¿Cuál es el cap rate promedio en Torre Álvarez?',
     NOW() - INTERVAL '2 days'),
    ('c5000000-0000-0000-0000-000000000005', 'agent', 'a2000000-0000-0000-0000-000000000002',
     'Hola Roberto. Torre Álvarez ha mostrado un cap rate del 6.2% anual. Los departamentos de 1 recámara se rentan en $12,000-$15,000/mes y los de 2 recámaras en $18,000-$22,000/mes. La plusvalía de la zona ha sido del 8% anual en los últimos 3 años.',
     NOW() - INTERVAL '1 day 23 hours'),
    ('c5000000-0000-0000-0000-000000000005', 'lead', 'b3000000-0000-0000-0000-000000000003',
     'Interesante. ¿Tienen alguna tabla de capitalización o estudio de mercado que puedan compartir? También me gustaría saber si manejan administración de rentas.',
     NOW() - INTERVAL '3 hours');

-- Conversation 6: Miguel Torres <-> Pedro Ruiz (FIRST HOME)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c6000000-0000-0000-0000-000000000006', 'lead', 'b5000000-0000-0000-0000-000000000005',
     'Hola, mi esposa y yo nos acabamos de casar y queremos comprar nuestro primer depa. ¿Aceptan crédito Infonavit en Residencial del Parque?',
     NOW() - INTERVAL '3 days'),
    ('c6000000-0000-0000-0000-000000000006', 'agent', 'a3000000-0000-0000-0000-000000000003',
     '¡Felicidades por su boda! Sí, aceptamos Infonavit, Fovissste y crédito bancario. En Residencial del Parque tenemos departamentos desde $2,200,000. Con Infonavit + crédito bancario podrían acceder a unidades de hasta $2,800,000. ¿Conocen su capacidad de crédito?',
     NOW() - INTERVAL '2 days 22 hours'),
    ('c6000000-0000-0000-0000-000000000006', 'lead', 'b5000000-0000-0000-0000-000000000005',
     'Tengo precalificación de Infonavit por $800,000 y el banco me aprobó hasta $2,000,000. ¿Qué opciones tengo?',
     NOW() - INTERVAL '5 hours');

-- Conversation 7: Fernando Ruiz <-> María García (COMPARISON)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c7000000-0000-0000-0000-000000000007', 'lead', 'b7000000-0000-0000-0000-000000000007',
     'Hola, estoy comparando Lomas Verdes con otro proyecto similar. ¿Me pueden enviar su folleto digital con precios actualizados?',
     NOW() - INTERVAL '4 days'),
    ('c7000000-0000-0000-0000-000000000007', 'agent', 'a2000000-0000-0000-0000-000000000002',
     'Hola Fernando, con gusto te envío el folleto. Lomas Verdes destaca por su ubicación premium, acabados de lujo y amenidades que incluyen gimnasio, sky lounge, concierge 24/7 y 3 niveles de estacionamiento. ¿Qué aspectos son más importantes para ti en tu comparación?',
     NOW() - INTERVAL '3 days 20 hours'),
    ('c7000000-0000-0000-0000-000000000007', 'lead', 'b7000000-0000-0000-0000-000000000007',
     'Precio por metro cuadrado y fecha de entrega son lo que más me importa. Lo reviso y les aviso.',
     NOW() - INTERVAL '1 day');

-- Conversation 8: Carmen Vega <-> Pedro Ruiz (EARLY STAGE)
INSERT INTO messages (conversation_id, sender_type, sender_id, content, created_at) VALUES
    ('c8000000-0000-0000-0000-000000000008', 'lead', 'b8000000-0000-0000-0000-000000000008',
     'Hola, solo quiero información general sobre sus proyectos. No tengo prisa.',
     NOW() - INTERVAL '5 days'),
    ('c8000000-0000-0000-0000-000000000008', 'agent', 'a3000000-0000-0000-0000-000000000003',
     'Hola Carmen, bienvenida. Manejamos 3 proyectos: Torre Álvarez (departamentos desde $1.8M), Residencial del Parque (casas y deptos desde $2.2M) y Lomas Verdes (premium desde $4.2M). ¿Hay algún tipo de propiedad que te interese más?',
     NOW() - INTERVAL '4 days 20 hours'),
    ('c8000000-0000-0000-0000-000000000008', 'lead', 'b8000000-0000-0000-0000-000000000008',
     'No sé, realmente solo estoy viendo opciones para el futuro. Tal vez en 6 meses o un año.',
     NOW() - INTERVAL '2 days');

END IF;
END $$;

-- Down Migration

DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM leads;
DELETE FROM users;
