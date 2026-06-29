export type Role = 'admin' | 'manager' | 'employee';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus =
  | 'not_started'
  | 'assigned'
  | 'in_progress'
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

export interface Project {
  _id: string;
  name: string;
  key?: string;
  description?: string;
  department?: Department;
  manager?: User;
  priority: Priority;
  status: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  color: string;
  taskCount?: number;
  completedCount?: number;
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
  description?: string;
  project?: Project;
  department?: Department;
  type: 'admin_task' | 'subtask';
  parentTask?: Task | string;
  assignedTo?: User;
  assignedBy?: User;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  startDate?: string;
  dueDate?: string;
  instructions?: string;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  comments: Comment[];
  managerReview?: Review;
  adminReview?: Review;
  accepted?: boolean;
  isDraft?: boolean;
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
