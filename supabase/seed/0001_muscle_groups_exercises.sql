-- Treinei — seed do catálogo nativo (grupos musculares + exercícios)
-- Nomes de exercícios são termos genéricos de treino, sem vínculo com nenhum app de terceiros.

insert into muscle_groups (slug, name, sort_order) values
  ('peito',        'Peitorais',     1),
  ('costas',       'Costas',        2),
  ('ombros',       'Ombros',        3),
  ('biceps',       'Bíceps',        4),
  ('triceps',      'Tríceps',       5),
  ('antebraco',    'Antebraço',     6),
  ('trapezio',     'Trapézio',      7),
  ('abdomen',      'Abdômen',       8),
  ('coxa_quadril', 'Coxa / Quadril',9),
  ('gluteos',      'Glúteos',       10),
  ('panturrilha',  'Panturrilha',   11),
  ('peso_corpo',   'Peso do Corpo', 12);

-- Peito
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Supino Reto no Aparelho',
  'Supino Inclinado no Aparelho',
  'Supino Reto c/ Halteres',
  'Supino Inclinado c/ Halteres',
  'Crucifixo no Voador',
  'Pullover - v. Peito'
]) as x where slug = 'peito';

-- Costas
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Puxada pela Frente - Pegada Aberta',
  'Puxada pela Frente - Pegada Invertida',
  'Remada no Aparelho',
  'Remada Vertical no Aparelho',
  'Remada Sentado - Pegada Invertida',
  'Remada Unilateral c/ Halter (Serrote)',
  'Crucifixo Inverso no Voador'
]) as x where slug = 'costas';

-- Ombros
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Desenvolvimento no Aparelho',
  'Desenvolvimento c/ Halteres',
  'Elevação Lateral',
  'Elevação Frontal c/ Halteres',
  'Elevação Frontal c/ Anilha',
  'Remada Alta c/ Cabo'
]) as x where slug = 'ombros';

-- Bíceps
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Rosca Direta no Cabo',
  'Rosca Direta c/ Cabo - Pegada Invertida',
  'Rosca Inclinada',
  'Rosca Concentrada',
  'Rosca c/ Halteres',
  'Rosca Hammer c/ Cabo - Corda',
  'Scott Martelo c/ Halteres'
]) as x where slug = 'biceps';

-- Tríceps
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Tríceps Francês',
  'Tríceps Francês Unilateral',
  'Extensão de Cotovelos no Cabo - Pegada Invertida',
  'Extensão de Cotovelos na Roldana Alta',
  'Extensão de Cotovelos c/ Halteres',
  'Mergulho no Aparelho - v. Tríceps'
]) as x where slug = 'triceps';

-- Antebraço
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Rosca de Punho',
  'Rosca de Punho Invertida'
]) as x where slug = 'antebraco';

-- Trapézio
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Encolhimento de Ombros c/ Halteres'
]) as x where slug = 'trapezio';

-- Abdômen
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Infra no Solo',
  'Jack Knifes'
]) as x where slug = 'abdomen';

-- Coxa / Quadril
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Legpress',
  'Legpress Horizontal',
  'Agachamento no Hack',
  'Extensão de Joelhos',
  'Flexão de Joelhos - Deitado',
  'Flexão de Joelhos no Aparelho - Sentado',
  'Adução de Coxa Sentado',
  'Abdução de Coxa Sentado'
]) as x where slug = 'coxa_quadril';

-- Glúteos
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Elevação de Quadril'
]) as x where slug = 'gluteos';

-- Panturrilha
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Panturrilha no Leg Press',
  'Panturrilha em Pé no Aparelho'
]) as x where slug = 'panturrilha';

-- Peso do Corpo
insert into exercises (muscle_group_id, name) select id, x from muscle_groups, unnest(array[
  'Agachamento Livre sem Peso',
  'Ondas de Pulso - Para Baixo'
]) as x where slug = 'peso_corpo';
