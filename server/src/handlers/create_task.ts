import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new task and persisting it in the database.
    // It should insert the task with title and optional description, setting completed to false by default.
    return Promise.resolve({
        id: Math.floor(Math.random() * 1000), // Placeholder ID
        title: input.title,
        description: input.description || null, // Handle nullable field
        completed: false,
        created_at: new Date(), // Placeholder date
        updated_at: new Date() // Placeholder date
    } as Task);
};