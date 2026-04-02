<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <p class="welcome">Welcome back, {{ auth.user?.name }}.</p>

    <section class="apps-section">
      <h2>Apps</h2>
      <div class="app-grid">
        <a
          v-for="app in apps"
          :key="app.name"
          :href="app.url"
          class="app-card card"
          target="_blank"
          rel="noopener"
        >
          <div class="app-icon">{{ app.icon }}</div>
          <div class="app-info">
            <h3>{{ app.name }}</h3>
            <p>{{ app.description }}</p>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const apps = ref([]);

onMounted(async () => {
  const res = await fetch('/api/apps', { credentials: 'include' });
  const data = await res.json();
  apps.value = data.apps ?? [];
});
</script>

<style scoped>
.dashboard h1 {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.welcome {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.apps-section h2 {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  font-weight: 500;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.app-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  text-decoration: none;
  color: var(--color-text);
  transition: border-color 0.15s, background 0.15s;
}

.app-card:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.app-icon {
  font-size: 2rem;
  flex-shrink: 0;
  padding-top: 0.1rem;
}

.app-info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.app-info p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
</style>
