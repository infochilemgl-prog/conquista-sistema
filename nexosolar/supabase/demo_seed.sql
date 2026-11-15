-- Datos DEMO para el panel de leads (el "mockup" que se muestra en la
-- llamada de venta al instalador). Todos llevan origen = 'Demo'.
--
-- Cargar:   pega y corre este archivo en Supabase → SQL Editor.
-- Limpiar:  delete from leads where origen = 'Demo';

insert into leads (nombre, telefono, email, comuna, direccion, tipo_vivienda, es_dueno, tramo_boleta, techo_sol, plazo, estado, valor_estimado, origen, notas, created_at) values
('Carolina Fuentes','+56 9 8123 4471','c.fuentes@gmail.com','Viña del Mar','Av. Álvarez 2340','casa',true,'70_140k','si','asap','Trabajo ganado',4800000,'Demo','Cerró sistema 5 kW. Instalación agendada.', now() - interval '26 days'),
('Rodrigo Maldonado','+56 9 7342 1180','r.maldonado@hotmail.com','Quilpué','Los Carrera 880','casa',true,'mas_140k','si','asap','Trabajo ganado',5900000,'Demo','Boleta $160k. Sistema 6 kW con respaldo.', now() - interval '22 days'),
('Patricia Soto','+56 9 6218 9934',null,'Villa Alemana','Buenos Aires 1123','casa',true,'70_140k','si','30_dias','Cotización entregada',4500000,'Demo','Esperando aprobación del marido. Seguimiento jueves.', now() - interval '14 days'),
('Jorge Henríquez','+56 9 9871 2203','jhenriquez@outlook.com','Concón','Vergara 450','casa',true,'70_140k','no_se','asap','Cotización entregada',5200000,'Demo','Techo con sombra parcial, se cotizó con optimizadores.', now() - interval '12 days'),
('María José Riquelme','+56 9 5567 8812','mjriquelme@gmail.com','Viña del Mar','Limonares 77','casa',true,'40_70k','si','30_dias','Cita agendada',null,'Demo','Visita técnica el martes 10:30.', now() - interval '8 days'),
('Felipe Aravena','+56 9 4412 7765',null,'Valparaíso','Av. Alemania 5620','casa',true,'70_140k','si','asap','Cita agendada',null,'Demo','Confirmó por WhatsApp. Quiere financiamiento.', now() - interval '6 days'),
('Ana Cáceres','+56 9 3345 9012','ana.caceres@gmail.com','Quilpué','El Retiro 230','casa',true,'mas_140k','si','asap','Cita agendada',null,'Demo','Boleta $180k, urgida por el alza.', now() - interval '5 days'),
('Luis Navarrete','+56 9 8890 3341',null,'Villa Alemana','Santiago 1540','casa',true,'40_70k','no_se','30_dias','Contactado',null,'Demo','Pidió que lo llamaran después de las 18:00.', now() - interval '4 days'),
('Camila Espinoza','+56 9 7781 5529','cespinoza@gmail.com','Curauma','Los Castaños 89','casa',true,'70_140k','si','asap','Contactado',null,'Demo','Respondió al primer WhatsApp. Agendando.', now() - interval '3 days'),
('Héctor Oyarzún','+56 9 6690 1127',null,'Concón','Magallanes 312','casa',true,'40_70k','si','mas_1_mes','Contactado',null,'Demo',null, now() - interval '3 days'),
('Valentina Rojas','+56 9 2214 6638','v.rojas@gmail.com','Viña del Mar','Av. Borgoño 14200','casa',true,'70_140k','si','asap','Lead',null,'Demo',null, now() - interval '2 days'),
('Marcelo Tapia','+56 9 9023 4456',null,'Quilpué','Freire 455','casa',true,'mas_140k','si','30_dias','Lead',null,'Demo',null, now() - interval '1 day'),
('Daniela Contreras','+56 9 3156 7789','d.contreras@gmail.com','Villa Alemana','Victoria 2201','casa',true,'40_70k','no_se','asap','Lead',null,'Demo',null, now() - interval '1 day'),
('Pablo Vergara','+56 9 8834 2210',null,'Valparaíso','Playa Ancha 760','casa',true,'70_140k','si','30_dias','Lead',null,'Demo',null, now() - interval '20 hours'),
('Francisca Muñoz','+56 9 5099 8873','fran.munoz@gmail.com','Concón','Costanera 1180','casa',true,'70_140k','si','asap','Lead',null,'Demo',null, now() - interval '5 hours');

-- Citas demo asociadas a los leads en "Cita agendada"
insert into citas (lead_id, fecha, notas)
select id, now() + interval '2 days' + interval '10 hours', 'Visita técnica — medir techo'
from leads where origen = 'Demo' and nombre = 'María José Riquelme';

insert into citas (lead_id, fecha, notas)
select id, now() + interval '3 days' + interval '15 hours', 'Visita técnica + opciones de financiamiento'
from leads where origen = 'Demo' and nombre = 'Felipe Aravena';

insert into citas (lead_id, fecha, notas)
select id, now() + interval '4 days' + interval '11 hours', 'Visita técnica — sistema 6 kW'
from leads where origen = 'Demo' and nombre = 'Ana Cáceres';
