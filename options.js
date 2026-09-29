// Opties Zorgdomein Infused: snelkoppelingen beheren (chrome.storage.sync).

const LIST_ID = 'zorgdomein-links-list';
const ROW_CLASS = 'zorgdomein-link-row';

let dragPlaceholder = null;
function getDragPlaceholder() {
  if (!dragPlaceholder) {
    dragPlaceholder = document.createElement('div');
    dragPlaceholder.className = 'zorgdomein-drop-placeholder';
  }
  return dragPlaceholder;
}

function removeDragPlaceholder() {
  if (dragPlaceholder && dragPlaceholder.parentNode) {
    dragPlaceholder.parentNode.removeChild(dragPlaceholder);
  }
}

function setupListDragContainer() {
  const list = document.getElementById(LIST_ID);
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const ph = getDragPlaceholder();
    if (e.target === ph) return;
    const rows = Array.from(list.querySelectorAll(`.${ROW_CLASS}:not(.dragging)`));
    const before = rows.find((r) => {
      const rect = r.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (before) {
      if (ph.nextSibling !== before) list.insertBefore(ph, before);
    } else if (ph !== list.lastChild) {
      list.appendChild(ph);
    }
  });
  list.addEventListener('drop', (e) => {
    e.preventDefault();
    const dragging = list.querySelector(`.${ROW_CLASS}.dragging`);
    const ph = getDragPlaceholder();
    if (dragging && ph.parentNode === list) list.insertBefore(dragging, ph);
    removeDragPlaceholder();
  });
}

function updateEpisodelijstDisplay(toggle, checked) {
  toggle.classList.toggle('active', checked);
  toggle.title = checked
    ? 'Bricks vraagt eerst de episodelijst, klik om te veranderen'
    : 'Bricks vraagt geen episodelijst, klik om te veranderen';
}

function addZorgdomeinLinkRow(link) {
  const list = document.getElementById(LIST_ID);
  const row = document.createElement('div');
  row.className = ROW_CLASS;
  row.draggable = true;

  const handle = document.createElement('span');
  handle.textContent = '↕';
  handle.title = 'Sleep om te verplaatsen';
  handle.style.cssText = 'cursor: move; user-select: none;';

  const name = document.createElement('input');
  name.type = 'text';
  name.className = 'name';
  name.placeholder = 'Naam';
  name.value = link.name || '';

  const path = document.createElement('input');
  path.type = 'text';
  path.className = 'path';
  path.placeholder = 'Pad (bijv. /supply-matcher/supply)';
  path.value = link.link || '';

  let episodelijstNodig = !!link.episodelijstNodig;
  const toggle = document.createElement('span');
  toggle.className = 'episodelijst-toggle';
  toggle.textContent = '⚕️';
  updateEpisodelijstDisplay(toggle, episodelijstNodig);
  toggle.addEventListener('click', () => {
    episodelijstNodig = !episodelijstNodig;
    updateEpisodelijstDisplay(toggle, episodelijstNodig);
  });

  const remove = document.createElement('span');
  remove.textContent = '❌';
  remove.title = 'Verwijderen';
  remove.style.cursor = 'pointer';
  remove.addEventListener('click', () => row.remove());

  row.append(handle, name, path, toggle, remove);
  row.getLinkData = () => ({
    name: name.value.trim(),
    link: path.value.trim(),
    episodelijstNodig
  });

  row.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'drag');
    row.classList.add('dragging');
    row.style.opacity = '0.5';
  });
  row.addEventListener('dragend', () => {
    row.classList.remove('dragging');
    row.style.opacity = '';
    removeDragPlaceholder();
  });

  list.appendChild(row);
  return row;
}

function collectZorgdomeinLinks() {
  return Array.from(document.querySelectorAll(`.${ROW_CLASS}`))
    .map((row) => row.getLinkData())
    .filter((link) => link.name);
}

function showStatus(text, ms) {
  const el = document.getElementById('status');
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; }, ms || 1500);
}

function applyFocusHighlight(focusTarget) {
  if (focusTarget !== 'zorgdomein') return;
  const el = document.getElementById(LIST_ID);
  el.classList.add('focus-highlight');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.classList.remove('focus-highlight'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  setupListDragContainer();

  chrome.storage.sync.get(['zorgdomeinLinks', 'zorgdomeinDashboardLinks'], (data) => {
    document.getElementById('opt-zorgdomein-dashboard').checked = data.zorgdomeinDashboardLinks !== false;
    (data.zorgdomeinLinks || []).forEach(addZorgdomeinLinkRow);

    const queryFocus = new URLSearchParams(window.location.search).get('focus');
    if (queryFocus) {
      applyFocusHighlight(queryFocus);
    } else {
      chrome.storage.local.get(['optionsFocusTarget'], (result) => {
        if (!result.optionsFocusTarget) return;
        chrome.storage.local.remove('optionsFocusTarget');
        applyFocusHighlight(result.optionsFocusTarget);
      });
    }
  });

  document.getElementById('addZorgdomeinLink').addEventListener('click', () => {
    addZorgdomeinLinkRow({ name: '', link: '' }).querySelector('input').focus();
  });

  document.getElementById('optionsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    chrome.storage.sync.set({
      zorgdomeinDashboardLinks: document.getElementById('opt-zorgdomein-dashboard').checked,
      zorgdomeinLinks: collectZorgdomeinLinks()
    }, () => showStatus('Opgeslagen!'));
  });

  document.getElementById('closeOptions').addEventListener('click', () => window.close());
});
