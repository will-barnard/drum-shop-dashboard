<template>
  <div class="login-page">
    <div class="login-card card">
      <h1>Drugan's Drums &amp; Guitars</h1>
      <p class="subtitle">Sign in to the dashboard</p>

      <form @submit.prevent="handleLogin">
        <div v-if="error" class="error-msg">{{ error }}</div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>

        <button class="btn btn-primary full-width" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

function isValidRedirect(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('.drugansdrums.com') &&
      parsed.hostname !== 'drugansdrums.com'
    );
  } catch {
    return false;
  }
}

async function handleLogin() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    const redirect = route.query.redirect;
    if (redirect && isValidRedirect(redirect)) {
      window.location.href = redirect;
    } else {
      router.push('/');
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  font-size: 1.5rem;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.full-width {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
