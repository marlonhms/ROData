/**
 * pix-coffee.js - Modal e Gerador de PIX para Apoio / Mimo do Projeto
 * 100% Client-side, gera BRCode oficial padrão Banco Central com CRC16.
 */

(function () {
  'use strict';

  // Configuração padrão da Chave PIX (pode ser alterada a qualquer momento)
  const PIX_CONFIG = {
    key: 'marlonhms@gmail.com', // Chave Pix do desenvolvedor
    name: 'Marlon',             // Nome do titular
    city: 'BRASIL',             // Cidade
    description: 'Cafezinho ROData' // Mensagem padrão no extrato
  };

  // Helper TLV para o padrão EMV / BRCode do Pix
  function tlv(id, value) {
    const val = String(value || '');
    // Tamanho em bytes UTF-8
    const bytes = new TextEncoder().encode(val);
    const len = String(bytes.length).padStart(2, '0');
    return `${id}${len}${val}`;
  }

  // Algoritmo CRC16-CCITT (Polinômio 0x1021, Init 0xFFFF) padrão do Banco Central
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= (str.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // Constrói a string do Pix Copia e Cola
  function generatePixPayload(key, name, city, amount, desc) {
    const cleanKey = String(key || '').trim();
    const cleanName = String(name || 'Marlon').trim().slice(0, 25);
    const cleanCity = String(city || 'BRASIL').trim().slice(0, 15);
    const cleanDesc = String(desc || 'Cafezinho ROData').trim().slice(0, 50);

    const gui = tlv('00', 'br.gov.bcb.pix');
    const keyField = tlv('01', cleanKey);
    const descField = cleanDesc ? tlv('02', cleanDesc) : '';
    const merchantAccount = tlv('26', gui + keyField + descField);

    let payload = tlv('00', '01') +
      merchantAccount +
      tlv('52', '0000') +
      tlv('53', '986');

    if (amount && Number(amount) > 0) {
      payload += tlv('54', Number(amount).toFixed(2));
    }

    payload += tlv('58', 'BR') +
      tlv('59', cleanName) +
      tlv('60', cleanCity) +
      tlv('62', tlv('05', '***')) +
      '6304';

    const checksum = crc16(payload);
    return payload + checksum;
  }

  // Toast de notificação
  function showCoffeeToast(msg) {
    let toast = document.querySelector('.coffee-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'coffee-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Copia texto para o clipboard de forma segura
  async function copyToClipboard(text, successMsg) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showCoffeeToast(successMsg || '✓ Copiado para a área de transferência!');
    } catch (err) {
      showCoffeeToast('❌ Não foi possível copiar automaticamente.');
    }
  }

  function initPixCoffee() {
    const overlay = document.getElementById('coffeeOverlay');
    const openTopbar = document.getElementById('coffeeOpen');
    const openSidebar = document.getElementById('sidebarCoffeeBtn');
    const closeBtn = document.getElementById('coffeeClose');
    const qrImg = document.getElementById('coffeeQrImg');
    const pixKeyInput = document.getElementById('pixKeyInput');
    const pixPayloadInput = document.getElementById('pixPayloadInput');
    const btnCopyPixKey = document.getElementById('btnCopyPixKey');
    const btnCopyPixPayload = document.getElementById('btnCopyPixPayload');
    const presetButtons = document.querySelectorAll('.coffee-preset');

    if (!overlay) return;

    let currentAmount = 2.00;

    function updatePix(amount) {
      currentAmount = amount;
      const payload = generatePixPayload(PIX_CONFIG.key, PIX_CONFIG.name, PIX_CONFIG.city, currentAmount, PIX_CONFIG.description);
      
      if (pixKeyInput) pixKeyInput.value = PIX_CONFIG.key;
      if (pixPayloadInput) pixPayloadInput.value = payload;
      
      if (qrImg) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(payload)}`;
        qrImg.src = qrUrl;
      }
    }

    function openModal() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('coffee-modal-open');
      updatePix(currentAmount);
    }

    function closeModal() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('coffee-modal-open');
    }

    if (openTopbar) openTopbar.addEventListener('click', openModal);
    if (openSidebar) openSidebar.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeModal();
      }
    });

    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = Number(btn.dataset.amount) || 0;
        updatePix(val);
      });
    });

    if (btnCopyPixKey && pixKeyInput) {
      btnCopyPixKey.addEventListener('click', () => {
        copyToClipboard(pixKeyInput.value, '☕ <strong>Chave PIX copiada!</strong> Obrigado pelo mimo!');
      });
    }

    if (btnCopyPixPayload && pixPayloadInput) {
      btnCopyPixPayload.addEventListener('click', () => {
        copyToClipboard(pixPayloadInput.value, '⚡ <strong>Código PIX Copia e Cola copiado!</strong> Cole no app do seu banco.');
      });
    }

    // Inicialização da primeira carga
    updatePix(currentAmount);
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPixCoffee);
  } else {
    initPixCoffee();
  }

  // Exporta globalmente caso seja necessário reconfigurar dinamicamente
  window.AureumPix = {
    setKey: function (newKey, newName) {
      if (newKey) PIX_CONFIG.key = newKey;
      if (newName) PIX_CONFIG.name = newName;
      const pixKeyInput = document.getElementById('pixKeyInput');
      if (pixKeyInput) pixKeyInput.value = PIX_CONFIG.key;
    }
  };
})();
