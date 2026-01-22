import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, taskApi, exportApi, ProjectDetail, UpdateTaskData } from '../services/api';

// Project detail page showing project info and all tasks
// Includes task management and export functionality
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  
  const [isExporting, setIsExporting] = useState(false);

  // Fetch project details with all tasks with optimized caching
  const { data: project, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id!),
    enabled: !!id,
    staleTime: 20000, // Consider data fresh for 20 seconds
    gcTime: 180000, // Keep in cache for 3 minutes
  });

  // Mutation for creating new task
  const createTaskMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setShowNewTaskForm(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
    },
  });

  // Mutation for updating task with optimistic updates
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskData }) =>
      taskApi.update(taskId, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project', id] });
      
      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(['project', id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['project', id], (old: ProjectDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map(task =>
            task.id === taskId ? { ...task, ...data } : task
          ),
        };
      });
      
      return { previousProject };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(['project', id], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  // Mutation for deleting task
  const deleteTaskMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  // Mutation for creating export
  const createExportMutation = useMutation({
    mutationFn: exportApi.create,
    onSuccess: async (data) => {
      setIsExporting(true);
      
      // Poll until export is ready, then auto-download
      const pollInterval = setInterval(async () => {
        try {
          const status = await exportApi.getStatus(data.exportId);
          
          if (status.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            // Automatically trigger download
            await exportApi.download(data.exportId);
          } else if (status.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsExporting(false);
            alert('Export failed. Please try again.');
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsExporting(false);
          console.error('Export polling error:', error);
        }
      }, 1000); // Poll every 1 second
    },
  });

  // Handle new task creation
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    createTaskMutation.mutate({
      projectId: id,
      title: newTaskTitle,
      description: newTaskDescription || undefined,
      priority: newTaskPriority,
    });
  };

  // Handle task status change
  const handleStatusChange = (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    updateTaskMutation.mutate({
      taskId,
      data: { status: newStatus },
    });
  };

  // Handle task deletion
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Handle edit task start
  const handleEditStart = (task: any) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);
  };

  // Handle edit task save
  const handleEditSave = (taskId: string) => {
    updateTaskMutation.mutate({
      taskId,
      data: {
        title: editTaskTitle,
        description: editTaskDescription || undefined,
        priority: editTaskPriority,
      },
    });
    setEditingTaskId(null);
  };

  // Handle edit task cancel
  const handleEditCancel = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskPriority('MEDIUM');
  };

  // Handle export trigger - now downloads directly
  const handleExport = () => {
    if (!id) return;
    createExportMutation.mutate(id);
  };

  // Filter tasks based on status
  const filteredTasks = project?.tasks.filter((task) => {
    if (statusFilter === 'ALL') return true;
    return task.status === statusFilter;
  }) || [];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority indicator color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Failed to load project'}
          </p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-blue-500 hover:text-blue-700">
                Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || createExportMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Project'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Export in progress notification */}
        {isExporting && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">
                Preparing export... Download will start automatically when ready.
              </p>
            </div>
          </div>
        )}

        {/* Task Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('TODO')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'TODO' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('DONE')}
              className={`px-4 py-2 rounded-md ${
                statusFilter === 'DONE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Done
            </button>
          </div>

          <button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Task
          </button>
        </div>

        {/* New Task Form */}
        {showNewTaskForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                {editingTaskId === task.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editTaskDescription}
                        onChange={(e) => setEditTaskDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={editTaskPriority}
                        onChange={(e) => setEditTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(task.id)}
                        disabled={!editTaskTitle.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={task.priority} />
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.assignee && (
                          <span>Assigned to: {task.assignee.name}</span>
                        )}
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE')}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                 
                    </div>
                    </div>
                    <div>
                             
                      <button
                        onClick={() => handleEditStart(task)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
