-- Datos DEMO para el panel (el "mockup" que se muestra en la llamada de
-- venta al instalador). Requiere schema_v2.sql ya corrido.
--
-- Crea un cliente demo (slug 'demo') con leads, mensajes, citas y tareas.
-- Limpiar: delete from clientes where slug = 'demo';  (borra todo en cascada)

insert into clientes (nombre_empresa, slug, comuna, color_primario, zona_cobertura)
values ('SolarAndes SpA', 'demo', 'Viña del Mar', '#1F6FD6', 'Gran Valparaíso');

with c as (select id from clientes where slug = 'demo')
insert into leads (cliente_id, nombre, telefono, email, comuna, direccion, tipo_vivienda, es_dueno, tramo_boleta, techo_sol, plazo, estado, valor_estimado, origen, notas, created_at)
select c.id, x.* from c, (values
  ('Carolina Fuentes','+56 9 8123 4471','c.fuentes@gmail.com','Viña del Mar','Av. Álvarez 2340','casa',true,'70_140k','si','asap','Trabajo ganado',4800000,'Formulario','Cerró sistema 5 kW. Instalación agendada.', now() - interval '26 days'),
  ('Rodrigo Maldonado','+56 9 7342 1180','r.maldonado@hotmail.com','Quilpué','Los Carrera 880','casa',true,'mas_140k','si','asap','Trabajo ganado',5900000,'Meta','Boleta $160k. Sistema 6 kW con respaldo.', now() - interval '22 days'),
  ('Patricia Soto','+56 9 6218 9934',null,'Villa Alemana','Buenos Aires 1123','casa',true,'70_140k','si','30_dias','Cotización entregada',4500000,'Formulario','Esperando aprobación del marido.', now() - interval '14 days'),
  ('Jorge Henríquez','+56 9 9871 2203','jhenriquez@outlook.com','Concón','Vergara 450','casa',true,'70_140k','no_se','asap','Cotización entregada',5200000,'Formulario','Techo con sombra parcial; cotizado con optimizadores.', now() - interval '12 days'),
  ('María José Riquelme','+56 9 5567 8812','mjriquelme@gmail.com','Viña del Mar','Limonares 77','casa',true,'40_70k','si','30_dias','Cita agendada',null,'Meta','Visita técnica agendada.', now() - interval '8 days'),
  ('Felipe Aravena','+56 9 4412 7765',null,'Valparaíso','Av. Alemania 5620','casa',true,'70_140k','si','asap','Cita agendada',null,'Formulario','Confirmó por WhatsApp. Quiere financiamiento.', now() - interval '6 days'),
  ('Ana Cáceres','+56 9 3345 9012','ana.caceres@gmail.com','Quilpué','El Retiro 230','casa',true,'mas_140k','si','asap','Cita agendada',null,'Formulario','Boleta $180k, urgida por el alza.', now() - interval '5 days'),
  ('Luis Navarrete','+56 9 8890 3341',null,'Villa Alemana','Santiago 1540','casa',true,'40_70k','no_se','30_dias','Contactado',null,'Meta','Llamar después de las 18:00.', now() - interval '4 days'),
  ('Camila Espinoza','+56 9 7781 5529','cespinoza@gmail.com','Curauma','Los Castaños 89','casa',true,'70_140k','si','asap','Contactado',null,'Formulario','Respondió al primer WhatsApp.', now() - interval '3 days'),
  ('Valentina Rojas','+56 9 2214 6638','v.rojas@gmail.com','Viña del Mar','Av. Borgoño 14200','casa',true,'70_140k','si','asap','Lead',null,'Formulario',null, now() - interval '2 days'),
  ('Marcelo Tapia','+56 9 9023 4456',null,'Quilpué','Freire 455','casa',true,'mas_140k','si','30_dias','Lead',null,'Meta',null, now() - interval '1 day'),
  ('Francisca Muñoz','+56 9 5099 8873','fran.munoz@gmail.com','Concón','Costanera 1180','casa',true,'70_140k','si','asap','Lead',null,'Formulario',null, now() - interval '5 hours')
) as x(nombre, telefono, email, comuna, direccion, tipo_vivienda, es_dueno, tramo_boleta, techo_sol, plazo, estado, valor_estimado, origen, notas, created_at);

-- Etiquetas
with c as (select id from clientes where slug = 'demo')
insert into tags (cliente_id, nombre, color)
select c.id, x.nombre, x.color from c, (values
  ('Caliente','#DC2626'), ('Financiamiento','#7C3AED'), ('Boleta alta','#F5A623')
) as x(nombre, color);

with c as (select id from clientes where slug='demo')
insert into lead_tags (lead_id, tag_id)
select l.id, t.id from c
join leads l on l.cliente_id = c.id and l.nombre in ('Ana Cáceres','Rodrigo Maldonado')
join tags t on t.cliente_id = c.id and t.nombre = 'Boleta alta';

-- Conversaciones demo
with c as (select id from clientes where slug='demo'),
     l as (select id, cliente_id from leads where nombre = 'Ana Cáceres' limit 1)
insert into mensajes (lead_id, cliente_id, direccion, canal, texto, enviado_por, created_at)
select l.id, l.cliente_id, x.* from l, (values
  ('out','whatsapp','Hola Ana, gracias por tu interés en bajar tu cuenta de luz con paneles solares. Soy del equipo de SolarAndes. ¿Te acomoda que coordinemos una evaluación de ahorro gratis esta semana?','auto', now() - interval '5 days'),
  ('in','whatsapp','Sí, me interesa. ¿Pueden el jueves?','manual', now() - interval '5 days' + interval '32 minutes'),
  ('out','whatsapp','¡Perfecto! El jueves a las 11:00 pasa nuestro técnico a medir tu techo. Te llega la confirmación por acá.','manual', now() - interval '5 days' + interval '40 minutes'),
  ('in','whatsapp','Ya, ahí estaré. Gracias','manual', now() - interval '5 days' + interval '45 minutes')
) as x(direccion, canal, texto, enviado_por, created_at);

with l as (select id, cliente_id from leads where nombre = 'Felipe Aravena' limit 1)
insert into mensajes (lead_id, cliente_id, direccion, canal, texto, enviado_por, created_at)
select l.id, l.cliente_id, x.* from l, (values
  ('out','whatsapp','Hola Felipe, vi que estabas interesado en paneles solares. Con el alza de tarifas, realmente conviene cotizar ahora. ¿Quieres que te agende la evaluación gratis?','auto', now() - interval '3 days'),
  ('in','whatsapp','Hola, sí. ¿Tienen opciones de financiamiento?','manual', now() - interval '2 days')
) as x(direccion, canal, texto, enviado_por, created_at);

-- Citas demo
with l as (select id, cliente_id from leads where nombre = 'María José Riquelme')
insert into citas (cliente_id, lead_id, fecha, notas)
select cliente_id, id, date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes', 'Visita técnica — medir techo' from l;

with l as (select id, cliente_id from leads where nombre = 'Felipe Aravena')
insert into citas (cliente_id, lead_id, fecha, notas)
select cliente_id, id, date_trunc('day', now()) + interval '2 days' + interval '15 hours', 'Visita técnica + financiamiento' from l;

with l as (select id, cliente_id from leads where nombre = 'Ana Cáceres')
insert into citas (cliente_id, lead_id, fecha, notas)
select cliente_id, id, date_trunc('day', now()) + interval '3 days' + interval '11 hours', 'Visita técnica — sistema 6 kW' from l;

-- Tareas automáticas demo (aparecen en "Mensajes por enviar" del dashboard)
with l as (select id, cliente_id, nombre from leads where nombre in ('Valentina Rojas','Marcelo Tapia','Francisca Muñoz'))
insert into tareas_automaticas (cliente_id, lead_id, tipo, canal, programada_para, estado, payload)
select cliente_id, id, 'confirmacion', 'whatsapp', now() - interval '10 minutes', 'pendiente',
  'Hola ' || split_part(nombre, ' ', 1) || ', gracias por tu interés en bajar tu cuenta de luz con paneles solares. Soy del equipo de SolarAndes. ¿Te acomoda que coordinemos una evaluación de ahorro gratis esta semana?'
from l;
