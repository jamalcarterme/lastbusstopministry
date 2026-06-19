// Last Bus Stop Ministry - Dashboard App
(function () {
  const api = window.LBSM_API;
  const loader = window.LBSM_LOADER;
  const auth = window.LBSM_AUTH;

  if (!auth.requireAuth()) return;

  let currentUser = api.getUser();
  const isAdmin = currentUser && currentUser.role === 'admin';

  const viewContainer = document.getElementById('viewContainer');
  const pageTitle = document.getElementById('pageTitle');
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarUserCard = document.getElementById('sidebarUserCard');
  const appLoading = document.getElementById('lbsmAppLoading');

  const DEPT_LABELS = { men: "Men's Ministry", women: "Women's Ministry", youth: 'Youth Fellowship' };
  const AUDIENCE_LABELS = { general: 'Everyone', men: "Men's Ministry", women: "Women's Ministry", youth: 'Youth Fellowship', children: "Children's Dept (Men & Women)" };

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str === undefined || str === null ? '' : String(str);
    return div.innerHTML;
  }

  function formatMoney(n) {
    return '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function statusBadge(status) {
    const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', active: 'badge-active', inactive: 'badge-inactive' };
    return `<span class="badge ${map[status] || 'badge-inactive'}">${escapeHtml(status)}</span>`;
  }

  // ── Routes (member-accessible & admin-accessible) ──────────
  const memberRoutes = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'receipts', label: 'My Receipts', icon: '🧾' },
    { id: 'give', label: 'Give / Donate', icon: '💝' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const adminRoutes = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'admin-receipts', label: 'Review Receipts', icon: '🧾' },
    { id: 'admin-members', label: 'Members', icon: '👥' },
    { id: 'admin-payments', label: 'Payment Accounts', icon: '🏦' },
    { id: 'admin-announcements', label: 'Announcements', icon: '📢' },
    { id: 'admin-analytics', label: 'Analytics', icon: '📊' },
    { id: 'admin-audit', label: 'Audit Logs', icon: '📜' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const routes = isAdmin ? adminRoutes : memberRoutes;

  function renderSidebar() {
    sidebarNav.innerHTML = routes.map((r) =>
      `<div class="nav-item" data-route="${r.id}"><span>${r.icon}</span><span>${r.label}</span></div>`
    ).join('');
    sidebarNav.querySelectorAll('.nav-item').forEach((el) => {
      el.addEventListener('click', () => { window.location.hash = el.dataset.route; closeSidebarMobile(); });
    });

    sidebarUserCard.innerHTML = `
      <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold">${escapeHtml((currentUser.name || '?').charAt(0).toUpperCase())}</div>
      <div class="min-w-0">
        <p class="font-semibold text-sm text-gray-800 truncate">${escapeHtml(currentUser.name)}</p>
        <p class="text-xs text-gray-400 truncate">${isAdmin ? 'Administrator' : DEPT_LABELS[currentUser.department] || 'Member'}</p>
      </div>`;
  }

  function setActiveNav(routeId) {
    sidebarNav.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.route === routeId);
    });
    const found = routes.find((r) => r.id === routeId);
    pageTitle.textContent = found ? found.label : 'Dashboard';
  }

  function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('open');
  }

  document.getElementById('openSidebarBtn').addEventListener('click', () => document.getElementById('sidebar').classList.add('open'));
  document.getElementById('closeSidebarBtn').addEventListener('click', closeSidebarMobile);
  document.getElementById('logoutBtn').addEventListener('click', () => auth.logout());

  // ── Modal helper ─────────────────────────────────────────
  function openModal(innerHtml) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-overlay" id="lbsmModalOverlay"><div class="card w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">${innerHtml}</div></div>`;
    document.getElementById('lbsmModalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'lbsmModalOverlay') closeModal();
    });
  }
  function closeModal() {
    document.getElementById('modalRoot').innerHTML = '';
  }

  // ── Notifications ────────────────────────────────────────
  async function refreshNotifBadge() {
    try {
      const data = await api.notifications.unreadCount();
      const badge = document.getElementById('notifBadge');
      if (data.count > 0) {
        badge.textContent = data.count > 9 ? '9+' : data.count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch (e) { /* silent */ }
  }

  async function loadNotifPanel() {
    const list = document.getElementById('notifList');
    list.innerHTML = '<div class="p-6 text-center text-sm text-gray-400">Loading...</div>';
    try {
      const data = await api.notifications.list({ limit: 20 });
      const items = data.notifications || [];
      if (!items.length) {
        list.innerHTML = '<div class="p-6 text-center text-sm text-gray-400">No notifications yet.</div>';
        return;
      }
      list.innerHTML = items.map((n) => `
        <div class="px-4 py-3 ${n.isRead ? '' : 'bg-secondary/5'} flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800">${escapeHtml(n.title || 'Notification')}</p>
            <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(n.message || '')}</p>
            <p class="text-[10px] text-gray-400 mt-1">${formatDateTime(n.createdAt)}</p>
          </div>
          ${n.isRead ? '' : `<button class="text-[11px] text-secondary font-semibold whitespace-nowrap" data-mark-read="${n._id}">Mark read</button>`}
        </div>`).join('');
      list.querySelectorAll('[data-mark-read]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api.notifications.markRead(btn.dataset.markRead);
          loadNotifPanel();
          refreshNotifBadge();
        });
      });
    } catch (e) {
      list.innerHTML = '<div class="p-6 text-center text-sm text-red-400">Could not load notifications.</div>';
    }
  }

  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  notifBtn.addEventListener('click', () => {
    notifPanel.classList.toggle('hidden');
    if (!notifPanel.classList.contains('hidden')) loadNotifPanel();
  });
  document.addEventListener('click', (e) => {
    if (!notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.classList.add('hidden');
  });
  document.getElementById('markAllReadBtn').addEventListener('click', async () => {
    await api.notifications.markAllRead();
    loadNotifPanel();
    refreshNotifBadge();
  });

  // ════════════════════════════════════════════════════════
  // VIEWS
  // ════════════════════════════════════════════════════════

  async function viewOverview() {
    loader.inline(viewContainer, 'Loading your overview...');
    try {
      if (isAdmin) {
        const [analytics, deptData] = await Promise.all([
          api.analytics.overview(),
          api.analytics.department(),
        ]);
        const a = analytics.analytics;
        viewContainer.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            ${statCard('Total Receipts', a.receipts.total, '🧾', 'text-primary')}
            ${statCard('Pending Review', a.receipts.pending, '⏳', 'text-amber-600')}
            ${statCard('Approved', a.receipts.approved, '✅', 'text-accent')}
            ${statCard('Rejected', a.receipts.rejected, '❌', 'text-red-500')}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            ${statCard('Total Approved Giving', formatMoney(a.amounts.totalApproved), '💰', 'text-accent')}
            ${statCard("Today's Giving", formatMoney(a.amounts.today), '📅', 'text-primary')}
            ${statCard("This Week", formatMoney(a.amounts.thisWeek), '🗓️', 'text-primary')}
            ${statCard("This Month", formatMoney(a.amounts.thisMonth), '📈', 'text-primary')}
          </div>
          <div class="card p-6">
            <h3 class="font-bold text-lg text-primary mb-4">Giving by Department</h3>
            <div class="overflow-x-auto"><table>
              <thead><tr><th>Department</th><th>Members</th><th>Receipts</th><th>Total Amount</th></tr></thead>
              <tbody>
                ${deptData.departments.map((d) => `<tr>
                  <td class="font-semibold">${DEPT_LABELS[d.department] || d.department}</td>
                  <td>${d.memberCount}</td>
                  <td>${d.receiptCount}</td>
                  <td class="font-semibold text-accent">${formatMoney(d.totalAmount)}</td>
                </tr>`).join('')}
              </tbody>
            </table></div>
          </div>`;
      } else {
        const [myReceipts, visibleAnn] = await Promise.all([
          api.receipts.mine({ limit: 5 }),
          api.announcements.visible(),
        ]);
        const receipts = myReceipts.receipts || [];
        const totalApproved = receipts.filter((r) => r.approvalStatus === 'approved').reduce((s, r) => s + r.amount, 0);
        const pendingCount = receipts.filter((r) => r.approvalStatus === 'pending').length;
        viewContainer.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            ${statCard('Welcome', escapeHtml(currentUser.name.split(' ')[0]), '🙏', 'text-primary')}
            ${statCard('Pending Receipts', pendingCount, '⏳', 'text-amber-600')}
            ${statCard('Recent Approved Total', formatMoney(totalApproved), '💝', 'text-accent')}
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="card p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg text-primary">Recent Receipts</h3>
                <span class="text-xs text-secondary font-semibold cursor-pointer" data-route-link="receipts">View all →</span>
              </div>
              ${receipts.length ? receipts.map(receiptRow).join('') : '<p class="text-sm text-gray-400">No receipts uploaded yet.</p>'}
            </div>
            <div class="card p-6">
              <h3 class="font-bold text-lg text-primary mb-4">Announcements for You</h3>
              ${(visibleAnn.announcements || []).slice(0, 4).map(announcementCard).join('') || '<p class="text-sm text-gray-400">No announcements right now.</p>'}
            </div>
          </div>`;
        viewContainer.querySelectorAll('[data-route-link]').forEach((el) => el.addEventListener('click', () => window.location.hash = el.dataset.routeLink));
      }
    } catch (err) {
      viewContainer.innerHTML = errorBlock(err);
    }
  }

  function statCard(label, value, icon, colorClass) {
    return `<div class="card p-5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-2xl">${icon}</span>
      </div>
      <p class="text-2xl font-bold ${colorClass}">${value}</p>
      <p class="text-sm text-gray-500 mt-1">${label}</p>
    </div>`;
  }

  function receiptRow(r) {
    return `<div class="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div class="min-w-0">
        <p class="font-semibold text-sm text-gray-800">${formatMoney(r.amount)} <span class="text-gray-400 font-normal">• ${escapeHtml(r.paymentType)}</span></p>
        <p class="text-xs text-gray-400">${formatDate(r.uploadDate)}</p>
      </div>
      ${statusBadge(r.approvalStatus)}
    </div>`;
  }

  function announcementCard(a) {
    return `<div class="py-3 border-b border-gray-50 last:border-0">
      <div class="flex justify-between items-start gap-2 mb-1">
        <p class="font-semibold text-sm text-gray-800">${escapeHtml(a.title)}</p>
        <span class="text-[10px] text-gray-400 whitespace-nowrap">${formatDate(a.createdAt)}</span>
      </div>
      <p class="text-xs text-gray-500 leading-relaxed">${escapeHtml(a.content)}</p>
    </div>`;
  }

  function errorBlock(err) {
    return `<div class="card p-8 text-center"><p class="text-red-500 font-semibold">${escapeHtml(err.message || 'Something went wrong.')}</p></div>`;
  }

  // ── Member: My Receipts ─────────────────────────────────
  async function viewReceipts() {
    viewContainer.innerHTML = `
      <div class="flex justify-between items-center mb-5 flex-wrap gap-3">
        <p class="text-sm text-gray-500">Upload your tithe/offering receipt for verification.</p>
        <button id="uploadReceiptBtn" class="btn-primary">+ Upload Receipt</button>
      </div>
      <div id="receiptsList" class="card p-0 overflow-hidden"></div>`;
    document.getElementById('uploadReceiptBtn').addEventListener('click', openUploadReceiptModal);
    await loadMyReceipts();
  }

  async function loadMyReceipts() {
    const container = document.getElementById('receiptsList');
    loader.inline(container, 'Loading receipts...');
    try {
      const data = await api.receipts.mine({ limit: 50 });
      const items = data.receipts || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No receipts uploaded yet.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Notes</th><th>Receipt</th></tr></thead>
        <tbody>
          ${items.map((r) => `<tr>
            <td>${formatDate(r.uploadDate)}</td>
            <td class="capitalize">${escapeHtml(r.paymentType)}</td>
            <td class="font-semibold">${formatMoney(r.amount)}</td>
            <td>${statusBadge(r.approvalStatus)}</td>
            <td class="text-gray-500 text-xs max-w-[160px] truncate">${escapeHtml(r.adminNotes || '—')}</td>
            <td><a href="${api.BASE_URL}${r.receiptImage}" target="_blank" rel="noopener" class="text-secondary font-semibold text-xs hover:underline">View</a></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  function openUploadReceiptModal() {
    openModal(`
      <h3 class="text-xl font-bold text-primary mb-5">Upload Receipt</h3>
      <form id="receiptForm" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Amount (₦)</label>
          <input type="number" min="1" step="0.01" id="receiptAmount" class="input-field" required>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Payment Type</label>
          <select id="receiptType" class="input-field">
            <option value="tithe">Tithe</option>
            <option value="offering">Offering</option>
            <option value="seed">Seed</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Receipt Image</label>
          <input type="file" id="receiptImage" accept="image/*" class="input-field" required>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" class="btn-secondary" id="cancelReceiptBtn">Cancel</button>
          <button type="submit" class="btn-primary">Upload</button>
        </div>
      </form>`);
    document.getElementById('cancelReceiptBtn').addEventListener('click', closeModal);
    document.getElementById('receiptForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const amount = document.getElementById('receiptAmount').value;
      const paymentType = document.getElementById('receiptType').value;
      const fileInput = document.getElementById('receiptImage');
      if (!fileInput.files.length) { auth.toast('Please choose a receipt image', 'error'); return; }

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('paymentType', paymentType);
      formData.append('receiptImage', fileInput.files[0]);

      loader.button(submitBtn, true, 'Uploading');
      loader.show('Uploading your receipt...');
      try {
        await api.receipts.upload(formData);
        auth.toast('Receipt uploaded successfully', 'success');
        closeModal();
        loadMyReceipts();
      } catch (err) {
        auth.toast(err.message || 'Upload failed', 'error');
      } finally {
        loader.button(submitBtn, false);
        loader.hide(true);
      }
    });
  }

  // ── Member: Give ─────────────────────────────────────────
  async function viewGive() {
    viewContainer.innerHTML = `<div id="giveAccounts"></div>`;
    const container = document.getElementById('giveAccounts');
    loader.inline(container, 'Loading payment accounts...');
    try {
      const data = await api.paymentAccounts.active();
      const accounts = data.accounts || [];
      if (!accounts.length) {
        container.innerHTML = '<div class="card p-8 text-center text-gray-400">No payment accounts are available right now.</div>';
        return;
      }
      container.innerHTML = `<p class="text-sm text-gray-500 mb-5">Make your tithe, offering, or seed payment to any account below, then upload your receipt in <span class="font-semibold text-primary">My Receipts</span> for verification.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          ${accounts.map((acc) => `<div class="card p-6">
            <p class="text-xs font-semibold text-secondary mb-1">${escapeHtml(acc.bankName)}</p>
            <p class="text-2xl font-bold text-primary tracking-wide mb-2">${escapeHtml(acc.accountNumber)}</p>
            <p class="text-sm text-gray-600 font-medium">${escapeHtml(acc.accountName)}</p>
            ${acc.branchInfo ? `<p class="text-xs text-gray-400 mt-1">${escapeHtml(acc.branchInfo)}</p>` : ''}
          </div>`).join('')}
        </div>`;
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  // ── Common: Announcements (member visible feed) ─────────
  async function viewAnnouncements() {
    viewContainer.innerHTML = `<div id="announcementsFeed" class="grid grid-cols-1 gap-4 max-w-3xl"></div>`;
    const container = document.getElementById('announcementsFeed');
    loader.inline(container, 'Loading announcements...');
    try {
      const data = await api.announcements.visible();
      const items = data.announcements || [];
      if (!items.length) {
        container.innerHTML = '<div class="card p-8 text-center text-gray-400">No announcements for you right now.</div>';
        return;
      }
      container.innerHTML = items.map((a) => `<div class="card p-6">
        <div class="flex justify-between items-start gap-2 mb-2 flex-wrap">
          <h3 class="font-bold text-primary text-lg">${escapeHtml(a.title)}</h3>
          <span class="badge badge-active">${AUDIENCE_LABELS[a.targetAudience] || a.targetAudience}</span>
        </div>
        <p class="text-gray-600 leading-relaxed text-sm">${escapeHtml(a.content)}</p>
        <p class="text-xs text-gray-400 mt-3">${formatDate(a.createdAt)} • by ${escapeHtml((a.createdBy && a.createdBy.name) || 'Admin')}</p>
      </div>`).join('');
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  // ── Common: Profile ──────────────────────────────────────
  async function viewProfile() {
    viewContainer.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <div class="card p-6">
          <h3 class="font-bold text-lg text-primary mb-4">Profile Details</h3>
          <form id="profileForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" id="profileName" class="input-field" value="${escapeHtml(currentUser.name)}" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" class="input-field bg-gray-50" value="${escapeHtml(currentUser.email)}" disabled>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input type="tel" id="profilePhone" class="input-field" value="${escapeHtml(currentUser.phone || '')}">
            </div>
            ${currentUser.department ? `<div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Department</label>
              <input type="text" class="input-field bg-gray-50" value="${DEPT_LABELS[currentUser.department] || currentUser.department}" disabled>
            </div>` : ''}
            <button type="submit" class="btn-primary w-full">Save Changes</button>
          </form>
        </div>
        <div class="card p-6">
          <h3 class="font-bold text-lg text-primary mb-4">Change Password</h3>
          <form id="passwordForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
              <input type="password" id="currentPassword" class="input-field" required>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <input type="password" id="newPassword" class="input-field" minlength="8" required>
            </div>
            <button type="submit" class="btn-primary w-full">Update Password</button>
          </form>
        </div>
      </div>`;

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      loader.button(btn, true, 'Saving');
      try {
        const data = await api.auth.updateMe({
          name: document.getElementById('profileName').value.trim(),
          phone: document.getElementById('profilePhone').value.trim(),
        });
        currentUser = data.user;
        api.setUser(currentUser);
        renderSidebar();
        setActiveNav('profile');
        auth.toast('Profile updated successfully', 'success');
      } catch (err) {
        auth.toast(err.message || 'Update failed', 'error');
      } finally {
        loader.button(btn, false);
      }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const current = document.getElementById('currentPassword').value;
      const next = document.getElementById('newPassword').value;
      loader.button(btn, true, 'Updating');
      try {
        await api.auth.changePassword(current, next);
        auth.toast('Password changed successfully', 'success');
        e.target.reset();
      } catch (err) {
        auth.toast(err.message || 'Could not change password', 'error');
      } finally {
        loader.button(btn, false);
      }
    });
  }

  // ── Admin: Review Receipts ───────────────────────────────
  async function viewAdminReceipts() {
    viewContainer.innerHTML = `
      <div class="flex flex-wrap gap-3 mb-5 items-end">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select id="filterStatus" class="input-field">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Department</label>
          <select id="filterDept" class="input-field">
            <option value="">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="youth">Youth</option>
          </select>
        </div>
        <button id="applyFilters" class="btn-secondary">Apply</button>
      </div>
      <div id="adminReceiptsList" class="card p-0 overflow-hidden"></div>`;

    document.getElementById('applyFilters').addEventListener('click', loadAdminReceipts);
    await loadAdminReceipts();
  }

  async function loadAdminReceipts() {
    const container = document.getElementById('adminReceiptsList');
    loader.inline(container, 'Loading receipts...');
    const approvalStatus = document.getElementById('filterStatus').value;
    const department = document.getElementById('filterDept').value;
    try {
      const data = await api.receipts.all({ approvalStatus, department, limit: 100 });
      const items = data.receipts || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No receipts found.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Member</th><th>Dept</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Receipt</th><th>Action</th></tr></thead>
        <tbody>
          ${items.map((r) => `<tr>
            <td>
              <p class="font-semibold">${escapeHtml(r.member ? r.member.name : 'Unknown')}</p>
              <p class="text-xs text-gray-400">${escapeHtml(r.member ? r.member.email : '')}</p>
            </td>
            <td class="capitalize">${escapeHtml(r.department)}</td>
            <td class="capitalize">${escapeHtml(r.paymentType)}</td>
            <td class="font-semibold">${formatMoney(r.amount)}</td>
            <td>${formatDate(r.uploadDate)}</td>
            <td>${statusBadge(r.approvalStatus)}</td>
            <td><a href="${api.BASE_URL}${r.receiptImage}" target="_blank" rel="noopener" class="text-secondary font-semibold text-xs hover:underline">View</a></td>
            <td>
              ${r.approvalStatus === 'pending' ? `
                <div class="flex gap-2">
                  <button class="btn-success !py-1 !px-2 text-xs" data-approve="${r._id}">Approve</button>
                  <button class="btn-danger !py-1 !px-2 text-xs" data-reject="${r._id}">Reject</button>
                </div>` : '<span class="text-xs text-gray-400">Reviewed</span>'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

      container.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => approveReceiptFlow(btn.dataset.approve)));
      container.querySelectorAll('[data-reject]').forEach((btn) => btn.addEventListener('click', () => rejectReceiptFlow(btn.dataset.reject)));
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  async function approveReceiptFlow(id) {
    loader.show('Approving receipt...');
    try {
      await api.receipts.approve(id, '');
      auth.toast('Receipt approved', 'success');
      loadAdminReceipts();
    } catch (err) {
      auth.toast(err.message || 'Could not approve', 'error');
    } finally {
      loader.hide(true);
    }
  }

  function rejectReceiptFlow(id) {
    openModal(`
      <h3 class="text-xl font-bold text-primary mb-4">Reject Receipt</h3>
      <form id="rejectForm" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Reason for rejection</label>
          <textarea id="rejectNotes" rows="3" class="input-field" required></textarea>
        </div>
        <div class="flex gap-3 justify-end">
          <button type="button" id="cancelRejectBtn" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-danger">Reject Receipt</button>
        </div>
      </form>`);
    document.getElementById('cancelRejectBtn').addEventListener('click', closeModal);
    document.getElementById('rejectForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const notes = document.getElementById('rejectNotes').value.trim();
      const btn = e.target.querySelector('button[type="submit"]');
      loader.button(btn, true, 'Rejecting');
      try {
        await api.receipts.reject(id, notes);
        auth.toast('Receipt rejected', 'success');
        closeModal();
        loadAdminReceipts();
      } catch (err) {
        auth.toast(err.message || 'Could not reject', 'error');
      } finally {
        loader.button(btn, false);
      }
    });
  }

  // ── Admin: Members ────────────────────────────────────────
  async function viewAdminMembers() {
    viewContainer.innerHTML = `
      <div class="flex flex-wrap gap-3 mb-5 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-gray-500 mb-1">Search</label>
          <input type="text" id="memberSearch" class="input-field" placeholder="Search name or email">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Department</label>
          <select id="memberDeptFilter" class="input-field">
            <option value="">All</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="youth">Youth</option>
          </select>
        </div>
        <button id="memberSearchBtn" class="btn-secondary">Search</button>
      </div>
      <div id="membersList" class="card p-0 overflow-hidden"></div>`;
    document.getElementById('memberSearchBtn').addEventListener('click', loadMembers);
    await loadMembers();
  }

  async function loadMembers() {
    const container = document.getElementById('membersList');
    loader.inline(container, 'Loading members...');
    const search = document.getElementById('memberSearch').value.trim();
    const department = document.getElementById('memberDeptFilter').value;
    try {
      const data = await api.admin.members({ search, department, limit: 100 });
      const items = data.members || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No members found.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          ${items.map((m) => `<tr>
            <td class="font-semibold">${escapeHtml(m.name)}</td>
            <td class="text-gray-500">${escapeHtml(m.email)}</td>
            <td class="capitalize">${escapeHtml(m.department)}</td>
            <td>${escapeHtml(m.phone || '—')}</td>
            <td>${statusBadge(m.isActive ? 'active' : 'inactive')}</td>
            <td>${formatDate(m.createdAt)}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn-secondary !py-1 !px-2 text-xs" data-toggle="${m._id}">${m.isActive ? 'Deactivate' : 'Activate'}</button>
                <button class="btn-danger !py-1 !px-2 text-xs" data-delete="${m._id}" data-name="${escapeHtml(m.name)}">Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

      container.querySelectorAll('[data-toggle]').forEach((btn) => btn.addEventListener('click', async () => {
        loader.show('Updating member status...');
        try {
          await api.admin.toggleMemberStatus(btn.dataset.toggle);
          auth.toast('Member status updated', 'success');
          loadMembers();
        } catch (err) {
          auth.toast(err.message || 'Could not update member', 'error');
        } finally { loader.hide(true); }
      }));

      container.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
        if (!confirm(`Delete member "${btn.dataset.name}"? This cannot be undone.`)) return;
        (async () => {
          loader.show('Deleting member...');
          try {
            await api.admin.deleteMember(btn.dataset.delete);
            auth.toast('Member deleted', 'success');
            loadMembers();
          } catch (err) {
            auth.toast(err.message || 'Could not delete member', 'error');
          } finally { loader.hide(true); }
        })();
      }));
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  // ── Admin: Payment Accounts ───────────────────────────────
  async function viewAdminPayments() {
    viewContainer.innerHTML = `
      <div class="flex justify-end mb-5">
        <button id="addAccountBtn" class="btn-primary">+ Add Account</button>
      </div>
      <div id="accountsList" class="card p-0 overflow-hidden"></div>`;
    document.getElementById('addAccountBtn').addEventListener('click', () => openAccountModal());
    await loadAccounts();
  }

  async function loadAccounts() {
    const container = document.getElementById('accountsList');
    loader.inline(container, 'Loading payment accounts...');
    try {
      const data = await api.paymentAccounts.all();
      const items = data.accounts || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No payment accounts added yet.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Bank</th><th>Account Name</th><th>Account Number</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${items.map((a) => `<tr>
            <td class="font-semibold">${escapeHtml(a.bankName)}</td>
            <td>${escapeHtml(a.accountName)}</td>
            <td>${escapeHtml(a.accountNumber)}</td>
            <td class="text-gray-500">${escapeHtml(a.branchInfo || '—')}</td>
            <td>${statusBadge(a.status)}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn-secondary !py-1 !px-2 text-xs" data-edit-account="${a._id}">Edit</button>
                <button class="btn-secondary !py-1 !px-2 text-xs" data-toggle-account="${a._id}">${a.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                <button class="btn-danger !py-1 !px-2 text-xs" data-delete-account="${a._id}">Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

      const accountsById = {};
      items.forEach((a) => accountsById[a._id] = a);

      container.querySelectorAll('[data-edit-account]').forEach((btn) => btn.addEventListener('click', () => openAccountModal(accountsById[btn.dataset.editAccount])));
      container.querySelectorAll('[data-toggle-account]').forEach((btn) => btn.addEventListener('click', async () => {
        loader.show('Updating account...');
        try {
          await api.paymentAccounts.toggle(btn.dataset.toggleAccount);
          auth.toast('Account status updated', 'success');
          loadAccounts();
        } catch (err) { auth.toast(err.message || 'Update failed', 'error'); }
        finally { loader.hide(true); }
      }));
      container.querySelectorAll('[data-delete-account]').forEach((btn) => btn.addEventListener('click', () => {
        if (!confirm('Delete this payment account?')) return;
        (async () => {
          loader.show('Deleting account...');
          try {
            await api.paymentAccounts.remove(btn.dataset.deleteAccount);
            auth.toast('Account deleted', 'success');
            loadAccounts();
          } catch (err) { auth.toast(err.message || 'Delete failed', 'error'); }
          finally { loader.hide(true); }
        })();
      }));
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  function openAccountModal(account) {
    const isEdit = !!account;
    openModal(`
      <h3 class="text-xl font-bold text-primary mb-5">${isEdit ? 'Edit' : 'Add'} Payment Account</h3>
      <form id="accountForm" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
          <input type="text" id="accBank" class="input-field" value="${isEdit ? escapeHtml(account.bankName) : ''}" required>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Account Name</label>
          <input type="text" id="accName" class="input-field" value="${isEdit ? escapeHtml(account.accountName) : ''}" required>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Account Number (10 digits)</label>
          <input type="text" id="accNumber" maxlength="10" class="input-field" value="${isEdit ? escapeHtml(account.accountNumber) : ''}" required>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Branch Info (optional)</label>
          <input type="text" id="accBranch" class="input-field" value="${isEdit ? escapeHtml(account.branchInfo || '') : ''}">
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" id="cancelAccountBtn" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Add Account'}</button>
        </div>
      </form>`);
    document.getElementById('cancelAccountBtn').addEventListener('click', closeModal);
    document.getElementById('accountForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const payload = {
        bankName: document.getElementById('accBank').value.trim(),
        accountName: document.getElementById('accName').value.trim(),
        accountNumber: document.getElementById('accNumber').value.trim(),
        branchInfo: document.getElementById('accBranch').value.trim(),
      };
      loader.button(btn, true, 'Saving');
      try {
        if (isEdit) await api.paymentAccounts.update(account._id, payload);
        else await api.paymentAccounts.create(payload);
        auth.toast(`Account ${isEdit ? 'updated' : 'added'} successfully`, 'success');
        closeModal();
        loadAccounts();
      } catch (err) {
        auth.toast(err.message || 'Save failed', 'error');
      } finally {
        loader.button(btn, false);
      }
    });
  }

  // ── Admin: Announcements management ───────────────────────
  async function viewAdminAnnouncements() {
    viewContainer.innerHTML = `
      <div class="flex justify-end mb-5">
        <button id="addAnnouncementBtn" class="btn-primary">+ New Announcement</button>
      </div>
      <div id="adminAnnList" class="card p-0 overflow-hidden"></div>`;
    document.getElementById('addAnnouncementBtn').addEventListener('click', () => openAnnouncementModal());
    await loadAdminAnnouncements();
  }

  async function loadAdminAnnouncements() {
    const container = document.getElementById('adminAnnList');
    loader.inline(container, 'Loading announcements...');
    try {
      const data = await api.announcements.all({ limit: 100 });
      const items = data.announcements || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No announcements yet.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Title</th><th>Audience</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          ${items.map((a) => `<tr>
            <td class="font-semibold max-w-[220px] truncate">${escapeHtml(a.title)}</td>
            <td>${AUDIENCE_LABELS[a.targetAudience] || a.targetAudience}</td>
            <td>${statusBadge(a.isActive ? 'active' : 'inactive')}</td>
            <td>${formatDate(a.createdAt)}</td>
            <td>
              <div class="flex gap-2">
                <button class="btn-secondary !py-1 !px-2 text-xs" data-edit-ann="${a._id}">Edit</button>
                <button class="btn-danger !py-1 !px-2 text-xs" data-delete-ann="${a._id}">Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;

      const byId = {};
      items.forEach((a) => byId[a._id] = a);
      container.querySelectorAll('[data-edit-ann]').forEach((btn) => btn.addEventListener('click', () => openAnnouncementModal(byId[btn.dataset.editAnn])));
      container.querySelectorAll('[data-delete-ann]').forEach((btn) => btn.addEventListener('click', () => {
        if (!confirm('Delete this announcement?')) return;
        (async () => {
          loader.show('Deleting announcement...');
          try {
            await api.announcements.remove(btn.dataset.deleteAnn);
            auth.toast('Announcement deleted', 'success');
            loadAdminAnnouncements();
          } catch (err) { auth.toast(err.message || 'Delete failed', 'error'); }
          finally { loader.hide(true); }
        })();
      }));
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  function openAnnouncementModal(ann) {
    const isEdit = !!ann;
    openModal(`
      <h3 class="text-xl font-bold text-primary mb-5">${isEdit ? 'Edit' : 'New'} Announcement</h3>
      <form id="annForm" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Title</label>
          <input type="text" id="annTitle" class="input-field" value="${isEdit ? escapeHtml(ann.title) : ''}" required>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Content</label>
          <textarea id="annContent" rows="4" class="input-field" required>${isEdit ? escapeHtml(ann.content) : ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Audience</label>
          <select id="annAudience" class="input-field">
            <option value="general" ${isEdit && ann.targetAudience === 'general' ? 'selected' : ''}>Everyone</option>
            <option value="men" ${isEdit && ann.targetAudience === 'men' ? 'selected' : ''}>Men's Ministry</option>
            <option value="women" ${isEdit && ann.targetAudience === 'women' ? 'selected' : ''}>Women's Ministry</option>
            <option value="youth" ${isEdit && ann.targetAudience === 'youth' ? 'selected' : ''}>Youth Fellowship</option>
            <option value="children" ${isEdit && ann.targetAudience === 'children' ? 'selected' : ''}>Children's Dept (visible to Men & Women)</option>
          </select>
        </div>
        ${isEdit ? `<div>
          <label class="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" id="annActive" ${ann.isActive ? 'checked' : ''}> Active
          </label>
        </div>` : ''}
        <div class="flex gap-3 justify-end pt-2">
          <button type="button" id="cancelAnnBtn" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Publish'}</button>
        </div>
      </form>`);
    document.getElementById('cancelAnnBtn').addEventListener('click', closeModal);
    document.getElementById('annForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const payload = {
        title: document.getElementById('annTitle').value.trim(),
        content: document.getElementById('annContent').value.trim(),
        targetAudience: document.getElementById('annAudience').value,
      };
      if (isEdit) payload.isActive = document.getElementById('annActive').checked;
      loader.button(btn, true, 'Saving');
      try {
        if (isEdit) await api.announcements.update(ann._id, payload);
        else await api.announcements.create(payload);
        auth.toast(`Announcement ${isEdit ? 'updated' : 'published'}`, 'success');
        closeModal();
        loadAdminAnnouncements();
      } catch (err) {
        auth.toast(err.message || 'Save failed', 'error');
      } finally {
        loader.button(btn, false);
      }
    });
  }

  // ── Admin: Analytics ──────────────────────────────────────
  async function viewAdminAnalytics() {
    viewContainer.innerHTML = `<div id="analyticsContent"></div>`;
    const container = document.getElementById('analyticsContent');
    loader.inline(container, 'Crunching the numbers...');
    try {
      const year = new Date().getFullYear();
      const [overview, dept, monthly] = await Promise.all([
        api.analytics.overview(),
        api.analytics.department(),
        api.analytics.monthly(year),
      ]);
      const a = overview.analytics;
      const maxMonthly = Math.max(1, ...monthly.months.map((m) => m.totalAmount));
      container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          ${statCard('Total Approved Giving', formatMoney(a.amounts.totalApproved), '💰', 'text-accent')}
          ${statCard('This Month', formatMoney(a.amounts.thisMonth), '📈', 'text-primary')}
          ${statCard('Pending Reviews', a.receipts.pending, '⏳', 'text-amber-600')}
          ${statCard('Total Receipts', a.receipts.total, '🧾', 'text-primary')}
        </div>
        <div class="card p-6 mb-6">
          <h3 class="font-bold text-lg text-primary mb-5">${year} Monthly Giving Trend</h3>
          <div class="flex items-end gap-2 h-48">
            ${monthly.months.map((m) => `
              <div class="flex-1 flex flex-col items-center justify-end gap-1">
                <span class="text-[10px] text-gray-400">${m.totalAmount ? formatMoney(m.totalAmount) : ''}</span>
                <div class="w-full bg-gradient-to-t from-primary to-accent rounded-t" style="height:${Math.max(4, Math.round((m.totalAmount / maxMonthly) * 160))}px"></div>
                <span class="text-[10px] text-gray-500 font-semibold">${m.monthName.slice(0, 3)}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="card p-6">
          <h3 class="font-bold text-lg text-primary mb-4">Department Breakdown</h3>
          <div class="overflow-x-auto"><table>
            <thead><tr><th>Department</th><th>Members</th><th>Receipts</th><th>Total</th></tr></thead>
            <tbody>${dept.departments.map((d) => `<tr>
              <td class="font-semibold capitalize">${DEPT_LABELS[d.department] || d.department}</td>
              <td>${d.memberCount}</td>
              <td>${d.receiptCount}</td>
              <td class="font-semibold text-accent">${formatMoney(d.totalAmount)}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>`;
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  // ── Admin: Audit Logs ──────────────────────────────────────
  async function viewAdminAudit() {
    viewContainer.innerHTML = `<div id="auditList" class="card p-0 overflow-hidden"></div>`;
    const container = document.getElementById('auditList');
    loader.inline(container, 'Loading audit logs...');
    try {
      const data = await api.admin.auditLogs({ limit: 60 });
      const items = data.logs || [];
      if (!items.length) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">No audit logs yet.</p>';
        return;
      }
      container.innerHTML = `<div class="overflow-x-auto"><table>
        <thead><tr><th>Admin</th><th>Action</th><th>Resource</th><th>Date</th></tr></thead>
        <tbody>${items.map((l) => `<tr>
          <td class="font-semibold">${escapeHtml(l.admin ? l.admin.name : 'Unknown')}</td>
          <td class="capitalize">${escapeHtml((l.action || '').replace(/_/g, ' '))}</td>
          <td class="capitalize">${escapeHtml(l.resource)}</td>
          <td>${formatDateTime(l.createdAt)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    } catch (err) {
      container.innerHTML = errorBlock(err);
    }
  }

  // ── Router ────────────────────────────────────────────────
  const viewMap = {
    overview: viewOverview,
    receipts: viewReceipts,
    give: viewGive,
    announcements: viewAnnouncements,
    profile: viewProfile,
    'admin-receipts': viewAdminReceipts,
    'admin-members': viewAdminMembers,
    'admin-payments': viewAdminPayments,
    'admin-announcements': viewAdminAnnouncements,
    'admin-analytics': viewAdminAnalytics,
    'admin-audit': viewAdminAudit,
  };

  function handleRoute() {
    let routeId = window.location.hash.replace('#', '') || 'overview';
    if (!viewMap[routeId] || !routes.find((r) => r.id === routeId)) {
      routeId = 'overview';
      window.location.hash = 'overview';
    }
    setActiveNav(routeId);
    closeModal();
    notifPanel.classList.add('hidden');
    viewMap[routeId]();
  }

  window.addEventListener('hashchange', handleRoute);

  // ── Boot ──────────────────────────────────────────────────
  async function boot() {
    try {
      const me = await api.auth.me();
      currentUser = me.user;
      api.setUser(currentUser);
    } catch (err) {
      if (err.status === 401) {
        auth.logout();
        return;
      }
    }
    renderSidebar();
    handleRoute();
    refreshNotifBadge();
    setInterval(refreshNotifBadge, 60000);
    appLoading.classList.remove('lbsm-active');
    setTimeout(() => appLoading.remove(), 300);
  }

  boot();
})();
