import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { projectApi, ProjectListItem } from '../services/api';

// Dashboard page showing all user's projects
// This is the main landing page after login
export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Fetch all projects using React Query with optimized caching
  const { data: projects, isLoading, error } = useQuery<ProjectListItem[]>({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Mutation for creating new project
  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectApi.create(data.name, data.description),
    onSuccess: () => {
      // Refresh project list after creation
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNewProjectForm(false);
      setNewProjectName('');
      setNewProjectDescription('');
    },
  });

  // Mutation for updating project
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      projectApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProjectId(null);
    },
  });

  // Mutation for deleting project
  const deleteProjectMutation = useMutation({
    mutationFn: projectApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Handle new project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate({
      name: newProjectName,
      description: newProjectDescription || undefined,
    });
  };

  // Handle edit project start
  const handleEditStart = (e: React.MouseEvent, project: ProjectListItem) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
  };

  // Handle edit project save
  const handleEditSave = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    updateProjectMutation.mutate({
      id: projectId,
      data: {
        name: editProjectName,
        description: editProjectDescription || undefined,
      },
    });
  };

  // Handle edit cancel
  const handleEditCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
  };

  // Handle project deletion
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project? All tasks will be deleted.')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with New Project button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Project
          </button>
        </div>

        {/* New Project Form */}
        {showNewProjectForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter project description"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>

              {createProjectMutation.isError && (
                <p className="text-sm text-red-600">
                  {createProjectMutation.error instanceof Error
                    ? createProjectMutation.error.message
                    : 'Failed to create project'}
                </p>
              )}
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {error instanceof Error ? error.message : 'Failed to load projects'}
            </p>
          </div>
        )}

        {/* Projects Grid */}
        {projects && projects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No projects yet. Create your first project to get started!</p>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                {editingProjectId === project.id ? (
                  // Edit mode
                  <form onSubmit={(e) => handleEditSave(e, project.id)} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                      <input
                        type="text"
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editProjectDescription}
                        onChange={(e) => setEditProjectDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!editProjectName.trim() || updateProjectMutation.isPending}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 text-sm"
                      >
                        {updateProjectMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // View mode
                  <Link to={`/projects/${project.id}`} className="block p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={(e) => handleEditStart(e, project)}
                          className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                          title="Edit project"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          title="Delete project"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{project.taskCount} tasks</span>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
