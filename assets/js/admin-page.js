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
  const promoNameSuggestions = document.getElementById('promo-name-suggestions');
  const promoImage = document.getElementById('promo-image');
  const promoImageCredit = document.getElementById('promo-image-credit');
  const promoImageFile = document.getElementById('promo-image-file');
  const promoImagePreviewWrap = document.getElementById('promo-image-preview-wrap');
  const promoImagePreview = document.getElementById('promo-image-preview');
  const promoImageRemove = document.getElementById('promo-image-remove');
  const promoImageUrlToggle = document.getElementById('promo-image-url-toggle');
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

  // ---------- Predlozi naziva iz kataloga analiza (slobodan unos i dalje radi) ----------
  if (window.Biotest.loadCatalog) {
    window.Biotest.loadCatalog().then(({ tests }) => {
      const seen = new Set();
      const frag = document.createDocumentFragment();
      tests.forEach((t) => {
        if (seen.has(t.displayName)) return;
        seen.add(t.displayName);
        const opt = document.createElement('option');
        opt.value = t.displayName;
        frag.appendChild(opt);
      });
      promoNameSuggestions.appendChild(frag);
    }).catch(() => { /* predlozi su samo pogodnost, nisu neophodni */ });
  }

  // ---------- Slika: biranje fajla sa računara umesto ručnog otpremanja na GitHub ----------
  // Slika se smanji i sabije u browseru, pa se sačuva direktno kao deo akcije u bazi
  // (data URL) — nema potrebe za GitHub upload ili poseban hosting servis.
  let pendingImageDataUrl = null; // null = nema izabranog fajla u ovoj sesiji izmene

  function resizeImageFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        img.onerror = reject;
        img.onload = () => {
          const MAX_DIM = 900;
          let { width, height } = img;
          if (Math.max(width, height) > MAX_DIM) {
            const scale = MAX_DIM / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showImagePreview(src) {
    promoImagePreview.src = src;
    promoImagePreviewWrap.style.display = 'block';
  }

  function clearImagePreview() {
    promoImagePreview.src = '';
    promoImagePreviewWrap.style.display = 'none';
  }

  promoImageFile.addEventListener('change', () => {
    const file = promoImageFile.files[0];
    if (!file) return;
    resizeImageFile(file).then((dataUrl) => {
      pendingImageDataUrl = dataUrl;
      showImagePreview(dataUrl);
      promoImage.value = '';
    }).catch(() => {
      promoFormMsg.textContent = 'Nije uspelo učitavanje slike — probaj drugi fajl.';
      promoFormMsg.className = 'promo-status-msg err';
      promoFormMsg.style.display = 'block';
    });
  });

  promoImageRemove.addEventListener('click', () => {
    pendingImageDataUrl = null;
    promoImageFile.value = '';
    clearImagePreview();
  });

  promoImageUrlToggle.addEventListener('click', () => {
    const showing = promoImage.style.display !== 'none';
    promoImage.style.display = showing ? 'none' : 'block';
    promoImageUrlToggle.textContent = showing ? 'nalepi URL umesto toga' : 'sakrij polje za URL';
    if (!showing) promoImage.focus();
  });

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
    pendingImageDataUrl = null;
    promoImageFile.value = '';
    promoImageCredit.value = '';
    clearImagePreview();
    promoImage.style.display = 'none';
    promoImageUrlToggle.textContent = 'nalepi URL umesto toga';
    formTitle.textContent = 'Nova akcija';
    promoSubmit.textContent = 'Sačuvaj akciju';
    promoCancel.style.display = 'none';
    promoFormMsg.style.display = 'none';
  }

  function fillFormForEdit(promo) {
    promoIdInput.value = promo.id;
    promoName.value = promo.name || '';
    pendingImageDataUrl = null;
    promoImageFile.value = '';
    if (promo.imageUrl) {
      showImagePreview(promo.imageUrl);
      promoImage.value = promo.imageUrl;
    } else {
      clearImagePreview();
      promoImage.value = '';
    }
    promoImageCredit.value = promo.imageCredit || '';
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
    // Redosled prvenstva za sliku: novo izabran fajl > ručno upisan URL > (kod izmene) postojeća slika.
    const imageUrl = pendingImageDataUrl || promoImage.value.trim() || (id ? undefined : null);
    const data = {
      name: promoName.value.trim(),
      oldPrice: promoOldPrice.value ? Number(promoOldPrice.value) : null,
      newPrice: Number(promoNewPrice.value),
      active: promoActive.checked,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    data.imageCredit = promoImageCredit.value.trim() || null;
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
