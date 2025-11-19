document.addEventListener('DOMContentLoaded', () => {
  const editToggle = document.getElementById('edit-toggle');
  const containers = document.querySelectorAll('.links-container');
  const backToTopBtn = document.getElementById("back-to-top-btn");
  const searchInput = document.getElementById('search-input');
  const noResultsMsg = document.getElementById('no-results');
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
      noLinks: 'No links available.'
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
      noLinks: 'Aucun lien disponible.'
    }
  };

  const labels = text[lang];
  const defaultLinks = {};

  // Back to top logic
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Search logic
  if (searchInput) {
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

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      let hasVisibleRows = false;

      document.querySelectorAll('tbody tr').forEach(row => {
        const provinceName = row.querySelector('.province-name').textContent.toLowerCase();
        const abbreviations = provinceAbbreviations[provinceName] || [];
        const matchesAbbreviation = abbreviations.some(abbr => abbr.includes(term));

        if (provinceName.includes(term) || matchesAbbreviation) {
          row.classList.remove('hidden');
          hasVisibleRows = true;
        } else {
          row.classList.add('hidden');
        }
      });

      if (noResultsMsg) {
        if (hasVisibleRows) {
          noResultsMsg.classList.remove('visible');
        } else {
          noResultsMsg.classList.add('visible');
        }
      }
    });
  }

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
    render(container, stored ? stored : links.slice());
  });

  if (editToggle) {
    editToggle.textContent = labels.edit;
    editToggle.addEventListener('click', () => {
      document.body.classList.toggle('editing');
      if (document.body.classList.contains('editing')) {
        editToggle.textContent = labels.done;
        containers.forEach(showEditControls);
      } else {
        editToggle.textContent = labels.edit;
        containers.forEach(hideEditControls);
      }
    });
  }

  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function getStoredLinks(category) {
    try {
      return JSON.parse(localStorage.getItem('links_' + category));
    } catch (e) {
      console.error("Failed to load links", e);
      return null;
    }
  }

  function saveLinks(category, links) {
    try {
      localStorage.setItem('links_' + category, JSON.stringify(links));
      return true;
    } catch (e) {
      console.error("Failed to save links", e);
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

    // Clear previous timeout if exists
    if (toast.timeoutId) clearTimeout(toast.timeoutId);

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
        removeBtn.addEventListener('click', () => {
          if (confirm(labels.remove + '?')) {
            links.splice(index, 1);
            if (saveLinks(category, links)) {
              showToast(labels.removed);
              render(container, links);
              showEditControls(container);
            }
          }
        });

        wrapper.appendChild(a);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
      });
    }

    if (document.body.classList.contains('editing')) {
      showEditControls(container);
    }
  }

  function showEditControls(container) {
    const category = container.dataset.category;
    if (!container.querySelector('.add-link-form')) {
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

      form.addEventListener('submit', e => {
        e.preventDefault();
        const nameInput = form.querySelector('input[type="text"]');
        const urlInput = form.querySelector('input[type="url"]');
        const typeSelect = form.querySelector('select');
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        if (!name || !url) return;

        const links = getStoredLinks(category) || defaultLinks[category].slice();
        links.push({ text: name, url: url, className: typeSelect.value });

        if (saveLinks(category, links)) {
          showToast(labels.saved);
          nameInput.value = '';
          urlInput.value = '';
          typeSelect.value = 'google-link';
          render(container, links);
          showEditControls(container);
        }
      });

      form.querySelector('.reset-btn').addEventListener('click', () => {
        if (confirm(labels.reset + '?')) {
          localStorage.removeItem('links_' + category);
          showToast(labels.resetMsg);
          render(container, defaultLinks[category].slice());
          showEditControls(container);
        }
      });
    }
  }

  function hideEditControls(container) {
    const form = container.querySelector('.add-link-form');
    if (form) form.remove();
  }
});

