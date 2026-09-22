import 'fake-indexeddb/auto';
import * as db from '../src/db/nudgeDb';

async function runPersistenceTest() {
  console.log('--- Step 1: Initializing DB and checking seeded tasks ---');
  const initialTasks = await db.getAllTasks();
  console.log(`Initial tasks loaded: ${initialTasks.length}`);
  if (initialTasks.length === 0) {
    throw new Error('Expected initial seed tasks to be populated');
  }

  console.log('--- Step 2: Creating a new task ("Plant lavender in herb garden") ---');
  const created = await db.addTask({
    title: 'Plant lavender in herb garden',
    timeLabel: '4:00 PM',
    dateLabel: 'Today',
    category: 'Home',
    priority: 'Important',
    isDone: false,
  });
  console.log(`Task created with ID: ${created.id}, title: "${created.title}"`);

  console.log('--- Step 3: Simulating page refresh (re-reading from IndexedDB store) ---');
  const reloadedTasks = await db.getAllTasks();
  const foundTask = reloadedTasks.find((t) => t.id === created.id);

  if (!foundTask) {
    throw new Error('Task did NOT survive page refresh simulation!');
  }
  console.log(`✓ SUCCESS: Task survived refresh! Found: "${foundTask.title}" (Priority: ${foundTask.priority})`);

  console.log('--- Step 4: Updating / completing the task ---');
  foundTask.isDone = true;
  foundTask.completedAt = Date.now();
  await db.updateTask(foundTask);

  console.log('--- Step 5: Simulating a second page refresh to verify completion persistence ---');
  const afterUpdateTasks = await db.getAllTasks();
  const completedTask = afterUpdateTasks.find((t) => t.id === created.id);
  if (!completedTask?.isDone) {
    throw new Error('Task completion status did not persist!');
  }
  console.log('✓ SUCCESS: Task completed state persisted across reload!');

  console.log('--- Step 6: Deleting the task ---');
  await db.deleteTask(created.id);
  const afterDeleteTasks = await db.getAllTasks();
  const deletedTask = afterDeleteTasks.find((t) => t.id === created.id);
  if (deletedTask) {
    throw new Error('Task still appears after deletion!');
  }
  console.log('✓ SUCCESS: Task deletion persisted! Task properly filtered out.');

  console.log('\n>>> ALL INDEXEDDB PERSISTENCE TESTS PASSED! <<<');
}

runPersistenceTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
