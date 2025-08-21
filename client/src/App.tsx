import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Task interface
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state with proper typing for nullable fields
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null // Explicitly null, not undefined
  });

  // useCallback to memoize function used in useEffect
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await trpc.createTask.mutate(formData);
      // Update tasks list with explicit typing in setState callback
      setTasks((prev: Task[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: taskId,
        completed: !completed
      });
      // Update the task in the list
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? { ...task, completed: !completed, updated_at: updatedTask.updated_at } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const result = await trpc.deleteTask.mutate({ id: taskId });
      if (result.success) {
        // Remove task from the list
        setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Task Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                className="text-lg"
                required
              />
              <Textarea
                placeholder="Add a description (optional)"
                // Handle nullable field with fallback to empty string
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null // Convert empty string back to null
                  }))
                }
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isCreating || !formData.title.trim()} 
                className="w-full"
                size="lg"
              >
                {isCreating ? 'Creating...' : '➕ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No tasks yet. Create your first task above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Circle className="w-6 h-6 text-yellow-500" />
                  Pending Tasks ({pendingTasks.length})
                </h2>
                <div className="space-y-3">
                  {pendingTasks.map((task: Task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                              {/* Handle nullable description */}
                              {task.description && (
                                <p className="text-gray-600 mt-1">{task.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Created: {task.created_at.toLocaleDateString()} at {task.created_at.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Pending</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                {pendingTasks.length > 0 && <Separator className="my-8" />}
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  Completed Tasks ({completedTasks.length})
                </h2>
                <div className="space-y-3">
                  {completedTasks.map((task: Task) => (
                    <Card key={task.id} className="bg-green-50 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-700 line-through">{task.title}</h3>
                              {/* Handle nullable description */}
                              {task.description && (
                                <p className="text-gray-500 mt-1 line-through">{task.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Completed: {task.updated_at.toLocaleDateString()} at {task.updated_at.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-500">Completed</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;