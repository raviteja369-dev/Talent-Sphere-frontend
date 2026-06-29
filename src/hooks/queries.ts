import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Task, Project, User, Department, Notification, Activity,
} from '@/lib/types';

// ---------- Dashboard ----------
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await api.get('/analytics')).data,
  });
}

// ---------- Tasks ----------
export function useTasks(params: Record<string, string | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return useQuery({
    queryKey: ['tasks', clean],
    queryFn: async () => (await api.get<Task[]>('/tasks', { params: clean })).data,
  });
}

export function useTask(id?: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => (await api.get<Task>(`/tasks/${id}`)).data,
    enabled: !!id,
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['task'] });
    qc.invalidateQueries({ queryKey: ['projects'] });
    qc.invalidateQueries({ queryKey: ['project'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['analytics'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['activity'] });
  };

  return {
    create: useMutation({ mutationFn: (body: Partial<Task>) => api.post('/tasks', body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<Task> }) => api.put(`/tasks/${id}`, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/tasks/${id}`), onSuccess: invalidate }),
    accept: useMutation({ mutationFn: (id: string) => api.patch(`/tasks/${id}/accept`), onSuccess: invalidate }),
    decline: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/tasks/${id}/decline`, { reason }), onSuccess: invalidate }),
    start: useMutation({ mutationFn: (id: string) => api.patch(`/tasks/${id}/start`), onSuccess: invalidate }),
    pause: useMutation({ mutationFn: (id: string) => api.patch(`/tasks/${id}/pause`), onSuccess: invalidate }),
    resume: useMutation({ mutationFn: (id: string) => api.patch(`/tasks/${id}/resume`), onSuccess: invalidate }),
    progress: useMutation({ mutationFn: ({ id, progress, isDraft }: { id: string; progress: number; isDraft?: boolean }) => api.patch(`/tasks/${id}/progress`, { progress, isDraft }), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (id: string) => api.patch(`/tasks/${id}/submit`), onSuccess: invalidate }),
    acknowledgeCriterion: useMutation({ mutationFn: ({ id, critId }: { id: string; critId: string }) => api.patch(`/tasks/${id}/criteria/${critId}`), onSuccess: invalidate }),
    managerReview: useMutation({ mutationFn: ({ id, decision, comment }: { id: string; decision: string; comment?: string }) => api.patch(`/tasks/${id}/manager-review`, { decision, comment }), onSuccess: invalidate }),
    adminReview: useMutation({ mutationFn: ({ id, decision, comment }: { id: string; decision: string; comment?: string }) => api.patch(`/tasks/${id}/admin-review`, { decision, comment }), onSuccess: invalidate }),
    comment: useMutation({ mutationFn: ({ id, text, mentions }: { id: string; text: string; mentions?: string[] }) => api.post(`/tasks/${id}/comments`, { text, mentions }), onSuccess: invalidate }),
    toggleChecklist: useMutation({ mutationFn: ({ id, itemId }: { id: string; itemId: string }) => api.patch(`/tasks/${id}/checklist/${itemId}`), onSuccess: invalidate }),
    upload: useMutation({
      mutationFn: ({ id, file }: { id: string; file: File }) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/tasks/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      },
      onSuccess: invalidate,
    }),
  };
}

// ---------- Projects ----------
export function useProjects(params: Record<string, string | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return useQuery({
    queryKey: ['projects', clean],
    queryFn: async () => (await api.get<Project[]>('/projects', { params: clean })).data,
  });
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get<Project>(`/projects/${id}`)).data,
    enabled: !!id,
  });
}

export function useProjectMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['projects'] });
    qc.invalidateQueries({ queryKey: ['project'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: ['activity'] });
  };
  return {
    create: useMutation({ mutationFn: (body: Partial<Project>) => api.post('/projects', body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<Project> }) => api.put(`/projects/${id}`, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/projects/${id}`), onSuccess: invalidate }),
  };
}

// ---------- Users ----------
export function useUsers(params: Record<string, string | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return useQuery({
    queryKey: ['users', clean],
    queryFn: async () => (await api.get<User[]>('/users', { params: clean })).data,
  });
}

export function useTeamPerformance(managerId?: string) {
  return useQuery({
    queryKey: ['team-performance', managerId],
    queryFn: async () => (await api.get('/users/team/performance', { params: managerId ? { manager: managerId } : {} })).data,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['users'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['team-performance'] });
  };
  return {
    create: useMutation({ mutationFn: (body: Partial<User> & { password: string }) => api.post('/users', body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<User> }) => api.put(`/users/${id}`, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/users/${id}`), onSuccess: invalidate }),
  };
}

// ---------- Departments ----------
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<Department[]>('/departments')).data,
  });
}

export function useDepartmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['departments'] });
  return {
    create: useMutation({ mutationFn: (body: Partial<Department>) => api.post('/departments', body), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<Department> }) => api.put(`/departments/${id}`, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/departments/${id}`), onSuccess: invalidate }),
  };
}

// ---------- Notifications ----------
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<{ notifications: Notification[]; unread: number }>('/notifications')).data,
    refetchInterval: 20000,
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  return {
    markRead: useMutation({ mutationFn: (id: string) => api.patch(`/notifications/${id}/read`), onSuccess: invalidate }),
    markAllRead: useMutation({ mutationFn: () => api.patch('/notifications/read-all'), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.delete(`/notifications/${id}`), onSuccess: invalidate }),
  };
}

// ---------- Activity ----------
export function useActivity(params: Record<string, string | undefined> = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return useQuery({
    queryKey: ['activity', clean],
    queryFn: async () => (await api.get<Activity[]>('/activity', { params: clean })).data,
  });
}
