import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing task', async () => {
    // Create a test task first
    const testTask = await createTestTask({
      title: 'Task to Delete',
      description: 'This task will be deleted'
    });

    const deleteInput: DeleteTaskInput = {
      id: testTask.id
    };

    const result = await deleteTask(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify the task is actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    const deleteInput: DeleteTaskInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteTask(deleteInput);

    // Should return false for non-existent task
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting one task', async () => {
    // Create multiple test tasks
    const task1 = await createTestTask({
      title: 'Keep Task 1',
      description: 'This task should remain'
    });

    const task2 = await createTestTask({
      title: 'Delete Task',
      description: 'This task will be deleted'
    });

    const task3 = await createTestTask({
      title: 'Keep Task 2',
      description: 'This task should also remain'
    });

    // Delete only task2
    const deleteInput: DeleteTaskInput = {
      id: task2.id
    };

    const result = await deleteTask(deleteInput);
    expect(result.success).toBe(true);

    // Verify task2 is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();
    expect(deletedTask).toHaveLength(0);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();
    
    expect(remainingTasks).toHaveLength(2);
    
    const taskIds = remainingTasks.map(task => task.id);
    expect(taskIds).toContain(task1.id);
    expect(taskIds).toContain(task3.id);
    expect(taskIds).not.toContain(task2.id);
  });

  it('should handle deletion of completed tasks', async () => {
    // Create a completed task
    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This completed task will be deleted',
        completed: true
      })
      .returning()
      .execute();

    const deleteInput: DeleteTaskInput = {
      id: completedTask[0].id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify the completed task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTask[0].id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should handle deletion of tasks with null description', async () => {
    // Create a task with null description
    const taskWithNullDesc = await createTestTask({
      title: 'Task with No Description'
    });

    const deleteInput: DeleteTaskInput = {
      id: taskWithNullDesc.id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify the task is deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskWithNullDesc.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });
});