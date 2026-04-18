// ============================================================
// LOGIN / LOGOUT
// ============================================================
let _loginTab = 'parent';

let _iconClickCount = 0;
let _iconClickTimer = null;
window.iconSecretClick = function() {
  _iconClickCount++;
  clearTimeout(_iconClickTimer);
  _iconClickTimer = setTimeout(() => { _iconClickCount = 0; }, 2500);
  if (_iconClickCount >= 5) {
    _iconClickCount = 0;
    switchTab('admin');
    document.getElementById('pass-inp').focus();
  }
};
window.closeAdminLogin = function() {
  switchTab(_loginTab === 'admin' ? 'parent' : _loginTab);
};
window.switchTab = function(tab) {
  _loginTab = tab;
  // tab visibility
  document.getElementById('parent-login-form').style.display = tab==='parent'?'block':'none';
  const gf = document.getElementById('guest-login-form');
  if (gf) gf.style.display = tab==='guest'?'block':'none';
  document.getElementById('admin-login-form').style.display = tab==='admin'?'block':'none';
  document.getElementById('login-err').style.display = 'none';
  // tab active state
  const tp = document.getElementById('ltab-parent');
  const tg = document.getElementById('ltab-guest');
  if (tp) tp.classList.toggle('active', tab==='parent');
  if (tg) tg.classList.toggle('active', tab==='guest');
  // button label
  const btn = document.getElementById('login-main-btn');
  if (btn) btn.textContent = tab==='guest' ? '👥 Mehmon sifatida kirish →' : 'Kirish →';
  // hide tabs row when admin form shown
  const tabsRow = document.querySelector('.login-tabs');
  if (tabsRow) tabsRow.style.display = tab==='admin'?'none':'flex';
};

window.doLogin = function() {
  const btn = document.getElementById('login-main-btn');
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 2000); }
  const errEl = document.getElementById('login-err');
  errEl.style.display = 'none';

  if (_loginTab === 'guest') { enterGuest(); return; }
  if (_loginTab === 'admin') {
    const pass = document.getElementById('pass-inp').value;
    if (pass !== DATA.settings.adminPass) {
      errEl.textContent = '❌ Noto\'g\'ri parol';
      errEl.style.display = 'block';
      return;
    }
    CU = { role: 'admin' };
    enterAdmin();
  } else {
    const pin = document.getElementById('pin-inp').value.trim();
    if (!pin) { errEl.textContent='❌ PIN kiriting'; errEl.style.display='block'; return; }
    // Find student by PIN across all groups
    let found = null;
    for (const [gid, group] of Object.entries(DATA.groups || {})) {
      for (const [sid, stu] of Object.entries(group.students || {})) {
        if (String(stu.pin) === String(pin)) {
          found = { sid, gid, name: stu.name };
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      errEl.textContent = '❌ Noto\'g\'ri PIN kod';
      errEl.style.display = 'block';
      return;
    }
    CU = { role: 'parent', ...found };
    enterParent();
  }
};

function enterAdmin() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('admin-app').style.display = 'flex';
  document.getElementById('admin-app').querySelectorAll('.bottom-nav,.gnav-btn').forEach(n => n.style.visibility = '');
  if (_isStandalone()) { _hideInstallUI(); }
  else if (_pwaPrompt || (_isIOS && _isIOS() && !_isStandalone())) { _showInstallUI(); }
  showAdminPage('home', document.querySelector('#admin-app .nav-btn'));
  updateLettersBadge();
  populateGroupSelects();
}

function enterParent() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('parent-app').style.display = 'flex';
  document.getElementById('parent-app').querySelectorAll('.bottom-nav,.gnav-btn').forEach(n => n.style.visibility = '');
  const b = document.getElementById('parent-badge');
  if (b) b.textContent = '👨‍👩‍👧 ' + CU.name.split(' ')[0];
  showParentPage('home', document.querySelector('#parent-app .nav-btn'));
  // Track last login timestamp
  const { sid, gid } = CU;
  const ts = nowTs();
  if (DATA.groups?.[gid]?.students?.[sid]) {
    DATA.groups[gid].students[sid].lastLoginAt = ts;
    try { fbUpdate('groups/' + gid + '/students/' + sid, { lastLoginAt: ts }); } catch(e) {}
  }
  // PWA install
  if (_isStandalone()) { _hideInstallUI(); }
  else if (_pwaPrompt || (_isIOS && _isIOS() && !_isStandalone())) { _showInstallUI(); }
}

window.logout = function() {
  CU = null;
  // Hide all app shells including their fixed navs
  ['admin-app','parent-app','guest-app'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      // Also hide any fixed bottom-nav inside
      el.querySelectorAll('.bottom-nav,.gnav-btn').forEach(n => n.style.visibility = 'hidden');
    }
  });
  document.getElementById('login').style.display = 'flex';
  switchTab('parent');
  if (!_isInstalled() && (_pwaPrompt || _isIOS())) {
    var lb = document.getElementById('login-install-banner');
    if (lb) lb.style.display = 'flex';
  }
  document.getElementById('pin-inp').value = '';
  document.getElementById('pass-inp').value = '';
};
