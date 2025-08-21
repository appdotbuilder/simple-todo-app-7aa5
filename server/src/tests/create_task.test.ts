import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs
const basicTaskInput: CreateTaskInput = {
  title: 'Complete project documentation',
  description: 'Write comprehensive documentation for the project'
};

const taskWithoutDescription: CreateTaskInput = {
  title: 'Review code changes'
};

const taskWithNullDescription: CreateTaskInput = {
  title: 'Setup development environment',
  description: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(basicTaskInput);

    // Basic field validation
    expect(result.title).toEqual('Complete project documentation');
    expect(result.description).toEqual('Write comprehensive documentation for the project');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task without description', async () => {
    const result = await createTask(taskWithoutDescription);

    expect(result.title).toEqual('Review code changes');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with explicit null description', async () => {
    const result = await createTask(taskWithNullDescription);

    expect(result.title).toEqual('Setup development environment');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(basicTaskInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    expect(savedTask.title).toEqual('Complete project documentation');
    expect(savedTask.description).toEqual('Write comprehensive documentation for the project');
    expect(savedTask.completed).toEqual(false);
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.updated_at).toBeInstanceOf(Date);
  });

  it('should set completed to false by default', async () => {
    const result = await createTask(basicTaskInput);

    expect(result.completed).toEqual(false);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createTask(basicTaskInput);
    const afterCreate = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // created_at and updated_at should be very close (same operation)
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle multiple task creation', async () => {
    const input1: CreateTaskInput = {
      title: 'Task 1',
      description: 'First task'
    };

    const input2: CreateTaskInput = {
      title: 'Task 2',
      description: 'Second task'
    };

    const result1 = await createTask(input1);
    const result2 = await createTask(input2);

    // Should have different IDs
    expect(result1.id).not.toEqual(result2.id);

    // Both should be saved in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    
    const titles = allTasks.map(task => task.title).sort();
    expect(titles).toEqual(['Task 1', 'Task 2']);
  });
});