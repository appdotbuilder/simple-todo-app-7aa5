import { z } from 'zod';

// Task schema with proper handling
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field for optional description
  completed: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  description: z.string().nullable().optional() // Can be null or omitted
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks (mark as completed/incomplete)
export const updateTaskInputSchema = z.object({
  id: z.number(),
  completed: z.boolean()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;