// Boomerang API Client
// Wrapper around Supabase for easier entity management

import { getSupabaseClient } from "@/lib/supabase-client";
import { getCurrentSystemId } from "@/lib/tenant-helper";

interface EntityConfig {
  tableName: string;
}

class EntityManager {
  private tableName: string;

  constructor(config: EntityConfig) {
    this.tableName = config.tableName;
  }

  async list(orderBy?: string): Promise<any[]> {
    const supabase = await getSupabaseClient();
    const tenantId = localStorage.getItem("selectedTenantId");
    let query = supabase.from(this.tableName as any).select("*");
    
    // Filtrar por client_id automaticamente para tabelas de projeto
    if (tenantId && this.tableName.startsWith("prj_") && !this.tableName.includes("bmr_")) {
      query = query.eq("client_id", tenantId);
    }
    
    // Filtrar bmr_user por system_id usando bmr_user_system_access
    if (this.tableName === "bmr_user") {
      const systemId = getCurrentSystemId();
      const { data: userAccess } = await supabase
        .from("bmr_user_system_access")
        .select("user_id")
        .eq("system_id", systemId);
      
      if (userAccess && userAccess.length > 0) {
        const userIds = userAccess.map((ua: any) => ua.user_id);
        query = query.in("user_id", userIds);
      } else {
        // Se não houver usuários com acesso, retorna vazio
        return [];
      }
    }
    
    if (orderBy) {
      const isDesc = orderBy.startsWith("-");
      const field = isDesc ? orderBy.substring(1) : orderBy;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) {
      console.error(`[EntityManager] Error loading ${this.tableName}:`, error);
      throw error;
    }
    console.log(`[EntityManager] Loaded ${this.tableName}:`, data?.length, 'records');
    return data || [];
  }

  async filter(conditions: Record<string, any> = {}, orderBy?: string): Promise<any[]> {
    const supabase = await getSupabaseClient();
    const tenantId = localStorage.getItem("selectedTenantId");
    let query = supabase.from(this.tableName as any).select("*");
    
    // Filtrar por client_id automaticamente para tabelas de projeto
    if (tenantId && this.tableName.startsWith("prj_") && !this.tableName.includes("bmr_")) {
      query = query.eq("client_id", tenantId);
    }
    
    // Filtrar bmr_user por system_id usando bmr_user_system_access
    if (this.tableName === "bmr_user") {
      const systemId = getCurrentSystemId();
      const { data: userAccess } = await supabase
        .from("bmr_user_system_access")
        .select("user_id")
        .eq("system_id", systemId);
      
      if (userAccess && userAccess.length > 0) {
        const userIds = userAccess.map((ua: any) => ua.user_id);
        query = query.in("user_id", userIds);
      } else {
        // Se não houver usuários com acesso, retorna vazio
        return [];
      }
    }
    
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (orderBy) {
      const isDesc = orderBy.startsWith("-");
      const field = isDesc ? orderBy.substring(1) : orderBy;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) {
      console.error(`[EntityManager] Error filtering ${this.tableName}:`, error);
      throw error;
    }
    console.log(`[EntityManager] Filtered ${this.tableName}:`, data?.length, 'records', 'conditions:', conditions);
    return data || [];
  }

  async create(data: any): Promise<any> {
    const supabase = await getSupabaseClient();
    const tenantId = localStorage.getItem("current_tenant_id");
    
    // Adicionar client_id automaticamente se a tabela for do projeto
    const dataToInsert = { ...data };
    if (tenantId && this.tableName.startsWith("prj_") && !dataToInsert.client_id) {
      dataToInsert.client_id = tenantId;
    }
    
    console.log(`[EntityManager] Creating ${this.tableName}:`, dataToInsert);
    
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .insert(dataToInsert)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error(`[EntityManager] Error creating ${this.tableName}:`, error);
      throw error;
    }
    console.log(`[EntityManager] Created ${this.tableName}:`, result);
    return result;
  }

  async update(id: string, data: any): Promise<any> {
    const supabase = await getSupabaseClient();
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .update(data)
      .eq("id", id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    return true;
  }

  async get(id: string): Promise<any> {
    const supabase = await getSupabaseClient();
    const { data, error} = await supabase
      .from(this.tableName as any)
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Auth helper
const auth = {
  async me() {
    // Verificar sessão BMR customizada no localStorage
    const storedSession = localStorage.getItem("bmr_session");
    if (!storedSession) throw new Error("Not authenticated");
    
    try {
      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession.user) throw new Error("Not authenticated");
      
      // client_id agora vem de bmr_user_clients via current_tenant_id
      const currentTenantId = localStorage.getItem("current_tenant_id");
      
      return {
        email: parsedSession.user.email,
        name: parsedSession.user.name,
        user_id: parsedSession.user.user_id,
        client_id: currentTenantId || '',
        is_super_admin: parsedSession.user.is_super_admin,
        full_name: parsedSession.user.name,
        role: parsedSession.user.is_super_admin ? 'admin' : 'user',
        avatar_url: parsedSession.user.avatar_url || '',
      };
    } catch (error) {
      throw new Error("Not authenticated");
    }
  },
  
  async updateMe(data: any) {
    const user = await this.me();
    console.log("🔍 updateMe - user_id:", user.user_id);
    console.log("🔍 updateMe - data to update:", data);
    
    const supabase = await getSupabaseClient();
    
    const { data: result, error } = await supabase
      .from("bmr_user")
      .update(data)
      .eq("user_id", user.user_id)
      .select()
      .maybeSingle();
    
    console.log("🔍 updateMe - result:", result);
    console.log("🔍 updateMe - error:", error);
    
    if (error) {
      console.error("❌ Error updating user:", error);
      throw error;
    }
    
    if (!result) {
      console.error("❌ No result returned from update");
      throw new Error("Nenhum resultado retornado do update");
    }
    
    // Atualizar localStorage
    const storedSession = localStorage.getItem("bmr_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      parsedSession.user = { ...parsedSession.user, ...result };
      localStorage.setItem("bmr_session", JSON.stringify(parsedSession));
      console.log("✅ Session updated in localStorage");
    }
    
    return result;
  },
  
  async logout() {
    localStorage.removeItem("bmr_session");
    window.location.href = "/auth";
  }
};

// Integrations helper
const integrations = {
  Core: {
    async UploadFile({ file }: { file: File }) {
      const supabase = await getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      return { file_url: publicUrl };
    },
    
    async ExtractDataFromUploadedFile({ file_url, json_schema }: { file_url: string; json_schema: any }) {
      // Simulação de extração de dados - em produção, usar um serviço real
      console.log('Extracting data from:', file_url, 'with schema:', json_schema);
      return { 
        status: 'success', 
        output: [] 
      };
    }
  }
};

// Entity definitions
export const bmr = {
  auth,
  integrations,
  entities: {
    User: new EntityManager({ tableName: "bmr_user" }),
    UserType: new EntityManager({ tableName: "prj_user_type" }),
    Project: new EntityManager({ tableName: "prj_project" }),
    ProjectCategory: new EntityManager({ tableName: "prj_project_category" }),
    Task: new EntityManager({ tableName: "prj_task" }),
    TaskType: new EntityManager({ tableName: "prj_task_type" }),
    Story: new EntityManager({ tableName: "prj_story" }),
    StoryType: new EntityManager({ tableName: "prj_story_type" }),
    Epic: new EntityManager({ tableName: "prj_epic" }),
    Feature: new EntityManager({ tableName: "prj_feature" }),
    Sprint: new EntityManager({ tableName: "prj_sprint" }),
    Board: new EntityManager({ tableName: "prj_board" }),
    Team: new EntityManager({ tableName: "prj_team" }),
    PlanningPokerSession: new EntityManager({ tableName: "prj_planning_poker_session" }),
    Department: new EntityManager({ tableName: "prj_department" }),
    SystemSettings: new EntityManager({ tableName: "prj_system_settings" }),
    TimeLog: new EntityManager({ tableName: "prj_time_log" }),
    Notification: new EntityManager({ tableName: "prj_notification" }),
    Holiday: new EntityManager({ tableName: "prj_holiday" }),
    WorkCalendar: new EntityManager({ tableName: "prj_work_calendar" }),
    ResourceAllocation: new EntityManager({ tableName: "prj_resource_allocation" }),
    Risk: new EntityManager({ tableName: "prj_risk" }),
    Issue: new EntityManager({ tableName: "prj_issue" }),
  },
};
