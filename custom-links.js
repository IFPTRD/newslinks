document.addEventListener('DOMContentLoaded', () => {
  const editToggle = document.getElementById('edit-toggle');
  const containers = document.querySelectorAll('.links-container');
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
      remove: 'Remove'
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
      remove: 'Supprimer'
    }
  };

  const labels = text[lang];
  const defaultLinks = {};

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
      return null;
    }
  }

  function saveLinks(category, links) {
    localStorage.setItem('links_' + category, JSON.stringify(links));
  }

  function render(container, links) {
    container.innerHTML = '';
    const category = container.dataset.category;
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
      removeBtn.textContent = '×';
      removeBtn.title = labels.remove;
      removeBtn.addEventListener('click', () => {
        links.splice(index, 1);
        saveLinks(category, links);
        render(container, links);
        showEditControls(container);
      });

      wrapper.appendChild(a);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);
    });

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
        <input type="text" placeholder="${labels.name}" aria-label="${labels.name}" required>
        <input type="url" placeholder="${labels.url}" aria-label="${labels.url}" required>
        <select aria-label="${labels.type}">
          <option value="google-link">${labels.external}</option>
          <option value="official-link">${labels.official}</option>
        </select>
        <button type="submit">${labels.add}</button>
        <button type="button" class="reset-btn">${labels.reset}</button>
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
        saveLinks(category, links);
        nameInput.value = '';
        urlInput.value = '';
        typeSelect.value = 'google-link';
        render(container, links);
        showEditControls(container);
      });

      form.querySelector('.reset-btn').addEventListener('click', () => {
        localStorage.removeItem('links_' + category);
        render(container, defaultLinks[category].slice());
        showEditControls(container);
      });
    }
  }

  function hideEditControls(container) {
    const form = container.querySelector('.add-link-form');
    if (form) form.remove();
  }
});

