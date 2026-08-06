// BIOTEST — admin panel za akcije (promotions). Iza Firebase Auth prijave;
// nalog se pravi ručno u Firebase konzoli (Authentication → Users → Add user),
// nema javne registracije. Vidi README.md za podešavanje.

(function () {
  const notConfiguredEl = document.getElementById('admin-not-configured');
  const loginEl = document.getElementById('admin-login');
  const appEl = document.getElementById('admin-app');
  const userBadge = document.getElementById('admin-user-badge');
  const userEmailEl = document.getElementById('admin-user-email');

  if (!window.Biotest.firebaseReady) {
    notConfiguredEl.style.display = 'block';
    return;
  }

  const auth = window.Biotest.auth;
  const db = window.Biotest.db;
  const { icon } = window.Biotest;

  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  const promoForm = document.getElementById('promo-form');
  const promoIdInput = document.getElementById('promo-id');
  const promoName = document.getElementById('promo-name');
  const promoImage = document.getElementById('promo-image');
  const promoOldPrice = document.getElementById('promo-old-price');
  const promoNewPrice = document.getElementById('promo-new-price');
  const promoActive = document.getElementById('promo-active');
  const promoSubmit = document.getElementById('promo-submit');
  const promoCancel = document.getElementById('promo-cancel');
  const promoFormMsg = document.getElementById('promo-form-msg');
  const formTitle = document.getElementById('form-title');

  const listEl = document.getElementById('admin-list');
  const emptyEl = document.getElementById('admin-empty');
  const refreshBtn = document.getElementById('refresh-btn');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    auth.signInWithEmailAndPassword(loginEmail.value.trim(), loginPassword.value)
      .catch((err) => {
        loginError.textContent = 'Neuspešna prijava: ' + err.message;
        loginError.style.display = 'block';
      });
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginEl.style.display = 'none';
      appEl.style.display = 'block';
      userBadge.style.display = 'flex';
      userEmailEl.textContent = user.email;
      loadPromotions();
    } else {
      loginEl.style.display = 'block';
      appEl.style.display = 'none';
      userBadge.style.display = 'none';
    }
  });

  function resetForm() {
    promoForm.reset();
    promoIdInput.value = '';
    promoActive.checked = true;
    formTitle.textContent = 'Nova akcija';
    promoSubmit.textContent = 'Sačuvaj akciju';
    promoCancel.style.display = 'none';
    promoFormMsg.style.display = 'none';
  }

  function fillFormForEdit(promo) {
    promoIdInput.value = promo.id;
    promoName.value = promo.name || '';
    promoImage.value = promo.imageUrl || '';
    promoOldPrice.value = promo.oldPrice || '';
    promoNewPrice.value = promo.newPrice || '';
    promoActive.checked = Boolean(promo.active);
    formTitle.textContent = 'Izmena akcije';
    promoSubmit.textContent = 'Sačuvaj izmene';
    promoCancel.style.display = 'block';
    promoFormMsg.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  promoCancel.addEventListener('click', resetForm);

  promoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = promoIdInput.value;
    const data = {
      name: promoName.value.trim(),
      imageUrl: promoImage.value.trim() || null,
      oldPrice: promoOldPrice.value ? Number(promoOldPrice.value) : null,
      newPrice: Number(promoNewPrice.value),
      active: promoActive.checked,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (!data.name || !data.newPrice) return;

    promoSubmit.disabled = true;
    const promise = id
      ? db.collection('promotions').doc(id).update(data)
      : db.collection('promotions').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });

    promise
      .then(() => {
        resetForm();
        loadPromotions();
      })
      .catch((err) => {
        promoFormMsg.textContent = 'Greška: ' + err.message;
        promoFormMsg.className = 'promo-status-msg err';
        promoFormMsg.style.display = 'block';
      })
      .finally(() => { promoSubmit.disabled = false; });
  });

  function loadPromotions() {
    listEl.innerHTML = '<p class="field-hint">Učitavanje...</p>';
    db.collection('promotions').get().then((snap) => {
      const promos = [];
      snap.forEach((doc) => promos.push({ id: doc.id, ...doc.data() }));

      if (promos.length === 0) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
      }
      emptyEl.style.display = 'none';

      listEl.innerHTML = promos.map((p) => `
        <div class="admin-promo-row${p.active ? '' : ' is-inactive'}">
          <img class="admin-promo-thumb" src="${p.imageUrl || ''}" alt="" onerror="this.style.visibility='hidden'">
          <div class="admin-promo-info">
            <strong>${p.name}</strong>
            <span>${p.oldPrice ? p.oldPrice + ' → ' : ''}${p.newPrice} RSD ${p.active ? '' : '· neaktivna'}</span>
          </div>
          <div class="admin-promo-actions">
            <button type="button" data-edit="${p.id}" aria-label="Izmeni">${icon('edit')}</button>
            <button type="button" class="danger" data-delete="${p.id}" aria-label="Obriši">${icon('trash')}</button>
          </div>
        </div>`).join('');

      listEl.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const promo = promos.find((p) => p.id === btn.getAttribute('data-edit'));
          if (promo) fillFormForEdit(promo);
        });
      });
      listEl.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-delete');
          const promo = promos.find((p) => p.id === id);
          if (!confirm(`Obrisati akciju "${promo ? promo.name : id}"?`)) return;
          db.collection('promotions').doc(id).delete().then(loadPromotions);
        });
      });
    });
  }

  refreshBtn.addEventListener('click', loadPromotions);
})();
