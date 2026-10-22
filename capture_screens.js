import puppeteer from 'puppeteer-core';
import db from './src/config/db.js';
import fs from 'node:fs';
import path from 'node:path';

const SCREENS_DIR = path.resolve('screens');
if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const APP_URL = 'http://localhost:5050';

const sampleTasks = [
  {
    title: 'Implement JWT User Authentication',
    description: 'Set up JWT access token, refresh token rotation, and bcrypt password hashing for secure API routes.',
    status: 'completed'
  },
  {
    title: 'Design Dark Mode UI with Tailwind & Alpine',
    description: 'Implement Zinc shadcn/ui theme with translucent backdrop blur, subtle borders, and smooth modal transitions.',
    status: 'in_progress'
  },
  {
    title: 'Set up MySQL Connection Pool & Migrations',
    description: 'Configure mysql2/promise connection pool with automatic reconnect, prepared statements, and error handling.',
    status: 'completed'
  },
  {
    title: 'Build Todo CRUD REST API Endpoints',
    description: 'Create POST /api/todos, GET /api/todos, PUT /api/todos/:id, and DELETE /api/todos/:id with Joi validation.',
    status: 'in_progress'
  },
  {
    title: 'Add Client-Side Input Validation & Toast Alerts',
    description: 'Ensure title length validation, prevent empty submission, and display responsive toast notifications.',
    status: 'pending'
  },
  {
    title: 'Write Automated Integration Tests',
    description: 'Create test suites for input validation, database query edge cases, and unexpected server failures.',
    status: 'pending'
  }
];

async function clearTodos() {
  await db.query('DELETE FROM todos');
  await db.query('ALTER TABLE todos AUTO_INCREMENT = 1');
}

async function insertTasks() {
  for (const t of sampleTasks) {
    await db.query(
      'INSERT INTO todos (title, description, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [t.title, t.description, t.status]
    );
  }
}

async function run() {
  console.log('Clearing database for empty state capture...');
  await clearTodos();

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,800']
  });

  const page = await browser.newPage();

  // Clear localStorage so cached todos do not linger
  await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('1. Capturing 01_dashboard_empty_state.png...');
  await page.screenshot({ path: path.join(SCREENS_DIR, '01_dashboard_empty_state.png'), fullPage: false });

  console.log('2. Opening New Task modal and capturing 02_add_task_modal.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.isCreateModalOpen = true;
    alpine.newTodo.title = 'Integrate Payment Gateway & Webhooks';
    alpine.newTodo.description = 'Configure Stripe checkout session, webhook signature verification, and recurring billing.';
    alpine.newTodo.status = 'pending';
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENS_DIR, '02_add_task_modal.png'), fullPage: false });

  // Close modal
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.isCreateModalOpen = false;
  });

  console.log('Populating valid realistic tasks into MySQL...');
  await insertTasks();

  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  console.log('3. Capturing 03_all_tasks_dashboard.png...');
  await page.screenshot({ path: path.join(SCREENS_DIR, '03_all_tasks_dashboard.png'), fullPage: false });

  console.log('4. Filtering by Pending and capturing 04_filter_pending_tasks.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.activeFilter = 'pending';
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENS_DIR, '04_filter_pending_tasks.png'), fullPage: false });

  console.log('5. Filtering by In Progress and capturing 05_filter_in_progress.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.activeFilter = 'in_progress';
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENS_DIR, '05_filter_in_progress.png'), fullPage: false });

  console.log('6. Filtering by Completed and capturing 06_filter_completed_tasks.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.activeFilter = 'completed';
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENS_DIR, '06_filter_completed_tasks.png'), fullPage: false });

  console.log('7. Searching tasks and capturing 07_search_filter.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.activeFilter = 'all';
    alpine.searchQuery = 'Authentication';
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENS_DIR, '07_search_filter.png'), fullPage: false });

  // Reset search
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.searchQuery = '';
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('8. Opening Edit Task modal and capturing 08_edit_task_modal.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    const target = alpine.todos.find(t => t.title.includes('Tailwind'));
    if (target) alpine.openEditModal(target);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENS_DIR, '08_edit_task_modal.png'), fullPage: false });

  // Close edit modal
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.isEditModalOpen = false;
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('9. Opening Delete Confirmation modal and capturing 09_delete_confirmation_modal.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    const target = alpine.todos.find(t => t.title.includes('Integration Tests')) || alpine.todos[0];
    if (target) alpine.openDeleteModal(target);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENS_DIR, '09_delete_confirmation_modal.png'), fullPage: false });

  // Close delete modal
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.isDeleteModalOpen = false;
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('10. Triggering Toast Notification and capturing 10_action_success_toast.png...');
  await page.evaluate(() => {
    const alpine = Alpine.$data(document.querySelector('[x-data]'));
    alpine.showToast('Task updated successfully!', 'success');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENS_DIR, '10_action_success_toast.png'), fullPage: false });

  await browser.close();
  console.log('All 10 screenshots captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
