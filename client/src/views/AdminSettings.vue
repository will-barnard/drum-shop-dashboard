<template>
  <div class="admin-page">
    <h1>Admin Settings</h1>
    <p class="section-subtitle">Manage users and app configuration.</p>

    <!-- Create User -->
    <section class="card create-user-section">
      <h2>Create User</h2>
      <form @submit.prevent="handleCreateUser">
        <div v-if="createError" class="error-msg">{{ createError }}</div>
        <div v-if="createSuccess" class="success-msg">{{ createSuccess }}</div>

        <div class="form-row">
          <div class="form-group">
            <label for="newName">Name</label>
            <input id="newName" v-model="newUser.name" type="text" required />
          </div>
          <div class="form-group">
            <label for="newEmail">Email</label>
            <input id="newEmail" v-model="newUser.email" type="email" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="newPass">Password</label>
            <input id="newPass" v-model="newUser.password" type="password" required />
          </div>
          <div class="form-group">
            <label for="newRole">Role</label>
            <select id="newRole" v-model="newUser.role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary" :disabled="creating">
          {{ creating ? 'Creating…' : 'Create User' }}
        </button>
      </form>
    </section>

    <!-- Users List -->
    <section class="card users-section">
      <h2>Users</h2>
      <div v-if="loadingUsers" class="loading">Loading users…</div>
      <table v-else class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td class="role-badge">{{ u.role }}</td>
            <td>{{ formatDate(u.created_at) }}</td>
            <td>
              <button
                v-if="u.role !== 'super_admin'"
                class="btn btn-danger btn-sm"
                @click="handleDelete(u)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Add App -->
    <section class="card create-app-section">
      <h2>Add App</h2>
      <form @submit.prevent="handleCreateApp">
        <div v-if="appCreateError" class="error-msg">{{ appCreateError }}</div>
        <div v-if="appCreateSuccess" class="success-msg">{{ appCreateSuccess }}</div>
        <div class="form-row">
          <div class="form-group">
            <label for="appName">Name</label>
            <input id="appName" v-model="newApp.name" type="text" required />
          </div>
          <div class="form-group">
            <label for="appUrl">URL</label>
            <input id="appUrl" v-model="newApp.url" type="url" required placeholder="https://" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="appIcon">Icon (emoji)</label>
            <input id="appIcon" v-model="newApp.icon" type="text" placeholder="🔗" maxlength="8" />
          </div>
          <div class="form-group">
            <label for="appDesc">Description</label>
            <input id="appDesc" v-model="newApp.description" type="text" />
          </div>
        </div>
        <button class="btn btn-primary" :disabled="appCreating">
          {{ appCreating ? 'Adding…' : 'Add App' }}
        </button>
      </form>
    </section>

    <!-- Edit App -->
    <section v-if="editingApp" class="card edit-app-section">
      <h2>Edit App</h2>
      <form @submit.prevent="handleUpdateApp">
        <div v-if="appEditError" class="error-msg">{{ appEditError }}</div>
        <div class="form-row">
          <div class="form-group">
            <label>Name</label>
            <input v-model="editApp.name" type="text" required />
          </div>
          <div class="form-group">
            <label>URL</label>
            <input v-model="editApp.url" type="url" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Icon (emoji)</label>
            <input v-model="editApp.icon" type="text" maxlength="8" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="editApp.description" type="text" />
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn btn-primary" :disabled="appUpdating">{{ appUpdating ? 'Saving…' : 'Save' }}</button>
          <button type="button" class="btn btn-secondary" @click="editingApp = null">Cancel</button>
        </div>
      </form>
    </section>

    <!-- Apps List -->
    <section class="card apps-list-section">
      <h2>Apps</h2>
      <div v-if="loadingApps" class="loading">Loading apps…</div>
      <table v-else class="users-table">
        <thead>
          <tr>
            <th>Icon</th>
            <th>Name</th>
            <th>URL</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in apps" :key="a.id">
            <td class="app-icon-cell">{{ a.icon }}</td>
            <td>{{ a.name }}</td>
            <td><a :href="a.url" target="_blank" rel="noopener">{{ a.url }}</a></td>
            <td>{{ a.description }}</td>
            <td class="row-actions">
              <button class="btn btn-secondary btn-sm" @click="startEdit(a)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="handleDeleteApp(a)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// ── Apps ──────────────────────────────────────────────────────────────────────
const apps = ref([]);
const loadingApps = ref(true);

const newApp = reactive({ name: '', url: '', icon: '', description: '' });
const appCreating = ref(false);
const appCreateError = ref('');
const appCreateSuccess = ref('');

const editingApp = ref(null);
const editApp = reactive({ name: '', url: '', icon: '', description: '' });
const appUpdating = ref(false);
const appEditError = ref('');

async function fetchApps() {
  loadingApps.value = true;
  const res = await fetch('/api/apps', { credentials: 'include' });
  const data = await res.json();
  apps.value = data.apps ?? [];
  loadingApps.value = false;
}

async function handleCreateApp() {
  appCreateError.value = '';
  appCreateSuccess.value = '';
  appCreating.value = true;
  try {
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...newApp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add app');
    appCreateSuccess.value = `"${data.app.name}" added.`;
    newApp.name = '';
    newApp.url = '';
    newApp.icon = '';
    newApp.description = '';
    await fetchApps();
  } catch (e) {
    appCreateError.value = e.message;
  } finally {
    appCreating.value = false;
  }
}

function startEdit(app) {
  editingApp.value = app;
  editApp.name = app.name;
  editApp.url = app.url;
  editApp.icon = app.icon;
  editApp.description = app.description;
  appEditError.value = '';
}

async function handleUpdateApp() {
  appEditError.value = '';
  appUpdating.value = true;
  try {
    const res = await fetch(`/api/apps/${editingApp.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...editApp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update app');
    editingApp.value = null;
    await fetchApps();
  } catch (e) {
    appEditError.value = e.message;
  } finally {
    appUpdating.value = false;
  }
}

async function handleDeleteApp(app) {
  if (!confirm(`Delete "${app.name}"?`)) return;
  await fetch(`/api/apps/${app.id}`, { method: 'DELETE', credentials: 'include' });
  if (editingApp.value?.id === app.id) editingApp.value = null;
  await fetchApps();
}
// ─────────────────────────────────────────────────────────────────────────────

const users = ref([]);
const loadingUsers = ref(true);

const newUser = reactive({ name: '', email: '', password: '', role: 'user' });
const creating = ref(false);
const createError = ref('');
const createSuccess = ref('');

async function fetchUsers() {
  loadingUsers.value = true;
  const res = await fetch('/api/admin/users', { credentials: 'include' });
  const data = await res.json();
  users.value = data.users;
  loadingUsers.value = false;
}

async function handleCreateUser() {
  createError.value = '';
  createSuccess.value = '';
  creating.value = true;

  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...newUser }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');

    createSuccess.value = `User "${data.user.name}" created.`;
    newUser.name = '';
    newUser.email = '';
    newUser.password = '';
    newUser.role = 'user';
    await fetchUsers();
  } catch (e) {
    createError.value = e.message;
  } finally {
    creating.value = false;
  }
}

async function handleDelete(user) {
  if (!confirm(`Delete user "${user.name}"?`)) return;
  await fetch(`/api/admin/users/${user.id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await fetchUsers();
}

function formatDate(iso) {
  return new Date(iso + 'Z').toLocaleDateString();
}

onMounted(() => {
  fetchUsers();
  fetchApps();
});
</script>

<style scoped>
.admin-page h1 {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.section-subtitle {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.create-user-section {
  margin-bottom: 1.5rem;
}

.create-user-section h2,
.users-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  text-align: left;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.users-table th {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.role-badge {
  text-transform: capitalize;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
}

.loading {
  color: var(--color-text-muted);
}

.create-app-section,
.edit-app-section {
  margin-bottom: 1.5rem;
}

.create-app-section h2,
.edit-app-section h2,
.apps-list-section h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.app-icon-cell {
  font-size: 1.25rem;
  text-align: center;
}

.row-actions {
  display: flex;
  gap: 0.4rem;
}

.edit-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.users-table td a {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.85rem;
  word-break: break-all;
}

.users-table td a:hover {
  text-decoration: underline;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
}
</style>
