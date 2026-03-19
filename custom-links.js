document.addEventListener('DOMContentLoaded', () => {
  const editToggle = document.getElementById('edit-toggle');
  const containers = document.querySelectorAll('.links-container');
  const backToTopBtn = document.getElementById('back-to-top-btn');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const noResultsMsg = document.getElementById('no-results');
  const tableRows = Array.from(document.querySelectorAll('tbody tr'));
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const lang = document.documentElement.lang.startsWith('fr') ? 'fr' : 'en';

  const text = {
    en: {
      edit: 'Edit',
      done: 'Done',
      add: 'Add',
      reset: 'Reset',
      name: 'Link name',
      url: 'https://example.com',
      type: 'Source type',
      external: 'External',
      official: 'Official',
      remove: 'Remove',
      saved: 'Link saved!',
      removed: 'Link removed!',
      resetMsg: 'Links reset to default!',
      error: 'Error saving changes.',
      noLinks: 'No links available.',
      clear: 'Clear',
      filters: {
        all: 'All jurisdictions',
        provinces: 'Provinces',
        territories: 'Territories',
        national: 'Canada'
      }
    },
    fr: {
      edit: 'Modifier',
      done: 'Terminer',
      add: 'Ajouter',
      reset: 'Réinitialiser',
      name: 'Nom du lien',
      url: 'https://exemple.com',
      type: 'Type de source',
      external: 'Externe',
      official: 'Officielle',
      remove: 'Supprimer',
      saved: 'Lien enregistré !',
      removed: 'Lien supprimé !',
      resetMsg: 'Liens réinitialisés !',
      error: 'Erreur lors de l\'enregistrement.',
      noLinks: 'Aucun lien disponible.',
      clear: 'Effacer',
      filters: {
        all: 'Toutes les juridictions',
        provinces: 'Provinces',
        territories: 'Territoires',
        national: 'Canada'
      }
    }
  };

  const labels = text[lang];
  const defaultLinks = {};
  let activeFilter = 'all';

  const provinceAbbreviations = {
    'alberta': ['ab'],
    'british columbia': ['bc'],
    'colombie-britannique': ['bc'],
    'manitoba': ['mb'],
    'new brunswick': ['nb'],
    'nouveau-brunswick': ['nb'],
    'newfoundland and labrador': ['nl'],
    'terre-neuve-et-labrador': ['nl'],
    'northwest territories': ['nt'],
    'territoires du nord-ouest': ['nt'],
    'nova scotia': ['ns'],
    'nouvelle-écosse': ['ns'],
    'nunavut': ['nu'],
    'ontario': ['on'],
    'prince edward island': ['pe', 'pei'],
    'île-du-prince-édouard': ['pe', 'pei'],
    'quebec': ['qc'],
    'québec': ['qc'],
    'saskatchewan': ['sk'],
    'yukon': ['yt', 'yk'],
    'canada': ['ca', 'can']
  };

  const rowGroups = {
    'british columbia': 'provinces',
    'colombie-britannique': 'provinces',
    'alberta': 'provinces',
    'saskatchewan': 'provinces',
    'manitoba': 'provinces',
    'ontario': 'provinces',
    'quebec': 'provinces',
    'québec': 'provinces',
    'new brunswick': 'provinces',
    'nouveau-brunswick': 'provinces',
    'nova scotia': 'provinces',
    'nouvelle-écosse': 'provinces',
    'prince edward island': 'provinces',
    'île-du-prince-édouard': 'provinces',
    'newfoundland and labrador': 'provinces',
    'terre-neuve-et-labrador': 'provinces',
    'yukon': 'territories',
    'northwest territories': 'territories',
    'territoires du nord-ouest': 'territories',
    'nunavut': 'territories',
    'canada': 'national'
  };

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      backToTopBtn.classList.toggle('visible', window.scrollY > 200);
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  tableRows.forEach(row => {
    const provinceName = row.querySelector('.province-name')?.textContent.trim().toLowerCase() || '';
    row.dataset.group = rowGroups[provinceName] || 'provinces';
  });

  containers.forEach(container => {
    const name = container.closest('tr').querySelector('.province-name').textContent.trim();
    const key = slug(name);
    container.dataset.category = key;
    const links = Array.from(container.querySelectorAll('a')).map(a => ({
      text: a.textContent,
      url: a.href,
      className: a.className
    }));
    defaultLinks[key] = links;
    const stored = getStoredLinks(key);
    render(container, stored || links.slice());
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.textContent = labels.clear;
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      applyFilters();
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key !== '/' || !searchInput) return;

    const target = event.target;
    const isEditable = target instanceof HTMLElement && (
      target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    );

    if (!isEditable) {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  filterButtons.forEach(button => {
    const filter = button.dataset.filter;
    if (filter && labels.filters[filter]) {
      button.textContent = labels.filters[filter];
    }

    button.addEventListener('click', () => {
      activeFilter = filter || 'all';
      filterButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
      applyFilters();
    });
  });

  if (editToggle) {
    editToggle.textContent = labels.edit;
    editToggle.addEventListener('click', () => {
      document.body.classList.toggle('editing');
      const isEditing = document.body.classList.contains('editing');
      editToggle.textContent = isEditing ? labels.done : labels.edit;
      editToggle.setAttribute('aria-pressed', String(isEditing));
      containers.forEach(container => {
        if (isEditing) {
          showEditControls(container);
        } else {
          hideEditControls(container);
        }
      });
    });
  }

  applyFilters();

  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function getStoredLinks(category) {
    try {
      return JSON.parse(localStorage.getItem(`links_${category}`));
    } catch (error) {
      console.error('Failed to load links', error);
      return null;
    }
  }

  function saveLinks(category, links) {
    try {
      localStorage.setItem(`links_${category}`, JSON.stringify(links));
      return true;
    } catch (error) {
      console.error('Failed to save links', error);
      showToast(labels.error, 'error');
      return false;
    }
  }

  function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `show ${type}`;

    if (toast.timeoutId) {
      clearTimeout(toast.timeoutId);
    }

    toast.timeoutId = setTimeout(() => {
      toast.className = toast.className.replace('show', '').trim();
    }, 3000);
  }

  function render(container, links) {
    container.innerHTML = '';
    const category = container.dataset.category;

    if (links.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-category-msg';
      emptyMsg.textContent = labels.noLinks;
      container.appendChild(emptyMsg);
    } else {
      links.forEach((link, index) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'link-wrapper';

        const a = document.createElement('a');
        a.href = link.url;
        a.textContent = link.text;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (link.className) a.className = link.className;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-link';
        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.title = labels.remove;
        removeBtn.setAttribute('aria-label', `${labels.remove}: ${link.text}`);
        removeBtn.addEventListener('click', () => {
          if (confirm(`${labels.remove}?`)) {
            links.splice(index, 1);
            if (saveLinks(category, links)) {
              showToast(labels.removed);
              render(container, links);
              showEditControls(container);
              applyFilters();
            }
          }
        });

        wrapper.append(a, removeBtn);
        container.appendChild(wrapper);
      });
    }


    if (document.body.classList.contains('editing')) {
      showEditControls(container);
    }
  }

  function showEditControls(container) {
    const category = container.dataset.category;
    if (container.querySelector('.add-link-form')) return;

    const form = document.createElement('form');
    form.className = 'add-link-form';
    form.innerHTML = `
      <div class="form-row">
        <input type="text" placeholder="${labels.name}" aria-label="${labels.name}" required>
        <input type="url" placeholder="${labels.url}" aria-label="${labels.url}" required>
      </div>
      <div class="form-row">
        <select aria-label="${labels.type}">
          <option value="google-link">${labels.external}</option>
          <option value="official-link">${labels.official}</option>
        </select>
        <div class="form-actions">
          <button type="submit" class="add-btn">${labels.add}</button>
          <button type="button" class="reset-btn">${labels.reset}</button>
        </div>
      </div>
    `;
    container.appendChild(form);

    form.addEventListener('submit', event => {
      event.preventDefault();
      const nameInput = form.querySelector('input[type="text"]');
      const urlInput = form.querySelector('input[type="url"]');
      const typeSelect = form.querySelector('select');
      const name = nameInput.value.trim();
      const url = urlInput.value.trim();
      if (!name || !url) return;

      const links = getStoredLinks(category) || defaultLinks[category].slice();
      links.push({ text: name, url, className: typeSelect.value });

      if (saveLinks(category, links)) {
        showToast(labels.saved);
        nameInput.value = '';
        urlInput.value = '';
        typeSelect.value = 'google-link';
        render(container, links);
        showEditControls(container);
        applyFilters();
      }
    });

    form.querySelector('.reset-btn').addEventListener('click', () => {
      if (confirm(`${labels.reset}?`)) {
        localStorage.removeItem(`links_${category}`);
        showToast(labels.resetMsg);
        render(container, defaultLinks[category].slice());
        showEditControls(container);
        applyFilters();
      }
    });
  }

  function hideEditControls(container) {
    const form = container.querySelector('.add-link-form');
    if (form) form.remove();
  }


  function applyFilters() {
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    tableRows.forEach(row => {
      const provinceName = row.querySelector('.province-name')?.childNodes[0]?.textContent?.trim().toLowerCase()
        || row.querySelector('.province-name')?.textContent.trim().toLowerCase()
        || '';
      const abbreviations = provinceAbbreviations[provinceName] || [];
      const linkText = Array.from(row.querySelectorAll('.links-container a'))
        .map(link => `${link.textContent} ${link.href}`.toLowerCase())
        .join(' ');
      const matchesSearch = !term || provinceName.includes(term) || abbreviations.some(abbr => abbr.includes(term)) || linkText.includes(term);
      const matchesFilter = activeFilter === 'all' || row.dataset.group === activeFilter;
      const isVisible = matchesSearch && matchesFilter;

      row.classList.toggle('hidden', !isVisible);
      if (isVisible) visibleCount += 1;
    });

    if (clearSearchBtn) {
      clearSearchBtn.hidden = !term;
    }


    if (noResultsMsg) {
      noResultsMsg.classList.toggle('visible', visibleCount === 0);
    }
  }
});
