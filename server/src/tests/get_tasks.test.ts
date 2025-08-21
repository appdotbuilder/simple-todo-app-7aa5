import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tasks ordered by creation date (newest first)', async () => {
    // Create test tasks with different creation times
    const firstTask = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'The oldest task',
        completed: false
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTask = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'A newer task',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTask = await db.insert(tasksTable)
      .values({
        title: 'Third Task',
        description: null, // Test nullable description
        completed: false
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Should be ordered by creation date (newest first)
    expect(result[0].title).toEqual('Third Task');
    expect(result[1].title).toEqual('Second Task');
    expect(result[2].title).toEqual('First Task');

    // Verify all fields are returned correctly
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].completed).toBe(false);
    expect(result[0].description).toBeNull();

    expect(result[1].completed).toBe(true);
    expect(result[1].description).toEqual('A newer task');

    expect(result[2].completed).toBe(false);
    expect(result[2].description).toEqual('The oldest task');
  });

  it('should handle tasks with same creation timestamp correctly', async () => {
    // Insert multiple tasks in a single transaction to ensure same timestamp
    const tasks = await db.insert(tasksTable)
      .values([
        {
          title: 'Task A',
          description: 'First task',
          completed: false
        },
        {
          title: 'Task B',
          description: 'Second task',
          completed: true
        },
        {
          title: 'Task C',
          description: 'Third task',
          completed: false
        }
      ])
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // All tasks should be returned
    const titles = result.map(task => task.title);
    expect(titles).toContain('Task A');
    expect(titles).toContain('Task B');
    expect(titles).toContain('Task C');

    // Verify all required fields are present
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return tasks with all field types correctly', async () => {
    await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test description',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    // Verify field types
    expect(typeof task.id).toBe('number');
    expect(typeof task.title).toBe('string');
    expect(typeof task.description).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Verify values
    expect(task.title).toEqual('Test Task');
    expect(task.description).toEqual('Test description');
    expect(task.completed).toBe(true);
  });

  it('should handle large number of tasks efficiently', async () => {
    // Create multiple tasks
    const taskData = Array.from({ length: 50 }, (_, i) => ({
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      completed: i % 2 === 0 // Alternate between completed and not completed
    }));

    await db.insert(tasksTable)
      .values(taskData)
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(50);
    
    // Verify ordering (should be by creation date desc)
    // Since they're created in batch, we mainly check that all are returned
    const titles = result.map(task => task.title);
    expect(titles).toContain('Task 1');
    expect(titles).toContain('Task 25');
    expect(titles).toContain('Task 50');

    // Verify data integrity
    result.forEach((task, index) => {
      expect(task.id).toBeDefined();
      expect(task.title).toMatch(/^Task \d+$/);
      expect(task.description).toMatch(/^Description for task \d+$/);
      expect(typeof task.completed).toBe('boolean');
    });
  });
});