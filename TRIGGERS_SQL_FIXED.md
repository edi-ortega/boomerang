# Triggers Corrigidos - Atualização Automática de Tasks Pai

## ⚠️ IMPORTANTE: Use este arquivo ao invés do TRIGGERS_SQL.md anterior

Execute estes SQL statements no Supabase para habilitar a atualização automática.

## 🔍 Diagnóstico Primeiro

Antes de aplicar os triggers, execute este SQL para verificar a estrutura:

```sql
-- 1. Verificar se a tabela existe e ver seus campos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'prj_task'
AND column_name IN ('id', 'parent_id', 'progress', 'start_date', 'due_date')
ORDER BY ordinal_position;

-- 2. Ver triggers existentes (para remover se necessário)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'prj_task'
AND trigger_name LIKE '%parent%';

-- 3. Ver funções existentes
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%parent%';
```

## 🛠️ SQL Corrigido para Executar

```sql
-- ========================================
-- PASSO 1: REMOVER TRIGGERS E FUNÇÕES ANTIGAS
-- ========================================
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_insert ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_update ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_delete ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_insert ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_update ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_delete ON prj_task;

DROP FUNCTION IF EXISTS update_parent_progress() CASCADE;
DROP FUNCTION IF EXISTS update_parent_dates() CASCADE;

-- ========================================
-- PASSO 2: CRIAR FUNÇÃO PARA PROGRESSO
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id uuid;
  v_avg_progress numeric;
  v_count integer;
BEGIN
  -- Determinar parent_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    v_parent_id := OLD.parent_id;
  ELSE
    v_parent_id := NEW.parent_id;
  END IF;

  -- Se não tem pai, não faz nada
  IF v_parent_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Calcular média de progresso dos filhos
  -- Ignora tasks sem progresso definido (NULL)
  SELECT
    COALESCE(AVG(COALESCE(progress, 0)), 0),
    COUNT(*)
  INTO
    v_avg_progress,
    v_count
  FROM prj_task
  WHERE parent_id = v_parent_id;

  -- Só atualiza se encontrou filhos
  IF v_count > 0 THEN
    -- Atualizar progresso do pai (converte para inteiro)
    UPDATE prj_task
    SET
      progress = ROUND(v_avg_progress)::integer,
      updated_at = NOW()
    WHERE id = v_parent_id;

    -- Log para debug (opcional - remover em produção)
    RAISE NOTICE 'Updated parent % progress to % (avg of % children)', v_parent_id, ROUND(v_avg_progress), v_count;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASSO 3: CRIAR FUNÇÃO PARA DATAS
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id uuid;
  v_min_start_date date;
  v_max_due_date date;
  v_count integer;
BEGIN
  -- Determinar parent_id
  IF TG_OP = 'DELETE' THEN
    v_parent_id := OLD.parent_id;
  ELSE
    v_parent_id := NEW.parent_id;
  END IF;

  -- Se não tem pai, não faz nada
  IF v_parent_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Buscar menor data inicial e maior data final dos filhos
  SELECT
    MIN(start_date::date),
    MAX(due_date::date),
    COUNT(*)
  INTO
    v_min_start_date,
    v_max_due_date,
    v_count
  FROM prj_task
  WHERE parent_id = v_parent_id
  AND start_date IS NOT NULL
  AND due_date IS NOT NULL;

  -- Só atualiza se encontrou datas válidas
  IF v_min_start_date IS NOT NULL AND v_max_due_date IS NOT NULL AND v_count > 0 THEN
    UPDATE prj_task
    SET
      start_date = v_min_start_date,
      due_date = v_max_due_date,
      updated_at = NOW()
    WHERE id = v_parent_id;

    -- Log para debug (opcional - remover em produção)
    RAISE NOTICE 'Updated parent % dates: % to % (from % children)', v_parent_id, v_min_start_date, v_max_due_date, v_count;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASSO 4: CRIAR TRIGGERS PARA PROGRESSO
-- ========================================
CREATE TRIGGER trigger_update_parent_progress_on_insert
  AFTER INSERT ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_update
  AFTER UPDATE OF progress ON prj_task
  FOR EACH ROW
  WHEN (
    NEW.parent_id IS NOT NULL
    AND (NEW.progress IS DISTINCT FROM OLD.progress)
  )
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_delete
  AFTER DELETE ON prj_task
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

-- ========================================
-- PASSO 5: CRIAR TRIGGERS PARA DATAS
-- ========================================
CREATE TRIGGER trigger_update_parent_dates_on_insert
  AFTER INSERT ON prj_task
  FOR EACH ROW
  WHEN (
    NEW.parent_id IS NOT NULL
    AND NEW.start_date IS NOT NULL
    AND NEW.due_date IS NOT NULL
  )
  EXECUTE FUNCTION update_parent_dates();

CREATE TRIGGER trigger_update_parent_dates_on_update
  AFTER UPDATE OF start_date, due_date ON prj_task
  FOR EACH ROW
  WHEN (
    NEW.parent_id IS NOT NULL
    AND (
      NEW.start_date IS DISTINCT FROM OLD.start_date
      OR NEW.due_date IS DISTINCT FROM OLD.due_date
    )
  )
  EXECUTE FUNCTION update_parent_dates();

CREATE TRIGGER trigger_update_parent_dates_on_delete
  AFTER DELETE ON prj_task
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_dates();
```

## ✅ Verificar Instalação

```sql
-- Ver triggers criados
SELECT
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name
FROM information_schema.triggers
WHERE event_object_table = 'prj_task'
AND trigger_name LIKE '%parent%'
ORDER BY trigger_name;

-- Deve retornar 6 triggers:
-- trigger_update_parent_dates_on_delete
-- trigger_update_parent_dates_on_insert
-- trigger_update_parent_dates_on_update
-- trigger_update_parent_progress_on_delete
-- trigger_update_parent_progress_on_insert
-- trigger_update_parent_progress_on_update
```

## 🧪 Testar os Triggers

```sql
-- 1. Criar uma task pai de teste
INSERT INTO prj_task (id, client_id, project_id, title, progress, start_date, due_date)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'seu-client-id',
  'seu-project-id',
  'Task Pai de Teste',
  0,
  '2024-01-01',
  '2024-01-31'
);

-- 2. Criar tasks filhas
INSERT INTO prj_task (client_id, project_id, parent_id, title, progress, start_date, due_date)
VALUES
  ('seu-client-id', 'seu-project-id', '00000000-0000-0000-0000-000000000001'::uuid, 'Filha 1', 25, '2024-01-05', '2024-01-10'),
  ('seu-client-id', 'seu-project-id', '00000000-0000-0000-0000-000000000001'::uuid, 'Filha 2', 75, '2024-01-15', '2024-01-25');

-- 3. Verificar se o pai foi atualizado
SELECT id, title, progress, start_date, due_date
FROM prj_task
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Deve mostrar:
-- progress: 50 (média de 25 e 75)
-- start_date: 2024-01-05 (menor data)
-- due_date: 2024-01-25 (maior data)

-- 4. Testar atualização
UPDATE prj_task
SET progress = 100
WHERE parent_id = '00000000-0000-0000-0000-000000000001'::uuid
AND title = 'Filha 1';

-- 5. Verificar novamente
SELECT id, title, progress, start_date, due_date
FROM prj_task
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Agora deve mostrar progress: 88 (média de 100 e 75)

-- 6. Limpar teste
DELETE FROM prj_task WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM prj_task WHERE parent_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

## 🐛 Debug - Se ainda não funcionar

```sql
-- Verificar logs do PostgreSQL
-- Os triggers têm RAISE NOTICE que vão aparecer nos logs

-- Verificar se há erros
SELECT * FROM pg_stat_activity
WHERE state = 'idle in transaction (aborted)';

-- Testar a função manualmente
DO $$
DECLARE
  test_parent_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_avg_progress numeric;
BEGIN
  SELECT COALESCE(AVG(COALESCE(progress, 0)), 0)
  INTO v_avg_progress
  FROM prj_task
  WHERE parent_id = test_parent_id;

  RAISE NOTICE 'Average progress: %', v_avg_progress;
END $$;
```

## 📝 Diferenças da Versão Anterior

1. ✅ **Conversão explícita para integer** no progress
2. ✅ **Conversão explícita ::date** nas datas
3. ✅ **Atualiza `updated_at`** junto com os campos
4. ✅ **Conta quantos filhos** antes de atualizar
5. ✅ **RAISE NOTICE** para debug
6. ✅ **Tratamento de NULL** mais robusto
7. ✅ **Comentários detalhados** para debug
