-- =====================================================================
--  Excelência dos Pés · Banco de dados no Supabase
--
--  Como usar: no painel do Supabase, abra "SQL Editor", clique em
--  "New query", cole este arquivo inteiro e clique em "Run".
--  Pode rodar mais de uma vez sem problema.
--
--  Cada tela do sistema tem a sua tabela. Cada linha guarda um registro
--  (um paciente, um agendamento...) no campo "dados" (JSON).
--  A segurança (RLS) garante que cada login só enxerga os próprios dados.
-- =====================================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pacientes', 'agenda', 'evolucoes', 'servicos', 'caixa', 'estoque', 'esterilizacao', 'config']
  LOOP
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%1$I (
        user_id        uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
        id             text        NOT NULL,
        dados          jsonb       NOT NULL,
        atualizado_em  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, id)
      );
      ALTER TABLE public.%1$I ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS somente_dono ON public.%1$I;
      CREATE POLICY somente_dono ON public.%1$I
        FOR ALL TO authenticated
        USING (user_id = (SELECT auth.uid()))
        WITH CHECK (user_id = (SELECT auth.uid()));
      REVOKE ALL ON public.%1$I FROM anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.%1$I TO authenticated;
    $f$, t);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------
-- Visões para consultar os dados em colunas no painel do Supabase
-- (Table Editor ou SQL Editor). O sistema não depende delas.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_pacientes WITH (security_invoker = true) AS
SELECT p.user_id,
       p.id,
       p.dados->>'nome'                    AS nome,
       p.dados->>'telefone'                AS telefone,
       NULLIF(p.dados->>'nascimento', '')::date AS nascimento,
       p.dados->>'email'                   AS email,
       p.dados->'anamnese'->'doencas'      AS doencas,
       p.dados->'anamnese'->'queixas'      AS queixas,
       p.dados->'anamnese'->>'medicamentos' AS medicamentos,
       p.dados->'anamnese'->>'alergias'    AS alergias,
       p.atualizado_em
FROM public.pacientes p;

CREATE OR REPLACE VIEW public.vw_agenda WITH (security_invoker = true) AS
SELECT a.user_id,
       a.id,
       (a.dados->>'data')::date            AS data,
       a.dados->>'hora'                    AS hora,
       p.dados->>'nome'                    AS paciente,
       a.dados->>'status'                  AS situacao,
       (a.dados->>'valor')::numeric(10,2)  AS valor,
       a.dados->'pagamento'->>'forma'      AS forma_pagamento,
       (a.dados->'pagamento'->>'pago')::boolean AS pago
FROM public.agenda a
LEFT JOIN public.pacientes p ON p.user_id = a.user_id AND p.id = a.dados->>'pacienteId';

CREATE OR REPLACE VIEW public.vw_caixa WITH (security_invoker = true) AS
SELECT c.user_id,
       c.id,
       (c.dados->>'data')::date            AS data,
       c.dados->>'tipo'                    AS tipo,
       c.dados->>'descricao'               AS descricao,
       (c.dados->>'valor')::numeric(10,2)  AS valor,
       c.dados->>'forma'                   AS forma_pagamento,
       c.dados->>'categoria'               AS categoria
FROM public.caixa c;

REVOKE ALL ON public.vw_pacientes, public.vw_agenda, public.vw_caixa FROM anon;
GRANT SELECT ON public.vw_pacientes, public.vw_agenda, public.vw_caixa TO authenticated;


-- ---------------------------------------------------------------------
-- Consultas úteis (rode no SQL Editor quando precisar)
-- ---------------------------------------------------------------------
-- Pacientes:                SELECT nome, telefone, nascimento FROM vw_pacientes ORDER BY nome;
-- Agenda de hoje:           SELECT hora, paciente, situacao FROM vw_agenda WHERE data = current_date ORDER BY hora;
-- Faturamento por mês:      SELECT date_trunc('month', data)::date AS mes, sum(valor) FILTER (WHERE tipo = 'entrada') AS entradas,
--                                  sum(valor) FILTER (WHERE tipo = 'saida') AS despesas
--                           FROM vw_caixa GROUP BY 1 ORDER BY 1 DESC;
-- Quantidade de registros:  SELECT 'pacientes', count(*) FROM pacientes UNION ALL SELECT 'agenda', count(*) FROM agenda;
