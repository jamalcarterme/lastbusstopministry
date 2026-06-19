// Last Bus Stop Ministry - Bouncing Logo Loader Controller
(function (global) {
  const LOGO_SRC = '/assets/images/logo.png';
  let overlayEl = null;
  let overlayCount = 0;

  function buildStage(text) {
    return `
      <div class="lbsm-loader-stage">
        <div class="lbsm-bounce-track">
          <div class="lbsm-bounce-ring"></div>
          <div class="lbsm-bounce-logo">
            <img src="${LOGO_SRC}" alt="Loading">
          </div>
        </div>
        <div class="lbsm-bounce-shadow"></div>
        <div class="lbsm-loader-dots">
          <span></span><span></span><span></span><span></span>
        </div>
        ${text ? `<p class="lbsm-loader-text">${text}</p>` : ''}
      </div>
    `;
  }

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'lbsm-loader-overlay';
    overlayEl.id = 'lbsmLoaderOverlay';
    overlayEl.innerHTML = buildStage('Loading...');
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  function showOverlay(text) {
    overlayCount++;
    const el = ensureOverlay();
    const textEl = el.querySelector('.lbsm-loader-text');
    if (textEl && text) textEl.textContent = text;
    el.classList.add('lbsm-active');
  }

  function hideOverlay(force) {
    overlayCount = force ? 0 : Math.max(0, overlayCount - 1);
    if (overlayCount === 0 && overlayEl) {
      overlayEl.classList.remove('lbsm-active');
    }
  }

  function renderInline(container, text) {
    if (!container) return;
    container.innerHTML = `<div class="lbsm-loader-inline">${buildStage(text || '')}</div>`;
  }

  function setButtonLoading(button, isLoading, loadingLabel) {
    if (!button) return;
    if (isLoading) {
      button.dataset.lbsmOriginalHtml = button.innerHTML;
      button.disabled = true;
      button.classList.add('lbsm-btn-loading');
      const label = loadingLabel || 'Please wait';
      button.innerHTML = `<span>${label}</span><span class="lbsm-btn-loading-dots"><span></span><span></span><span></span></span>`;
    } else {
      button.disabled = false;
      button.classList.remove('lbsm-btn-loading');
      if (button.dataset.lbsmOriginalHtml) {
        button.innerHTML = button.dataset.lbsmOriginalHtml;
        delete button.dataset.lbsmOriginalHtml;
      }
    }
  }

  global.LBSM_LOADER = {
    show: showOverlay,
    hide: hideOverlay,
    inline: renderInline,
    button: setButtonLoading,
  };
})(window);
