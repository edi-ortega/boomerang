/**
 * RiskIssueWorkflowHelper - Automação de Workflows para Riscos e Issues
 * 
 * Gerencia automações de status, criação de tarefas e notificações
 */

import { bmr } from "@/api/boomerangClient";

interface NotificationParams {
  user_id?: string;
  message: string;
  type?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  project_id?: string;
}

/**
 * Cria notificação para usuário
 */
export const createNotification = async (data: NotificationParams) => {
  try {
    console.log('[Notification]', data);
    
    await bmr.entities.Notification.create({
      ...data,
      is_read: false,
      created_at: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Notifica sobre atribuição/atualização de risco
 */
export const notifyRiskAssignment = async (risk: any, currentUser: any, isUpdate = false) => {
  if (!risk.owner_id || risk.owner_id === currentUser.user_id) {
    return;
  }

  const action = isUpdate ? 'atualizou' : 'atribuiu';
  await createNotification({
    user_id: risk.owner_id,
    message: `${currentUser.name || currentUser.email} ${action} um risco a você: ${risk.title}`,
    type: 'assignment',
    related_entity_type: 'risk',
    related_entity_id: risk.id,
    project_id: risk.project_id
  });
};

/**
 * Notifica sobre revisão de risco próxima
 */
export const notifyRiskReviewDue = async (risk: any) => {
  if (!risk.owner_id || !risk.review_date) return;

  const reviewDate = new Date(risk.review_date);
  const today = new Date();
  const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilReview <= 3 && daysUntilReview >= 0) {
    await createNotification({
      user_id: risk.owner_id,
      message: `Revisão de risco próxima em ${daysUntilReview} ${daysUntilReview === 1 ? 'dia' : 'dias'}: ${risk.title}`,
      type: 'reminder',
      related_entity_type: 'risk',
      related_entity_id: risk.id,
      project_id: risk.project_id
    });
  }
};

/**
 * Notifica sobre atribuição/atualização de issue
 */
export const notifyIssueAssignment = async (issue: any, currentUser: any, isUpdate = false) => {
  if (!issue.assigned_to || issue.assigned_to === currentUser.user_id) {
    return;
  }

  const action = isUpdate ? 'atualizou' : 'atribuiu';
  await createNotification({
    user_id: issue.assigned_to,
    message: `${currentUser.name || currentUser.email} ${action} um issue a você: ${issue.title}`,
    type: 'assignment',
    related_entity_type: 'issue',
    related_entity_id: issue.id,
    project_id: issue.project_id
  });
};

/**
 * Notifica sobre data de vencimento do issue se aproximando
 */
export const notifyIssueDueDateApproaching = async (issue: any) => {
  if (!issue.assigned_to || !issue.due_date) return;

  const dueDate = new Date(issue.due_date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue <= 2 && daysUntilDue >= 0 && issue.status !== 'resolved') {
    await createNotification({
      user_id: issue.assigned_to,
      message: `Issue vence em ${daysUntilDue} ${daysUntilDue === 1 ? 'dia' : 'dias'}: ${issue.title}`,
      type: 'reminder',
      related_entity_type: 'issue',
      related_entity_id: issue.id,
      project_id: issue.project_id
    });
  }
};

/**
 * Cria tarefa de mitigação para um risco
 */
export const createMitigationTask = async (risk: any, project: any) => {
  try {
    const taskData = {
      title: `[MITIGAÇÃO] ${risk.title}`,
      description: `Tarefa de mitigação do risco:\n\n${risk.mitigation_plan || 'Sem plano definido'}`,
      project_id: project.id,
      assigned_to: risk.owner_id,
      priority: risk.risk_level === 'critical' ? 'highest' : risk.risk_level === 'high' ? 'high' : 'medium',
      status: 'todo',
      story_points: risk.risk_level === 'critical' ? 8 : risk.risk_level === 'high' ? 5 : 3
    };

    await bmr.entities.Task.create(taskData);
    
    // Atualizar status do risco
    await bmr.entities.Risk.update(risk.id, {
      status: 'mitigating'
    });

    return true;
  } catch (error) {
    console.error('Error creating mitigation task:', error);
    return false;
  }
};

/**
 * Cria tarefa de resolução para um issue
 */
export const createResolutionTask = async (issue: any, project: any) => {
  try {
    const taskData = {
      title: `[RESOLUÇÃO] ${issue.title}`,
      description: `Tarefa de resolução do issue:\n\n${issue.description || 'Sem descrição'}`,
      project_id: project.id,
      assigned_to: issue.assigned_to,
      priority: issue.severity === 'critical' ? 'highest' : issue.severity === 'high' ? 'high' : 'medium',
      status: 'todo',
      due_date: issue.due_date,
      story_points: issue.severity === 'critical' ? 8 : issue.severity === 'high' ? 5 : 3
    };

    await bmr.entities.Task.create(taskData);
    
    // Atualizar status do issue
    await bmr.entities.Issue.update(issue.id, {
      status: 'in_progress'
    });

    return true;
  } catch (error) {
    console.error('Error creating resolution task:', error);
    return false;
  }
};

/**
 * Verifica e atualiza status do risco baseado em tarefas completas
 */
export const checkAndUpdateRiskStatus = async (risk: any, tasks: any[]) => {
  try {
    // Buscar tarefas relacionadas ao risco
    const relatedTasks = tasks.filter(task => 
      task.title && task.title.includes(risk.title) && task.title.includes('[MITIGAÇÃO]')
    );

    if (relatedTasks.length === 0) return;

    // Verificar se todas as tarefas estão completas
    const allCompleted = relatedTasks.every(task => task.status === 'done');

    if (allCompleted && risk.status !== 'mitigated') {
      await bmr.entities.Risk.update(risk.id, {
        status: 'mitigated'
      });

      if (risk.owner_id) {
        await createNotification({
          user_id: risk.owner_id,
          message: `Risco mitigado com sucesso: ${risk.title}`,
          type: 'status_change',
          related_entity_type: 'risk',
          related_entity_id: risk.id,
          project_id: risk.project_id
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking risk status:', error);
    return false;
  }
};

/**
 * Verifica e atualiza status do issue baseado em tarefas completas
 */
export const checkAndUpdateIssueStatus = async (issue: any, tasks: any[]) => {
  try {
    // Buscar tarefas relacionadas ao issue
    const relatedTasks = tasks.filter(task => 
      task.title && task.title.includes(issue.title) && task.title.includes('[RESOLUÇÃO]')
    );

    if (relatedTasks.length === 0) return;

    // Verificar se todas as tarefas estão completas
    const allCompleted = relatedTasks.every(task => task.status === 'done');

    if (allCompleted && issue.status !== 'resolved') {
      await bmr.entities.Issue.update(issue.id, {
        status: 'resolved',
        resolved_date: new Date().toISOString()
      });

      if (issue.assigned_to) {
        await createNotification({
          user_id: issue.assigned_to,
          message: `Issue resolvido com sucesso: ${issue.title}`,
          type: 'status_change',
          related_entity_type: 'issue',
          related_entity_id: issue.id,
          project_id: issue.project_id
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking issue status:', error);
    return false;
  }
};

/**
 * Vincula issue a um risco
 */
export const linkIssueToRisk = async (issue: any, riskId: string) => {
  try {
    await bmr.entities.Issue.update(issue.id, {
      risk_id: riskId
    });

    // Atualizar status do risco para "occurred"
    await bmr.entities.Risk.update(riskId, {
      status: 'occurred'
    });

    return true;
  } catch (error) {
    console.error('Error linking issue to risk:', error);
    return false;
  }
};
