// Base URL for API calls
// In production, this would come from environment variables
const API_BASE_URL = 'http://localhost:5000/api';

// Type definitions for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Helper function to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Helper function to make authenticated API calls
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  // Set up headers with auth token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle non-JSON responses like file downloads
  if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'application/octet-stream') {
    return response.blob() as unknown as T;
  }
  
  const data = await response.json();
  
  // Throw error if request failed
  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  
  return data.data;
}

// Auth API calls
export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  
  login: (email: string, password: string) =>
    apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Project API calls
export const projectApi = {
  getAll: () =>
    apiRequest<ProjectListItem[]>('/projects'),
  
  getById: (id: string) =>
    apiRequest<ProjectDetail>('/projects/' + id),
  
  create: (name: string, description?: string) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  
  update: (id: string, data: { name?: string; description?: string }) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Task API calls
export const taskApi = {
  create: (data: CreateTaskData) =>
    apiRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: UpdateTaskData) =>
    apiRequest<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Export API calls
export const exportApi = {
  create: (projectId: string) =>
    apiRequest<{ exportId: string; status: string; message: string }>(`/projects/${projectId}/export`, {
      method: 'POST',
    }),
  
  getStatus: (exportId: string) =>
    apiRequest<ExportStatus>(`/exports/${exportId}`),
  
  getAll: () =>
    apiRequest<ExportRecord[]>('/exports'),
  
  download: async (exportId: string) => {
    // For file downloads, we need to fetch with auth headers then trigger download
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_BASE_URL}/exports/${exportId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Download failed');
    }
    
    // Get the blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-export-${exportId}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
}

export interface ProjectListItem extends Project {
  taskCount: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProjectDetail extends Project {
  tasks: Task[];
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  dueDate?: string;
}

export interface ExportStatus {
  id: string;
  projectId: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  filePath: string | null;
  createdAt: string;
  completedAt: string | null;
  downloadUrl: string | null;
}

export interface ExportRecord {
  id: string;
  projectId: string;
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  filePath: string | null;
  createdAt: string;
  completedAt: string | null;
  project: {
    name: string;
  };
}
