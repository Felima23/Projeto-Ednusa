/* ============================================================
   EDNUSA CABELEIREIROS — index.js
   JavaScript puro, sem dependências.
   ============================================================ */

/* ------------------------------------------------------------
   CONFIGURAÇÃO — ALTERE APENAS ESTE BLOCO
   ------------------------------------------------------------
   WHATSAPP_NUMERO: número no formato internacional, somente
   dígitos. Exemplo para São Paulo: '5511987654321'
   (55 = Brasil, 11 = DDD, restante = número).

   Enquanto o valor for '55SEUNUMERO', o formulário funciona em
   modo demonstrativo e avisa o visitante de que o canal ainda
   não está configurado.
   ------------------------------------------------------------ */
const CONFIG = {
  WHATSAPP_NUMERO: '55SEUNUMERO',
  MENSAGEM_PADRAO: 'Olá! Conheci o Ednusa Cabeleireiros pelo site e gostaria de consultar horários para agendamento.'
};

/* ------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------ */
const qs = (seletor, escopo = document) => escopo.querySelector(seletor);
const qsa = (seletor, escopo = document) => Array.from(escopo.querySelectorAll(seletor));

/** O usuário pediu menos movimento? */
function prefereMenosMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** O número de WhatsApp já foi configurado? */
function whatsappConfigurado() {
  return !/SEUNUMERO/i.test(CONFIG.WHATSAPP_NUMERO);
}

/** Monta a URL do WhatsApp com a mensagem codificada. */
function montarLinkWhatsApp(mensagem) {
  const texto = encodeURIComponent(mensagem || CONFIG.MENSAGEM_PADRAO);
  return `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${texto}`;
}

/* ------------------------------------------------------------
   initWhatsAppLinks — aplica o número e a mensagem a todos os
   links marcados com data-whats (header, unidades, rodapé,
   botão flutuante).
   ------------------------------------------------------------ */
function initWhatsAppLinks() {
  const links = qsa('[data-whats]');
  if (!links.length) return;

  links.forEach((link) => {
    const unidade = link.dataset.unidade;
    const mensagem = unidade
      ? `${CONFIG.MENSAGEM_PADRAO} Tenho preferência pela ${unidade}.`
      : CONFIG.MENSAGEM_PADRAO;

    link.href = montarLinkWhatsApp(mensagem);
  });
}

/* ------------------------------------------------------------
   initHeader — troca o estilo do cabeçalho ao rolar a página.
   ------------------------------------------------------------ */
function initHeader() {
  const header = qs('[data-header]');
  if (!header) return;

  let travado = false;

  const atualizar = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    travado = false;
  };

  const aoRolar = () => {
    if (travado) return;
    travado = true;
    window.requestAnimationFrame(atualizar);
  };

  atualizar();
  window.addEventListener('scroll', aoRolar, { passive: true });
}

/* ------------------------------------------------------------
   initMobileMenu — abre e fecha o menu, trava a rolagem,
   fecha com Escape, com clique em link e mantém o foco preso.
   ------------------------------------------------------------ */
function initMobileMenu() {
  const botao = qs('#burger');
  const menu = qs('[data-menu]');
  if (!botao || !menu) return;

  let aberto = false;

  const focaveis = () => qsa('a[href], button:not([disabled])', menu);

  function abrir() {
    aberto = true;
    menu.hidden = false;
    // força o reflow para que a transição de opacidade aconteça
    void menu.offsetWidth;
    menu.classList.add('is-open');
    botao.setAttribute('aria-expanded', 'true');
    botao.setAttribute('aria-label', 'Fechar menu de navegação');
    document.body.style.overflow = 'hidden';

    const primeiro = focaveis()[0];
    if (primeiro) primeiro.focus();
  }

  function fechar(devolverFoco = true) {
    if (!aberto) return;
    aberto = false;
    menu.classList.remove('is-open');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu de navegação');
    document.body.style.overflow = '';

    const esconder = () => { menu.hidden = true; };
    if (prefereMenosMovimento()) esconder();
    else window.setTimeout(esconder, 320);

    if (devolverFoco) botao.focus();
  }

  botao.addEventListener('click', () => {
    if (aberto) fechar();
    else abrir();
  });

  // Fecha ao clicar em qualquer link do menu
  qsa('a[href^="#"]', menu).forEach((link) => {
    link.addEventListener('click', () => fechar(false));
  });

  // Escape fecha; Tab fica preso dentro do menu
  document.addEventListener('keydown', (evento) => {
    if (!aberto) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
      return;
    }

    if (evento.key === 'Tab') {
      const itens = focaveis();
      if (!itens.length) return;

      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
  });

  // Ao passar para desktop, garante o menu fechado
  const desktop = window.matchMedia('(min-width: 960px)');
  desktop.addEventListener('change', (evento) => {
    if (evento.matches) fechar(false);
  });
}

/* ------------------------------------------------------------
   initScrollSpy — marca no menu a seção visível.
   ------------------------------------------------------------ */
function initScrollSpy() {
  const secoes = qsa('main [data-section], .hero[data-section]');
  const links = qsa('.nav__link');
  if (!secoes.length || !links.length || !('IntersectionObserver' in window)) return;

  const mapa = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').replace('#', '');
    mapa.set(id, link);
  });

  const marcar = (id) => {
    links.forEach((link) => link.removeAttribute('aria-current'));
    const ativo = mapa.get(id);
    if (ativo) ativo.setAttribute('aria-current', 'true');
  };

  const visiveis = new Set();

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) visiveis.add(entrada.target.id);
      else visiveis.delete(entrada.target.id);
    });

    // Mantém a ordem do documento ao escolher a seção ativa
    const ordenadas = secoes
      .map((secao) => secao.id)
      .filter((id) => visiveis.has(id));

    if (ordenadas.length) marcar(ordenadas[0]);
  }, {
    rootMargin: '-45% 0px -45% 0px',
    threshold: 0
  });

  secoes.forEach((secao) => {
    if (secao.id) observador.observe(secao);
  });
}

/* ------------------------------------------------------------
   initRevealAnimations — entrada suave dos títulos de seção.
   Sem JavaScript, o CSS revela o conteúdo sozinho.
   ------------------------------------------------------------ */
function initRevealAnimations() {
  const alvos = qsa('[data-reveal]');
  if (!alvos.length) return;

  if (prefereMenosMovimento() || !('IntersectionObserver' in window)) {
    alvos.forEach((alvo) => alvo.classList.add('is-visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas, instancia) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('is-visible');
      instancia.unobserve(entrada.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  alvos.forEach((alvo) => observador.observe(alvo));
}

/* ------------------------------------------------------------
   initGalleryLightbox — visualizador próprio da galeria.
   Fecha no botão, no clique fora e com Escape. Navega com
   botões e com as setas do teclado.
   ------------------------------------------------------------ */
function initGalleryLightbox() {
  const galeria = qs('[data-gallery]');
  const caixa = qs('[data-lightbox]');
  if (!galeria || !caixa) return;

  const botoes = qsa('.gallery__btn', galeria);
  if (!botoes.length) return;

  const palco = qs('[data-lightbox-stage]', caixa);
  const legenda = qs('[data-lightbox-caption]', caixa);
  const contador = qs('[data-lightbox-counter]', caixa);
  const fechar = qs('.lightbox__close', caixa);
  const anterior = qs('[data-lightbox-prev]', caixa);
  const proximo = qs('[data-lightbox-next]', caixa);

  let indice = 0;
  let ultimoFoco = null;

  function renderizar(novoIndice) {
    indice = (novoIndice + botoes.length) % botoes.length;

    const botao = botoes[indice];
    const midia = qs('.gallery__media', botao);

    palco.innerHTML = '';
    if (midia) {
      const copia = midia.cloneNode(true);
      copia.removeAttribute('style');
      palco.appendChild(copia);
    }

    const texto = botao.dataset.caption || '';
    legenda.textContent = texto;
    contador.textContent = `${indice + 1} / ${botoes.length}`;
  }

  function abrir(novoIndice) {
    ultimoFoco = document.activeElement;
    renderizar(novoIndice);

    caixa.hidden = false;
    void caixa.offsetWidth;
    caixa.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    fechar.focus();
  }

  function encerrar() {
    if (caixa.hidden) return;

    caixa.classList.remove('is-open');
    document.body.style.overflow = '';

    const esconder = () => {
      caixa.hidden = true;
      palco.innerHTML = '';
    };
    if (prefereMenosMovimento()) esconder();
    else window.setTimeout(esconder, 320);

    if (ultimoFoco && typeof ultimoFoco.focus === 'function') ultimoFoco.focus();
  }

  botoes.forEach((botao, i) => {
    botao.addEventListener('click', () => abrir(i));
  });

  qsa('[data-lightbox-close]', caixa).forEach((elemento) => {
    elemento.addEventListener('click', encerrar);
  });

  if (anterior) anterior.addEventListener('click', () => renderizar(indice - 1));
  if (proximo) proximo.addEventListener('click', () => renderizar(indice + 1));

  document.addEventListener('keydown', (evento) => {
    if (caixa.hidden) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      encerrar();
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      renderizar(indice - 1);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      renderizar(indice + 1);
    } else if (evento.key === 'Tab') {
      // Mantém o foco dentro do visualizador
      const itens = qsa('button', caixa);
      if (!itens.length) return;

      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
  });
}

/* ------------------------------------------------------------
   initBackToTop — mostra o botão após rolar e volta ao topo.
   ------------------------------------------------------------ */
function initBackToTop() {
  const botao = qs('[data-to-top]');
  if (!botao) return;

  let travado = false;

  const atualizar = () => {
    botao.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.9);
    travado = false;
  };

  window.addEventListener('scroll', () => {
    if (travado) return;
    travado = true;
    window.requestAnimationFrame(atualizar);
  }, { passive: true });

  botao.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefereMenosMovimento() ? 'auto' : 'smooth'
    });
    const inicio = qs('#inicio');
    if (inicio) inicio.setAttribute('tabindex', '-1');
    if (inicio) inicio.focus({ preventScroll: true });
  });

  atualizar();
}

/* ------------------------------------------------------------
   initWhatsAppForm — validação simples e envio pelo WhatsApp.
   O formulário não envia dados para servidor algum.
   ------------------------------------------------------------ */
function initWhatsAppForm() {
  const formulario = qs('#form-agendamento');
  if (!formulario) return;

  const status = qs('#form-status', document);
  const aviso = qs('[data-form-mode]', formulario);
  const configurado = whatsappConfigurado();

  if (!configurado && aviso) {
    aviso.textContent = 'Formulário demonstrativo: o número de WhatsApp do salão ainda não foi configurado. Assim que ele for informado, a mensagem passa a abrir direto no aplicativo.';
  }

  const campos = {
    nome: qs('#campo-nome'),
    telefone: qs('#campo-telefone'),
    unidade: qs('#campo-unidade'),
    servico: qs('#campo-servico'),
    mensagem: qs('#campo-mensagem')
  };

  function mostrarErro(campo, texto) {
    if (!campo) return;
    const alvo = qs(`[data-error-for="${campo.id}"]`);
    if (alvo) alvo.textContent = texto;
    campo.setAttribute('aria-invalid', 'true');
  }

  function limparErro(campo) {
    if (!campo) return;
    const alvo = qs(`[data-error-for="${campo.id}"]`);
    if (alvo) alvo.textContent = '';
    campo.removeAttribute('aria-invalid');
  }

  function validar() {
    const erros = [];

    [campos.nome, campos.telefone, campos.unidade].forEach(limparErro);

    if (!campos.nome.value.trim()) {
      mostrarErro(campos.nome, 'Informe seu nome para a equipe saber com quem falar.');
      erros.push(campos.nome);
    }

    const digitos = campos.telefone.value.replace(/\D/g, '');
    if (!digitos) {
      mostrarErro(campos.telefone, 'Informe um telefone com DDD.');
      erros.push(campos.telefone);
    } else if (digitos.length < 10 || digitos.length > 13) {
      mostrarErro(campos.telefone, 'Telefone incompleto. Use DDD e número, como (11) 90000-0000.');
      erros.push(campos.telefone);
    }

    if (!campos.unidade.value) {
      mostrarErro(campos.unidade, 'Escolha a unidade em que prefere ser atendido.');
      erros.push(campos.unidade);
    }

    return erros;
  }

  function montarMensagem() {
    const partes = [
      'Olá! Vim pelo site do Ednusa Cabeleireiros e gostaria de consultar horários.',
      '',
      `Nome: ${campos.nome.value.trim()}`,
      `Telefone: ${campos.telefone.value.trim()}`,
      `Unidade de preferência: ${campos.unidade.value}`
    ];

    if (campos.servico && campos.servico.value) {
      partes.push(`Serviço de interesse: ${campos.servico.value}`);
    }

    if (campos.mensagem && campos.mensagem.value.trim()) {
      partes.push(`Mensagem: ${campos.mensagem.value.trim()}`);
    }

    return partes.join('\n');
  }

  // Limpa o erro assim que a pessoa corrige o campo
  [campos.nome, campos.telefone, campos.unidade].forEach((campo) => {
    if (!campo) return;
    const evento = campo.tagName === 'SELECT' ? 'change' : 'input';
    campo.addEventListener(evento, () => limparErro(campo));
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const erros = validar();
    if (erros.length) {
      status.textContent = 'Revise os campos destacados para continuar.';
      erros[0].focus();
      return;
    }

    const mensagem = montarMensagem();

    if (!configurado) {
      status.textContent = 'Tudo certo com os dados. O envio ficará ativo assim que o número de WhatsApp do salão for informado. Enquanto isso, fale com a equipe pelo Instagram ou pelo Facebook.';
      return;
    }

    status.textContent = 'Abrindo o WhatsApp com a sua mensagem pronta para enviar.';
    window.open(montarLinkWhatsApp(mensagem), '_blank', 'noopener,noreferrer');
  });
}

/* ------------------------------------------------------------
   initCurrentYear — ano do rodapé sempre atualizado.
   ------------------------------------------------------------ */
function initCurrentYear() {
  qsa('[data-ano]').forEach((elemento) => {
    elemento.textContent = String(new Date().getFullYear());
  });
}

/* ------------------------------------------------------------
   Inicialização
   ------------------------------------------------------------ */
function iniciar() {
  document.documentElement.classList.add('js');

  initWhatsAppLinks();
  initHeader();
  initMobileMenu();
  initScrollSpy();
  initRevealAnimations();
  initGalleryLightbox();
  initBackToTop();
  initWhatsAppForm();
  initCurrentYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}