export type Role = 'admin' | 'manager' | 'employee';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus =
  | 'not_started'
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'in_progress'
  | 'paused'
  | 'submitted_for_review'
  | 'manager_approved'
  | 'manager_rejected'
  | 'sent_to_admin'
  | 'admin_approved'
  | 'admin_rejected'
  | 'completed'
  | 'overdue';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  jobTitle?: string;
  phone?: string;
  department?: Department | string;
  manager?: User | string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  color: string;
  head?: User;
}

export interface Milestone {
  _id?: string;
  title: string;
  date?: string;
  done?: boolean;
}

export interface Project {
  _id: string;
  name: string;
  key?: string;
  clientName?: string;
  description?: string;
  goals?: string[];
  milestones?: Milestone[];
  department?: Department;
  manager?: User;
  priority: Priority;
  status: string;
  budget?: number;
  startDate?: string;
  dueDate?: string;
  timeline?: string;
  progress: number;
  color: string;
  completedAt?: string;
  taskCount?: number;
  completedCount?: number;
  // Present on the rich project-detail endpoint
  tasks?: Task[];
  team?: User[];
  stats?: { total: number; completed: number; inReview: number; overdue: number; progress: number };
}

export interface Comment {
  _id: string;
  author: User;
  text: string;
  mentions?: User[];
  createdAt: string;
}

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface ChecklistItem {
  _id: string;
  text: string;
  done: boolean;
  required?: boolean;
}

export interface AcceptanceCriterion {
  _id: string;
  text: string;
  acknowledged: boolean;
}

export interface ReviewChecklistItem {
  _id: string;
  text: string;
  done: boolean;
}

export interface Review {
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  reviewedBy?: User;
  reviewedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  taskCode?: string;
  description?: string;
  project?: Project;
  department?: Department;
  type: 'admin_task' | 'subtask';
  parentTask?: Task | string;
  dependencies?: Task[];
  assignedTo?: User;
  assignedBy?: User;
  reviewer?: User;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  instructions?: string;
  tags?: string[];
  checklist: ChecklistItem[];
  acceptanceCriteria?: AcceptanceCriterion[];
  attachments: Attachment[];
  comments: Comment[];
  managerReview?: Review;
  adminReview?: Review;
  managerChecklist?: ReviewChecklistItem[];
  adminChecklist?: ReviewChecklistItem[];
  accepted?: boolean;
  declineReason?: string;
  isDraft?: boolean;
  locked?: boolean;
  completedAt?: string;
  timeWorked?: number;
  timerStartedAt?: string | null;
  subtasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  task?: { _id: string; title: string };
  project?: { _id: string; name: string };
  read: boolean;
  createdAt: string;
}

export interface Activity {
  _id: string;
  actor?: User;
  action: string;
  message: string;
  task?: { _id: string; title: string };
  project?: { _id: string; name: string };
  createdAt: string;
}
