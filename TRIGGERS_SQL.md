# Triggers para Atualização Automática de Tasks Pai

Execute estes SQL statements no seu banco de dados Supabase para habilitar a atualização automática de datas e percentuais das tasks pai.

## Funcionalidades

1. **Atualização de Percentual**: Quando uma task filha tem seu progresso alterado, o pai é automaticamente atualizado com a média dos filhos
2. **Atualização de Datas**: O pai sempre terá a menor data inicial e maior data final entre todos seus filhos
3. **Propagação em Cascata**: Mudanças propagam para todos os níveis da hierarquia (avôs, bisavôs, etc.)

## SQL para Executar

```sql
-- ========================================
-- FUNÇÃO: Atualizar Progresso do Pai
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id uuid;
  v_avg_progress numeric;
BEGIN
  -- Determinar parent_id
  IF TG_OP = 'DELETE' THEN
    v_parent_id := OLD.parent_id;
  ELSE
    v_parent_id := NEW.parent_id;
  END IF;

  -- Se não tem pai, retorna
  IF v_parent_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Calcular média de progresso dos filhos
  SELECT COALESCE(AVG(progress), 0)
  INTO v_avg_progress
  FROM prj_task
  WHERE parent_id = v_parent_id
  AND deleted_at IS NULL;

  -- Atualizar progresso do pai
  UPDATE prj_task
  SET progress = ROUND(v_avg_progress)
  WHERE id = v_parent_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO: Atualizar Datas do Pai
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id uuid;
  v_min_start_date date;
  v_max_due_date date;
BEGIN
  -- Determinar parent_id
  IF TG_OP = 'DELETE' THEN
    v_parent_id := OLD.parent_id;
  ELSE
    v_parent_id := NEW.parent_id;
  END IF;

  -- Se não tem pai, retorna
  IF v_parent_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Buscar menor data inicial e maior data final dos filhos
  SELECT
    MIN(start_date),
    MAX(due_date)
  INTO
    v_min_start_date,
    v_max_due_date
  FROM prj_task
  WHERE parent_id = v_parent_id
  AND deleted_at IS NULL
  AND start_date IS NOT NULL
  AND due_date IS NOT NULL;

  -- Atualizar datas do pai se encontrou datas válidas
  IF v_min_start_date IS NOT NULL AND v_max_due_date IS NOT NULL THEN
    UPDATE prj_task
    SET
      start_date = v_min_start_date,
      due_date = v_max_due_date
    WHERE id = v_parent_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- REMOVER TRIGGERS ANTIGOS (se existirem)
-- ========================================
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_insert ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_update ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_delete ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_insert ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_update ON prj_task;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_delete ON prj_task;

-- ========================================
-- CRIAR TRIGGERS PARA PROGRESSO
-- ========================================
CREATE TRIGGER trigger_update_parent_progress_on_insert
  AFTER INSERT ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_update
  AFTER UPDATE OF progress ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL AND NEW.progress IS DISTINCT FROM OLD.progress)
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_delete
  AFTER DELETE ON prj_task
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

-- ========================================
-- CRIAR TRIGGERS PARA DATAS
-- ========================================
CREATE TRIGGER trigger_update_parent_dates_on_insert
  AFTER INSERT ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL AND NEW.start_date IS NOT NULL AND NEW.due_date IS NOT NULL)
  EXECUTE FUNCTION update_parent_dates();

CREATE TRIGGER trigger_update_parent_dates_on_update
  AFTER UPDATE OF start_date, due_date ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL AND (NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.due_date IS DISTINCT FROM OLD.due_date))
  EXECUTE FUNCTION update_parent_dates();

CREATE TRIGGER trigger_update_parent_dates_on_delete
  AFTER DELETE ON prj_task
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_dates();
```

## Como Executar

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole todo o código SQL acima
4. Clique em "Run" para executar

## Verificar se os Triggers Foram Criados

```sql
-- Ver todas as funções
SELECT routine_name
FROM information_schema.routines
WHERE routine_type = 'FUNCTION'
AND routine_name LIKE '%parent%';

-- Ver todos os triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%parent%';
```

## Testar

Após criar os triggers, teste alterando o progresso ou datas de uma task filha:

```sql
-- Exemplo: Atualizar progresso de uma task filha
UPDATE prj_task
SET progress = 75
WHERE id = 'id-da-task-filha';

-- Verificar se o pai foi atualizado
SELECT id, title, progress
FROM prj_task
WHERE id = 'id-do-pai';
```
