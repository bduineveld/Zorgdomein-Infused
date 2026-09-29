// Zorgdomein Infused — service worker.
// Beheert de snelkoppelingen (chrome.storage.sync) en biedt een kleine API aan
// HIS-extensies (Bricks Infused, later andere) via externally_connectable.
// Welke extensies mogen praten staat in manifest.json → externally_connectable.ids
// (zie manifest.ids.md; JSON ondersteunt geen comments).

const ZD_ORIGIN = 'https://www.zorgdomein.nl';
const ZD_DASHBOARD_URL = ZD_ORIGIN + '/dashboard';

const defaultOptions = {
  zorgdomeinDashboardLinks: true,
  zorgdomeinLinks: []
};

/** Volledige zorgdomein-URL → pad; paden blijven ongewijzigd. */
function toZdPath(link) {
  if (!link || typeof link !== 'string') return '';
  const trimmed = link.trim();
  if (trimmed.startsWith(ZD_ORIGIN + '/')) return trimmed.replace(ZD_ORIGIN, '');
  return trimmed;
}

function toZdUrl(link) {
  const path = toZdPath(link);
  if (!path) return ZD_DASHBOARD_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return ZD_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}

function sanitizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .filter((l) => l && typeof l.name === 'string' && l.name.trim())
    .map((l) => ({
      name: l.name.trim(),
      link: toZdPath(l.link || ''),
      episodelijstNodig: !!l.episodelijstNodig
    }));
}

function getLinks() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['zorgdomeinLinks', 'zorgdomeinDashboardLinks'], (data) => {
      resolve({
        links: sanitizeLinks(data.zorgdomeinLinks || []),
        dashboardLinks: data.zorgdomeinDashboardLinks !== false
      });
    });
  });
}

/**
 * Onthoud welk formulier geopend moet worden zodra ZorgDomein op het dashboard
 * landt (na SSO-login vanuit het HIS). content_zd_dash.js pakt dit op (max 60s).
 */
function setPendingLink(link) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({
      lastClickedLink: toZdPath(link),
      lastClickedTimestamp: Date.now()
    }, () => resolve());
  });
}

function openOptions(focusTarget) {
  const open = () => chrome.runtime.openOptionsPage && chrome.runtime.openOptionsPage();
  if (focusTarget) {
    chrome.storage.local.set({ optionsFocusTarget: focusTarget }, open);
  } else {
    open();
  }
}

/**
 * Standalone: formulier direct openen (ZorgDomein stuurt zelf door naar login indien nodig).
 * Bewust geen setPendingLink: anders springt een later bezoek aan het dashboard (<60s) nog eens door.
 */
async function openLink(link, sender) {
  const createOpts = { url: toZdUrl(link) };
  if (sender && sender.tab && typeof sender.tab.index === 'number') {
    createOpts.index = sender.tab.index + 1;
    if (sender.tab.windowId != null) createOpts.windowId = sender.tab.windowId;
  }
  await chrome.tabs.create(createOpts);
}

async function importLinks(links, onlyIfEmpty) {
  const incoming = sanitizeLinks(links);
  const current = await getLinks();
  if (onlyIfEmpty && current.links.length > 0) {
    return { ok: true, imported: 0, skipped: 'not-empty' };
  }
  await new Promise((resolve) => chrome.storage.sync.set({ zorgdomeinLinks: incoming }, resolve));
  return { ok: true, imported: incoming.length };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(defaultOptions), (data) => {
    const missing = {};
    Object.keys(defaultOptions).forEach((k) => {
      if (data[k] === undefined) missing[k] = defaultOptions[k];
    });
    if (Object.keys(missing).length) chrome.storage.sync.set(missing);
  });
});

// Intern (eigen popup, opties en content scripts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  if (message.type === 'getDefaults') {
    sendResponse({ defaultOptions });
    return true;
  }
  if (message.type === 'openOptionsPage') {
    openOptions(message.focusTarget);
    sendResponse({ ok: true });
    return true;
  }
  if (message.type === 'zorgdomein.openLink') {
    openLink(message.link, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
    return true;
  }
  return false;
});

// Extern: HIS-extensies (whitelist in manifest.json → externally_connectable.ids)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  const reply = (promise) => {
    promise
      .then((resp) => sendResponse(resp))
      .catch((err) => sendResponse({ ok: false, error: String(err && err.message || err) }));
    return true;
  };

  switch (message.type) {
    case 'zorgdomein.ping':
      sendResponse({ ok: true, version: chrome.runtime.getManifest().version });
      return true;

    case 'zorgdomein.getLinks':
      return reply(getLinks().then((r) => ({ ok: true, ...r })));

    case 'zorgdomein.setPendingLink':
      return reply(setPendingLink(message.link).then(() => ({ ok: true })));

    case 'zorgdomein.openLink':
      return reply(openLink(message.link, sender).then(() => ({ ok: true })));

    case 'zorgdomein.importLinks':
      return reply(importLinks(message.links, message.onlyIfEmpty !== false));

    case 'zorgdomein.openOptions':
      openOptions(message.focusTarget || 'zorgdomein');
      sendResponse({ ok: true });
      return true;

    default:
      return false;
  }
});
