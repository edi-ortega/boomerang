# 🚀 INSTALAR TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TASKS PAI

## ⚠️ IMPORTANTE

Você precisa executar este SQL **manualmente no Supabase SQL Editor** porque:
1. O banco de dados não tem migrations automáticas configuradas
2. A tabela `prj_task` já existe (foi criada manualmente)
3. Triggers só podem ser criados depois que a tabela existe

## 📋 PASSO A PASSO

### 1️⃣ Abrir o Supabase SQL Editor

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query**

### 2️⃣ Copiar e Executar o SQL Abaixo

Copie TODO o SQL abaixo e cole no SQL Editor:

```sql
-- ========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- DE TASKS PAI NO GANTT
-- ========================================
-- Execute este SQL completo de uma vez
-- ========================================

-- STEP 1: Remover triggers antigos (se existirem)
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

-- STEP 2: Função para propagar PROGRESSO recursivamente
CREATE OR REPLACE FUNCTION propagate_to_ancestors_progress(task_id uuid)
RETURNS void AS $$
DECLARE
  v_parent_id uuid;
  v_avg_progress numeric;
  v_count integer;
BEGIN
  -- Buscar parent_id da task
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

    -- RECURSÃO: Propagar para o avô
    PERFORM propagate_to_ancestors_progress(v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Função para propagar DATAS recursivamente
CREATE OR REPLACE FUNCTION propagate_to_ancestors_dates(task_id uuid)
RETURNS void AS $$
DECLARE
  v_parent_id uuid;
  v_min_start_date date;
  v_max_due_date date;
  v_count integer;
BEGIN
  -- Buscar parent_id da task
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

  -- Atualizar o pai
  IF v_min_start_date IS NOT NULL AND v_max_due_date IS NOT NULL AND v_count > 0 THEN
    UPDATE prj_task
    SET
      start_date = v_min_start_date,
      due_date = v_max_due_date,
      updated_at = NOW()
    WHERE id = v_parent_id;

    -- RECURSÃO: Propagar para o avô
    PERFORM propagate_to_ancestors_dates(v_parent_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Função trigger para progresso
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
BEGIN
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

-- STEP 5: Função trigger para datas
CREATE OR REPLACE FUNCTION update_parent_dates()
RETURNS TRIGGER AS $$
BEGIN
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

-- STEP 6: Criar triggers de PROGRESSO
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

-- STEP 7: Criar triggers de DATAS
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

-- ========================================
-- VERIFICAÇÃO: Este SELECT deve retornar 6 triggers
-- ========================================
SELECT
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name
FROM information_schema.triggers
WHERE event_object_table = 'prj_task'
AND trigger_name LIKE '%parent%'
ORDER BY trigger_name;
```

### 3️⃣ Clicar em "Run" ou pressionar Ctrl+Enter

O SQL vai executar e você deve ver uma tabela no final com **6 triggers**:

```
trigger_name                             | event  | table_name
-----------------------------------------|--------|------------
trigger_update_parent_dates_on_delete    | DELETE | prj_task
trigger_update_parent_dates_on_insert    | INSERT | prj_task
trigger_update_parent_dates_on_update    | UPDATE | prj_task
trigger_update_parent_progress_on_delete | DELETE | prj_task
trigger_update_parent_progress_on_insert | INSERT | prj_task
trigger_update_parent_progress_on_update | UPDATE | prj_task
```

✅ Se você ver esses 6 triggers, a instalação funcionou!

## 🧪 TESTAR

Após instalar os triggers, teste no seu aplicativo:

### Teste 1: Drag no Gantt
1. Abra o Gantt de um projeto
2. Arraste uma task filha para mudar suas datas
3. ✅ A task pai deve atualizar automaticamente suas datas

### Teste 2: Progresso
1. Abra a modal de edição de uma task filha
2. Mude o progresso (ex: de 0% para 50%)
3. Salve
4. ✅ A task pai deve atualizar seu progresso automaticamente

### Teste 3: Múltiplos níveis
1. Crie uma hierarquia: Avô → Pai → Filho
2. Mude o progresso do Filho
3. ✅ Tanto o Pai quanto o Avô devem atualizar

## ❓ Se Não Funcionar

### Verificar se os triggers foram criados:
```sql
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'prj_task';
```

### Verificar se a tabela prj_task tem os campos necessários:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'prj_task'
AND column_name IN ('id', 'parent_id', 'progress', 'start_date', 'due_date');
```

Deve mostrar todos os 5 campos!

### Ver logs de erro (se houver):
- Abra o console do navegador (F12)
- Vá para a aba Network
- Faça o drag de uma task
- Veja se há erros nas requisições para o Supabase

## 🎯 O Que Foi Instalado

### Funções:
- `propagate_to_ancestors_progress()` - Atualiza progresso recursivamente
- `propagate_to_ancestors_dates()` - Atualiza datas recursivamente
- `update_parent_progress()` - Função trigger para progresso
- `update_parent_dates()` - Função trigger para datas

### Triggers:
- **3 triggers de progresso** (INSERT, UPDATE, DELETE)
- **3 triggers de datas** (INSERT, UPDATE, DELETE)

### Como Funcionam:
1. Quando você arrasta uma task no Gantt, o código atualiza `start_date` e `due_date`
2. O trigger `trigger_update_parent_dates_on_update` detecta a mudança
3. Chama a função `update_parent_dates()`
4. Que chama `propagate_to_ancestors_dates()`
5. Que calcula as novas datas do pai e atualiza
6. E chama recursivamente para o avô, bisavô, etc.

## ✨ Benefícios

✅ **Drag & Drop funciona** - Atualiza apenas dates, triggers capturam
✅ **Modal funciona** - Atualiza múltiplos campos, triggers capturam
✅ **Recursivo** - Propaga para TODOS os ancestrais
✅ **Automático** - Você não precisa fazer nada no código frontend
✅ **Transparente** - Funciona com qualquer cliente (web, mobile, API)
