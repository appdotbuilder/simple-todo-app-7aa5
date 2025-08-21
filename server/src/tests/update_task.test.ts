import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completed status to true', async () => {
    // Create a test task first
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A test task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Update the task to completed
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the returned task
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A test task');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should update task completed status to false', async () => {
    // Create a completed task first
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Update the task to not completed
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: false
    };

    const result = await updateTask(updateInput);

    // Verify the returned task
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the task in database', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        description: 'Testing database update',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    await updateTask(updateInput);

    // Query the database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toEqual(taskId);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].description).toEqual('Testing database update');
    expect(tasks[0].completed).toBe(true);
    expect(tasks[0].updated_at > originalUpdatedAt).toBe(true);
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999, // Non-existent task ID
      completed: true
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should handle task with null description', async () => {
    // Create a task with null description
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the returned task handles null description correctly
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Create a test task
    const createResult = await db.insert(tasksTable)
      .values({
        title: 'Timestamp Test Task',
        description: 'Testing timestamp update',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the task
    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify updated_at timestamp was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
    
    // Verify other timestamps remain unchanged
    expect(result.created_at).toEqual(createResult[0].created_at);
  });
});