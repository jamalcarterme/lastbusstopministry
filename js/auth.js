// Last Bus Stop Ministry - Auth Helpers
(function (global) {
  const api = global.LBSM_API;

  function toast(message, type) {
    let container = document.getElementById('lbsmToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lbsmToastContainer';
      container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:10000;display:flex;flex-direction:column;gap:0.5rem;max-width:90vw;';
      document.body.appendChild(container);
    }
    const colors = {
      success: '#007a3d',
      error: '#e54848',
      info: '#0a2e5c',
    };
    const toastEl = document.createElement('div');
    toastEl.textContent = message;
    toastEl.style.cssText = `background:${colors[type] || colors.info};color:#fff;padding:0.85rem 1.25rem;border-radius:0.6rem;box-shadow:0 10px 25px rgba(0,0,0,0.18);font-weight:600;font-size:0.92rem;opacity:0;transform:translateY(-10px);transition:all 0.25s ease;max-width:380px;`;
    container.appendChild(toastEl);
    requestAnimationFrame(() => {
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(-10px)';
      setTimeout(() => toastEl.remove(), 300);
    }, 4200);
  }

  function redirectAfterLogin(user) {
    window.location.href = 'dashboard.html';
  }

  function requireAuth() {
    if (!api.isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  function logout() {
    api.clearSession();
    window.location.href = 'index.html';
  }

  function initNavbarAuthState() {
    const user = api.getUser();
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');

    if (user && api.isLoggedIn()) {
      [loginBtn, mobileLoginBtn].forEach((btn) => {
        if (!btn) return;
        btn.textContent = `Hi, ${user.name.split(' ')[0]}`;
        btn.setAttribute('href', 'dashboard.html');
        btn.onclick = null;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'dashboard.html';
        });
      });
    }
  }

  async function handleLoginSubmit(form, opts = {}) {
    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    global.LBSM_LOADER.button(submitBtn, true, 'Logging in');
    global.LBSM_LOADER.show('Logging you in...');
    try {
      const data = await api.auth.login(email, password);
      api.setToken(data.token);
      api.setUser(data.user);
      toast(data.message || 'Login successful', 'success');
      redirectAfterLogin(data.user);
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      global.LBSM_LOADER.button(submitBtn, false);
      global.LBSM_LOADER.hide(true);
    }
  }

  async function handleRegisterSubmit(form) {
    const name = form.querySelector('#registerName').value.trim();
    const email = form.querySelector('#registerEmail').value.trim();
    const phone = form.querySelector('#registerPhone').value.trim();
    const password = form.querySelector('#registerPassword').value;
    const departmentField = form.querySelector('#registerDepartment');
    const department = departmentField ? departmentField.value : '';
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!department) {
      toast('Please select your department', 'error');
      return;
    }

    global.LBSM_LOADER.button(submitBtn, true, 'Creating account');
    global.LBSM_LOADER.show('Creating your account...');
    try {
      const data = await api.auth.register({ name, email, password, phone, department });
      api.setToken(data.token);
      api.setUser(data.user);
      toast(data.message || 'Registration successful', 'success');
      redirectAfterLogin(data.user);
    } catch (err) {
      const detail = err.errors && err.errors.length ? err.errors[0].msg : null;
      toast(detail || err.message || 'Registration failed', 'error');
    } finally {
      global.LBSM_LOADER.button(submitBtn, false);
      global.LBSM_LOADER.hide(true);
    }
  }

  global.LBSM_AUTH = {
    toast,
    requireAuth,
    logout,
    initNavbarAuthState,
    handleLoginSubmit,
    handleRegisterSubmit,
  };
})(window);
