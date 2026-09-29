// Popup Zorgdomein Infused: snelkoppelingen direct openen (standalone gebruik).

document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version-text').textContent = manifest.version_name || `v${manifest.version}`;

  const container = document.getElementById('links');
  chrome.storage.sync.get(['zorgdomeinLinks'], (data) => {
    const links = (data.zorgdomeinLinks || []).filter((l) => l && l.name && l.link);
    if (!links.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nog geen snelkoppelingen.';
      container.appendChild(empty);
      return;
    }
    links.forEach((link) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = link.name;
      btn.title = link.link;
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'zorgdomein.openLink', link: link.link }, () => window.close());
      });
      container.appendChild(btn);
    });
  });

  document.getElementById('openZorgdomein').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.zorgdomein.nl/dashboard' });
    window.close();
  });

  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
