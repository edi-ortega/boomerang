# Triggers V3 - Correção para Drag & Drop no Gantt

## 🐛 Problema Identificado

Os triggers anteriores funcionavam no modal mas não no drag porque:
1. O drag atualiza apenas `start_date` e `due_date` (2 campos)
2. O modal pode atualizar mais campos ao mesmo tempo
3. Os triggers estavam funcionando, mas pode haver problema com a propagação

## 🔧 Solução

Vamos adicionar **chamadas recursivas** para garantir que a atualização propague para os pais dos pais.

## SQL Completo Corrigido

```sql
-- ========================================
-- REMOVER TUDO ANTERIOR
-- ========================================
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_insert ON prj_task CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_update ON prj_task CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_progress_on_delete ON prj_task CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_insert ON prj_task CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_update ON prj_task CASCADE;
DROP TRIGGER IF EXISTS trigger_update_parent_dates_on_delete ON prj_task CASCADE;

DROP FUNCTION IF EXISTS update_parent_progress() CASCADE;
DROP FUNCTION IF EXISTS update_parent_dates() CASCADE;
DROP FUNCTION IF EXISTS propagate_to_ancestors_progress(uuid) CASCADE;
DROP FUNCTION IF EXISTS propagate_to_ancestors_dates(uuid) CASCADE;

-- ========================================
-- FUNÇÃO: Propagar Progresso para Ancestrais
-- ========================================
CREATE OR REPLACE FUNCTION propagate_to_ancestors_progress(task_id uuid)
RETURNS void AS $$
DECLARE
  v_parent_id uuid;
  v_avg_progress numeric;
  v_count integer;
BEGIN
  -- Buscar o parent_id da task
  SELECT parent_id INTO v_parent_id
  FROM prj_task
  WHERE id = task_id;

  -- Se não tem pai, termina
  IF v_parent_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular média de progresso dos filhos
  SELECT
    COALESCE(AVG(COALESCE(progress, 0)), 0),
    COUNT(*)
  INTO
    v_avg_progress,
    v_count
  FROM prj_task
  WHERE parent_id = v_parent_id;

  -- Atualizar o pai
  IF v_count > 0 THEN
    UPDATE prj_task
    SET
      progress = ROUND(v_avg_progress)::integer,
      updated_at = NOW()
    WHERE id = v_parent_id;

    RAISE NOTICE 'Updated parent % progress to % (from % children)', v_parent_id, ROUND(v_avg_progress), v_count;

    -- RECURSÃO: Propagar para o avô
    PERFORM propagate_to_ancestors_progress(v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO: Propagar Datas para Ancestrais
-- ========================================
CREATE OR REPLACE FUNCTION propagate_to_ancestors_dates(task_id uuid)
RETURNS void AS $$
DECLARE
  v_parent_id uuid;
  v_min_start_date date;
  v_max_due_date date;
  v_count integer;
BEGIN
  -- Buscar o parent_id da task
  SELECT parent_id INTO v_parent_id
  FROM prj_task
  WHERE id = task_id;

  -- Se não tem pai, termina
  IF v_parent_id IS NULL THEN
    RETURN;
  END IF;

  -- Buscar menor início e maior fim dos filhos
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

  -- Atualizar o pai se encontrou datas válidas
  IF v_min_start_date IS NOT NULL AND v_max_due_date IS NOT NULL AND v_count > 0 THEN
    UPDATE prj_task
    SET
      start_date = v_min_start_date,
      due_date = v_max_due_date,
      updated_at = NOW()
    WHERE id = v_parent_id;

    RAISE NOTICE 'Updated parent % dates: % to % (from % children)', v_parent_id, v_min_start_date, v_max_due_date, v_count;

    -- RECURSÃO: Propagar para o avô
    PERFORM propagate_to_ancestors_dates(v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO: Trigger de Progresso
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Determinar qual task foi afetada
  IF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NOT NULL THEN
      PERFORM propagate_to_ancestors_progress(OLD.id);
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.parent_id IS NOT NULL THEN
      PERFORM propagate_to_ancestors_progress(NEW.id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNÇÃO: Trigger de Datas
-- ========================================
CREATE OR REPLACE FUNCTION update_parent_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Determinar qual task foi afetada
  IF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NOT NULL THEN
      PERFORM propagate_to_ancestors_dates(OLD.id);
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.parent_id IS NOT NULL THEN
      PERFORM propagate_to_ancestors_dates(NEW.id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CRIAR TRIGGERS
-- ========================================

-- Triggers de Progresso
CREATE TRIGGER trigger_update_parent_progress_on_insert
  AFTER INSERT ON prj_task
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_update
  AFTER UPDATE ON prj_task
  FOR EACH ROW
  WHEN (
    NEW.parent_id IS NOT NULL
    AND NEW.progress IS DISTINCT FROM OLD.progress
  )
  EXECUTE FUNCTION update_parent_progress();

CREATE TRIGGER trigger_update_parent_progress_on_delete
  AFTER DELETE ON prj_task
  FOR EACH ROW
  WHEN (OLD.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_progress();

-- Triggers de Datas
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
  AFTER UPDATE ON prj_task
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

## ✅ Verificar

```sql
-- Ver triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'prj_task'
AND trigger_name LIKE '%parent%'
ORDER BY trigger_name;

-- Deve mostrar 6 triggers
```

## 🧪 Teste Específico para Drag

```sql
-- 1. Criar estrutura de teste
INSERT INTO prj_task (id, client_id, project_id, title, progress, start_date, due_date)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'seu-client-id',
  'seu-project-id',
  'Pai',
  0,
  '2024-01-01',
  '2024-01-31'
);

INSERT INTO prj_task (id, client_id, project_id, parent_id, title, progress, start_date, due_date)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  'seu-client-id',
  'seu-project-id',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Filho 1',
  50,
  '2024-01-05',
  '2024-01-15'
);

-- 2. Simular DRAG (atualizar apenas datas)
UPDATE prj_task
SET
  start_date = '2024-01-10',
  due_date = '2024-01-20'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- 3. Verificar se o pai foi atualizado
SELECT id, title, start_date, due_date, progress
FROM prj_task
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Deve mostrar:
-- start_date: 2024-01-10 (mudou!)
-- due_date: 2024-01-20 (mudou!)
-- progress: 50 (média do filho)

-- 4. Simular atualização de progresso via drag da barra
UPDATE prj_task
SET progress = 75
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- 5. Verificar novamente
SELECT id, title, start_date, due_date, progress
FROM prj_task
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Deve mostrar progress: 75

-- 6. Limpar
DELETE FROM prj_task WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
);
```

## 🎯 Diferenças desta Versão

1. **Funções recursivas separadas** - `propagate_to_ancestors_progress()` e `propagate_to_ancestors_dates()`
2. **Propagação explícita** - Usa `PERFORM` para chamar recursivamente
3. **Simplificação dos triggers** - Apenas chamam as funções de propagação
4. **Mais robusto para drag** - Funciona mesmo quando atualiza apenas 1 ou 2 campos
5. **Logs mais claros** - RAISE NOTICE em cada nível da hierarquia

## 📝 Por que isso funciona melhor?

- **Antes**: O trigger atualizava apenas o pai direto
- **Agora**: A função recursiva propaga para TODOS os ancestrais (avô, bisavô, etc)
- **Drag no Gantt**: Atualiza `start_date` e `due_date` → Trigger dispara → Propaga recursivamente
- **Modal**: Atualiza vários campos → Triggers disparam → Propaga recursivamente
