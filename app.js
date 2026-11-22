/**
 * Lógica interactiva de «Dulce Encuentro»
 * Compatible con servidor local (./assets/...) y con Google Sites (iframe sandbox + Google Drive / YouTube).
 */
(function () {
  "use strict";

  const cfg = window.DULCE_CONFIG || {};
  const medios = cfg.medios || {};
  const redes = cfg.redes || {};

  // Almacenamiento seguro (Google Sites puede bloquear localStorage dentro del iframe)
  const memoriaLocal = {};
  function leerStorage(clave, defecto) {
    try {
      const val = window.localStorage.getItem(clave);
      return val !== null ? JSON.parse(val) : defecto;
    } catch {
      return Object.prototype.hasOwnProperty.call(memoriaLocal, clave) ? memoriaLocal[clave] : defecto;
    }
  }
  function guardarStorage(clave, valor) {
    memoriaLocal[clave] = valor;
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Respaldo silencioso en memoria cuando localStorage está restringido
    }
  }

  // Conversión inteligente de URLs de Google Drive o YouTube para Google Sites
  function extraerIdDrive(texto) {
    if (!texto || typeof texto !== "string") return "";
    const coincidenciaPath = texto.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (coincidenciaPath) return coincidenciaPath[1];
    const coincidenciaId = texto.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (coincidenciaId) return coincidenciaId[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(texto.trim())) return texto.trim();
    return "";
  }

  function extraerIdYouTube(texto) {
    if (!texto || typeof texto !== "string") return "";
    const coincidencia = texto.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return coincidencia ? coincidencia[1] : "";
  }

  function resolverImagenUrl(valor) {
    if (!valor) return { url: "", fallback: "" };
    if (valor.includes("drive.google.com") || /^[a-zA-Z0-9_-]{20,}$/.test(valor.trim())) {
      const id = extraerIdDrive(valor);
      if (id) {
        return {
          url: "https://lh3.googleusercontent.com/d/" + id + "=w1600",
          fallback: "https://drive.google.com/thumbnail?id=" + id + "&sz=w1600"
        };
      }
    }
    return { url: valor, fallback: "" };
  }

  function resolverVideo(valor) {
    if (!valor) return { modo: "video", url: "" };
    const yt = extraerIdYouTube(valor);
    if (yt) {
      return { modo: "iframe", url: "https://www.youtube.com/embed/" + yt + "?rel=0" };
    }
    if (valor.includes("drive.google.com") || /^[a-zA-Z0-9_-]{20,}$/.test(valor.trim())) {
      const id = extraerIdDrive(valor);
      if (id) {
        return { modo: "iframe", url: "https://drive.google.com/file/d/" + id + "/preview" };
      }
    }
    return { modo: "video", url: valor };
  }

  // Datos exactos del documento (17 productos en 4 categorías, sin inventar precios)
  const PRODUCTOS = [
    // Cafés (4)
    { id: "cafe-americano", nombre: "Café americano", categoria: "cafes", catLabel: "Cafés", desc: "Aromático y suave, ideal para disfrutar despacio mientras conversas.", nota: "Caliente · Clásico" },
    { id: "cafe-con-leche", nombre: "Café con leche", categoria: "cafes", catLabel: "Cafés", desc: "Balance perfecto entre café recién pasado y leche tibia cremosa.", nota: "Cálido y reconfortante" },
    { id: "cappuccino", nombre: "Cappuccino", categoria: "cafes", catLabel: "Cafés", desc: "Espresso con espuma suave de leche, perfecto para acompañar masitas.", nota: "Favorito de la casa" },
    { id: "cafe-frio", nombre: "Café frío", categoria: "cafes", catLabel: "Cafés", desc: "Refrescante preparación con hielo para disfrutar las tardes cálidas cruceñas.", nota: "Servido bien frío" },

    // Bebidas (4)
    { id: "chocolate-caliente", nombre: "Chocolate caliente", categoria: "bebidas", catLabel: "Bebidas", desc: "Cremoso y dulce, pensado para compartir en familia a cualquier hora.", nota: "Para todas las edades" },
    { id: "te-infusiones", nombre: "Té e infusiones", categoria: "bebidas", catLabel: "Bebidas", desc: "Selección aromática de tés e infusiones suaves para un momento tranquilo.", nota: "Ligero y aromático" },
    { id: "limonadas", nombre: "Limonadas", categoria: "bebidas", catLabel: "Bebidas", desc: "Preparadas al instante con limón fresco, el toque justo de dulzor y hielo.", nota: "Refrescante natural" },
    { id: "jugos-naturales", nombre: "Jugos naturales", categoria: "bebidas", catLabel: "Bebidas", desc: "Elaborados con fruta natural de temporada, frescos y llenos de sabor.", nota: "100% fruta natural" },

    // Sándwiches (3)
    { id: "sandwich-pollo", nombre: "Sándwich de pollo", categoria: "sandwiches", catLabel: "Sándwiches", desc: "Pollo sazonado con hojas frescas en pan suave, ideal para almorzar o merendar.", nota: "Preparado al momento" },
    { id: "sandwich-jamon-queso", nombre: "Sándwich de jamón y queso", categoria: "sandwiches", catLabel: "Sándwiches", desc: "El clásico infaltable con jamón y queso fundido en pan dorado.", nota: "Clásico familiar" },
    { id: "sandwich-mixto", nombre: "Sándwich mixto", categoria: "sandwiches", catLabel: "Sándwiches", desc: "Combinación generosa y tostada, perfecta para acompañar tu café o jugo.", nota: "Tostado dorado" },

    // Masitas y pastelería (6)
    { id: "cunapes", nombre: "Cuñapés", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Receta tradicional de queso y almidón, suaves por dentro y doraditos por fuera.", nota: "Sabores que cuentan historias" },
    { id: "empanadas", nombre: "Empanadas", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Masa casera dorada al horno con el cariño de las meriendas de siempre.", nota: "Sabores que cuentan historias" },
    { id: "galletitas-caseras", nombre: "Galletitas caseras", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Horneadas con receta familiar, ideales para acompañar el té o un cappuccino.", nota: "Sabores que cuentan historias" },
    { id: "queques", nombre: "Queques", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Esponjosos y aromáticos, con ese sabor casero que recuerda al hogar.", nota: "Recién horneados" },
    { id: "tortas", nombre: "Tortas", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Porciones y tortas frescas para celebrar pequeños momentos o fechas especiales.", nota: "De nuestra vitrina" },
    { id: "dulces-masitas", nombre: "Dulces y masitas variadas", categoria: "masitas", catLabel: "Masitas y pastelería", historia: true, desc: "Surtido artesanal de temporada para degustar y compartir en la mesa.", nota: "Variedad del día" }
  ];

  const COMBOS = [
    { id: "combo-cafe-masitas", nombre: "Combo Café y Masitas", desc: "Tu café favorito acompañado de cuñapés, empanadas o galletitas caseras recién salidas." },
    { id: "combo-sandwich-bebida", nombre: "Combo Sándwich y Bebida", desc: "Sándwich de pollo, jamón y queso o mixto junto a una limonada o jugo natural." },
    { id: "promo-meriendas", nombre: "Promoción de Meriendas", desc: "Opciones pensadas para compartir las tardes entre amigos, jóvenes o en familia." },
    { id: "ofertas-festivas", nombre: "Ofertas para Fechas Festivas", desc: "Detalles y surtidos especiales de tortas y masitas para celebraciones del calendario." }
  ];

  // Estado
  let categoriaActual = "todos";
  let pedido = leerStorage("dulce_encuentro_pedido", []);
  if (!Array.isArray(pedido)) pedido = [];

  // Utilidad toast
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function mostrarToast(mensaje) {
    if (!toastEl) return;
    toastEl.textContent = mensaje;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2600);
  }

  // Aplicar configuración y rutas multimedia
  function aplicarConfiguracionYMedios() {
    document.querySelectorAll('[data-config="nombre"]').forEach(function (el) {
      if (cfg.nombre) el.textContent = cfg.nombre;
    });
    document.querySelectorAll('[data-config="lema"]').forEach(function (el) {
      if (cfg.lema) el.textContent = cfg.lema;
    });
    document.querySelectorAll('[data-config="direccion"]').forEach(function (el) {
      if (cfg.direccion) el.textContent = cfg.direccion;
    });
    document.querySelectorAll('[data-config="horarios"]').forEach(function (el) {
      if (cfg.horarios) el.textContent = cfg.horarios;
    });

    document.querySelectorAll("img[data-media-key]").forEach(function (img) {
      const key = img.getAttribute("data-media-key");
      const raw = medios[key];
      if (!raw) return;
      const resuelta = resolverImagenUrl(raw);
      if (resuelta.url) {
        img.src = resuelta.url;
        if (resuelta.fallback) {
          img.onerror = function () {
            if (img.src !== resuelta.fallback) {
              img.src = resuelta.fallback;
            }
          };
        }
      }
    });

    // Video integrado en sección Esencia
    const slotEsencia = document.getElementById("esencia-video-slot");
    if (slotEsencia) {
      renderizarVideoEnContenedor(slotEsencia, false);
    }

    // Redes y Google Forms
    configurarEnlaceSocial("link-facebook", redes.facebook, "Facebook");
    configurarEnlaceSocial("link-instagram", redes.instagram, "Instagram");
    configurarEnlaceSocial("link-gforms", redes.googleForms, "Google Forms");

    const yearEl = document.getElementById("year-now");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function configurarEnlaceSocial(id, url, etiqueta) {
    const el = document.getElementById(id);
    if (!el) return;
    if (url && url.trim() !== "") {
      el.href = url.trim();
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    } else {
      el.removeAttribute("target");
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        mostrarToast("Configura el enlace de " + etiqueta + " en web/config.js antes de publicar.");
      });
    }
  }

  function renderizarVideoEnContenedor(contenedor, autoplay) {
    const rawVideo = medios.videoPromo || "./assets/dulce-encuentro-promo.mp4";
    const info = resolverVideo(rawVideo);
    const posterInfo = resolverImagenUrl(medios.videoPoster || "./assets/video-poster.jpg");
    contenedor.innerHTML = "";

    if (info.modo === "iframe") {
      const ifr = document.createElement("iframe");
      ifr.src = info.url;
      ifr.title = "Video promocional de Dulce Encuentro";
      ifr.allow = "autoplay; encrypted-media; picture-in-picture";
      ifr.allowFullscreen = true;
      contenedor.appendChild(ifr);
      return;
    }

    const vid = document.createElement("video");
    vid.controls = true;
    vid.playsInline = true;
    vid.preload = "metadata";
    if (posterInfo.url) vid.poster = posterInfo.url;
    if (autoplay) vid.autoplay = true;
    const src = document.createElement("source");
    src.src = info.url;
    src.type = "video/mp4";
    vid.appendChild(src);
    contenedor.appendChild(vid);
    if (autoplay) {
      try {
        const prom = vid.play();
        if (prom && typeof prom.catch === "function") {
          prom.catch(function () {});
        }
      } catch {}
    }
  }

  // Renderizado de Carta y Combos
  const menuGrid = document.getElementById("menu-grid");
  function renderizarCarta() {
    if (!menuGrid) return;
    const filtrados = categoriaActual === "todos"
      ? PRODUCTOS
      : PRODUCTOS.filter(function (p) { return p.categoria === categoriaActual; });

    menuGrid.innerHTML = "";
    filtrados.forEach(function (prod) {
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML =
        '<div>' +
          '<div class="product-top">' +
            '<span class="cat-badge ' + (prod.historia ? "historia" : "") + '">' + prod.catLabel + "</span>" +
          "</div>" +
          '<h3 class="product-title">' + prod.nombre + "</h3>" +
          '<p class="product-desc">' + prod.desc + "</p>" +
        "</div>" +
        '<div class="product-footer">' +
          '<span class="product-note">' + prod.nota + "</span>" +
          '<button type="button" class="btn btn-primary btn-sm" data-add-id="' + prod.id + '">+ Agregar</button>' +
        "</div>";
      menuGrid.appendChild(card);
    });
  }

  const combosGrid = document.getElementById("combos-grid");
  function renderizarCombos() {
    if (!combosGrid) return;
    combosGrid.innerHTML = "";
    COMBOS.forEach(function (combo) {
      const card = document.createElement("article");
      card.className = "combo-card";
      card.innerHTML =
        "<div>" +
          "<h3>" + combo.nombre + "</h3>" +
          "<p>" + combo.desc + "</p>" +
        "</div>" +
        '<button type="button" class="btn btn-outline btn-sm" data-add-combo="' + combo.id + '">+ Consultar combo</button>';
      combosGrid.appendChild(card);
    });
  }

  function actualizarTabs(cat) {
    categoriaActual = cat;
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      const activo = btn.getAttribute("data-cat") === cat;
      btn.setAttribute("aria-selected", activo ? "true" : "false");
    });
    renderizarCarta();
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      actualizarTabs(btn.getAttribute("data-cat") || "todos");
    });
  });

  document.querySelectorAll("[data-filter-jump]").forEach(function (link) {
    link.addEventListener("click", function () {
      const cat = link.getAttribute("data-filter-jump");
      if (cat) actualizarTabs(cat);
    });
  });

  // Carrito / Consulta por WhatsApp
  function agregarItem(item) {
    const existente = pedido.find(function (p) { return p.id === item.id; });
    if (existente) {
      existente.qty += 1;
    } else {
      pedido.push({ id: item.id, nombre: item.nombre, categoria: item.catLabel || "Promoción", qty: 1 });
    }
    guardarStorage("dulce_encuentro_pedido", pedido);
    renderizarPedido();
    mostrarToast("Agregado a tu consulta: " + item.nombre);
  }

  document.addEventListener("click", function (ev) {
    const addBtn = ev.target.closest("[data-add-id]");
    if (addBtn) {
      const prod = PRODUCTOS.find(function (p) { return p.id === addBtn.getAttribute("data-add-id"); });
      if (prod) agregarItem(prod);
      return;
    }
    const comboBtn = ev.target.closest("[data-add-combo]");
    if (comboBtn) {
      const combo = COMBOS.find(function (c) { return c.id === comboBtn.getAttribute("data-add-combo"); });
      if (combo) agregarItem({ id: combo.id, nombre: combo.nombre, catLabel: "Combo / Promoción" });
    }
  });

  function renderizarPedido() {
    const countEl = document.getElementById("cart-count");
    const container = document.getElementById("cart-items-container");
    const notice = document.getElementById("wa-config-notice");
    const totalItems = pedido.reduce(function (acc, item) { return acc + item.qty; }, 0);
    if (countEl) countEl.textContent = String(totalItems);

    const numLimpio = String(cfg.whatsappNumero || "").replace(/\D/g, "");
    if (notice) notice.hidden = numLimpio.length >= 8;

    if (!container) return;
    if (pedido.length === 0) {
      container.innerHTML =
        '<div class="cart-empty">' +
          '<p style="margin:0 0 8px;"><strong>Tu lista está vacía</strong></p>' +
          '<p style="margin:0; font-size:0.9rem;">Agrega cafés, sándwiches, masitas o combos desde nuestra carta para consultar disponibilidad o hacer tu pedido.</p>' +
        "</div>";
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "cart-list";
    pedido.forEach(function (item, idx) {
      const li = document.createElement("li");
      li.className = "cart-item";
      li.innerHTML =
        '<div class="cart-item-info">' +
          "<strong>" + item.nombre + "</strong>" +
          "<small>" + item.categoria + "</small>" +
        "</div>" +
        '<div class="qty-controls">' +
          '<button type="button" class="qty-btn" data-qty-idx="' + idx + '" data-delta="-1" aria-label="Quitar uno de ' + item.nombre + '">−</button>' +
          '<span class="qty-val">' + item.qty + "</span>" +
          '<button type="button" class="qty-btn" data-qty-idx="' + idx + '" data-delta="1" aria-label="Agregar uno más de ' + item.nombre + '">+</button>' +
        "</div>";
      ul.appendChild(li);
    });
    container.innerHTML = "";
    container.appendChild(ul);
  }

  document.getElementById("cart-items-container")?.addEventListener("click", function (ev) {
    const btn = ev.target.closest("[data-qty-idx]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-qty-idx"));
    const delta = Number(btn.getAttribute("data-delta"));
    if (!pedido[idx]) return;
    pedido[idx].qty += delta;
    if (pedido[idx].qty <= 0) {
      pedido.splice(idx, 1);
    }
    guardarStorage("dulce_encuentro_pedido", pedido);
    renderizarPedido();
  });

  function construirMensajeWhatsApp() {
    const nombreCliente = (document.getElementById("order-name")?.value || "").trim();
    const modo = document.getElementById("order-mode")?.value || "Consumir en el local";
    const lineas = ["Hola *Dulce Encuentro*! Quisiera consultar por:"];

    if (pedido.length > 0) {
      pedido.forEach(function (item) {
        lineas.push("• " + item.qty + "x " + item.nombre);
      });
    } else {
      lineas.push("• Información sobre su carta, combos y disponibilidad.");
    }

    lineas.push("• Preferencia: " + modo);
    if (nombreCliente) lineas.push("• Mi nombre: " + nombreCliente);
    return lineas.join("\n");
  }

  document.getElementById("btn-send-wa")?.addEventListener("click", function () {
    const mensaje = construirMensajeWhatsApp();
    const numLimpio = String(cfg.whatsappNumero || "").replace(/\D/g, "");
    if (numLimpio.length >= 8) {
      const url = "https://wa.me/" + numLimpio + "?text=" + encodeURIComponent(mensaje);
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      copiarTexto(mensaje, "Mensaje copiado. Agrega tu número en web/config.js para abrir WhatsApp directo.");
    }
  });

  document.getElementById("btn-contact-wa")?.addEventListener("click", function () {
    const numLimpio = String(cfg.whatsappNumero || "").replace(/\D/g, "");
    if (numLimpio.length >= 8) {
      const url = "https://wa.me/" + numLimpio + "?text=" + encodeURIComponent("Hola Dulce Encuentro! Quisiera hacer una consulta.");
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      abrirDrawer();
      mostrarToast("Configura whatsappNumero en web/config.js o arma tu consulta aquí.");
    }
  });

  function copiarTexto(texto, exitoMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () {
        mostrarToast(exitoMsg);
      }).catch(function () {
        mostrarToast("Copia manual lista en consola o selecciona el texto.");
      });
    } else {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        mostrarToast(exitoMsg);
      } catch {
        mostrarToast("No fue posible copiar automáticamente en este navegador.");
      }
      document.body.removeChild(area);
    }
  }

  document.getElementById("btn-copy-order")?.addEventListener("click", function () {
    copiarTexto(construirMensajeWhatsApp(), "Consulta copiada al portapapeles.");
  });

  document.getElementById("btn-clear-order")?.addEventListener("click", function () {
    pedido = [];
    guardarStorage("dulce_encuentro_pedido", pedido);
    renderizarPedido();
    mostrarToast("Lista vaciada.");
  });

  // Control de Drawer y Modales
  const backdrop = document.getElementById("backdrop");
  const cartDrawer = document.getElementById("cart-drawer");

  function cerrarTodoOverlay() {
    cartDrawer?.classList.remove("open");
    cartDrawer?.setAttribute("aria-hidden", "true");
    document.querySelectorAll(".modal.open").forEach(function (mod) {
      mod.classList.remove("open");
      mod.setAttribute("aria-hidden", "true");
    });
    const modalSlot = document.getElementById("video-modal-slot");
    if (modalSlot) {
      const vidActivo = modalSlot.querySelector("video");
      if (vidActivo) {
        try { vidActivo.pause(); } catch {}
      }
      modalSlot.innerHTML = "";
    }
    backdrop?.classList.remove("open");
  }

  function abrirDrawer() {
    cerrarTodoOverlay();
    renderizarPedido();
    backdrop?.classList.add("open");
    cartDrawer?.classList.add("open");
    cartDrawer?.setAttribute("aria-hidden", "false");
  }

  function abrirModal(id) {
    cerrarTodoOverlay();
    const modal = document.getElementById(id);
    if (!modal) return;
    backdrop?.classList.add("open");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  document.getElementById("btn-open-cart")?.addEventListener("click", abrirDrawer);
  document.getElementById("btn-tech-cart")?.addEventListener("click", abrirDrawer);
  document.getElementById("btn-close-cart")?.addEventListener("click", cerrarTodoOverlay);
  backdrop?.addEventListener("click", cerrarTodoOverlay);

  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", cerrarTodoOverlay);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") cerrarTodoOverlay();
  });

  // Modal Video desde Hero
  document.getElementById("btn-open-video")?.addEventListener("click", function () {
    abrirModal("video-modal");
    const slot = document.getElementById("video-modal-slot");
    if (slot) renderizarVideoEnContenedor(slot, true);
  });

  // Menú QR real con qrcode-generator
  const qrCanvas = document.getElementById("qr-canvas");
  const qrUrlInput = document.getElementById("qr-url-input");

  function obtenerUrlQrPorDefecto() {
    if (cfg.urlPublica && cfg.urlPublica.trim() !== "") {
      const base = cfg.urlPublica.trim();
      if (base.includes("sites.google.com")) return base;
      return base.includes("#") ? base : base + "#carta";
    }
    if (window.__ES_GOOGLE_SITES__ || window.location.hostname.includes("googleusercontent.com")) {
      return "https://sites.google.com/view/dulce-encuentro#carta";
    }
    return window.location.href.split("#")[0] + "#carta";
  }

  function dibujarQrEnCanvas(canvas, texto, tamPx) {
    if (!canvas || typeof window.qrcode !== "function") return;
    const qr = window.qrcode(0, "M");
    qr.addData(texto);
    qr.make();

    const modulos = qr.getModuleCount();
    const margenModulos = 4;
    const totalModulos = modulos + margenModulos * 2;
    const escala = Math.max(2, Math.floor(tamPx / totalModulos));
    const ladoReal = totalModulos * escala;

    canvas.width = ladoReal;
    canvas.height = ladoReal;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFF9F2";
    ctx.fillRect(0, 0, ladoReal, ladoReal);

    ctx.fillStyle = "#2F1A10";
    for (let r = 0; r < modulos; r++) {
      for (let c = 0; c < modulos; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + margenModulos) * escala, (r + margenModulos) * escala, escala, escala);
        }
      }
    }
  }

  function abrirModalQr() {
    const urlInicial = obtenerUrlQrPorDefecto();
    if (qrUrlInput && !qrUrlInput.value) {
      qrUrlInput.value = urlInicial;
    }
    dibujarQrEnCanvas(qrCanvas, (qrUrlInput?.value || urlInicial).trim(), 240);
    abrirModal("qr-modal");
  }

  document.getElementById("btn-open-qr")?.addEventListener("click", abrirModalQr);
  document.getElementById("btn-tech-qr")?.addEventListener("click", abrirModalQr);

  document.getElementById("btn-update-qr")?.addEventListener("click", function () {
    const val = (qrUrlInput?.value || "").trim() || obtenerUrlQrPorDefecto();
    dibujarQrEnCanvas(qrCanvas, val, 240);
    mostrarToast("Código QR actualizado.");
  });

  document.getElementById("btn-download-qr")?.addEventListener("click", function () {
    const urlDestino = (qrUrlInput?.value || "").trim() || obtenerUrlQrPorDefecto();
    const tarjeta = document.createElement("canvas");
    tarjeta.width = 900;
    tarjeta.height = 1140;
    const ctx = tarjeta.getContext("2d");

    // Fondo crema y marco terracota
    ctx.fillStyle = "#FAF2E8";
    ctx.fillRect(0, 0, 900, 1140);
    ctx.strokeStyle = "#D98880";
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 828, 1068);

    // Encabezado
    ctx.fillStyle = "#B4564E";
    ctx.font = "bold 24px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("CAFETERÍA Y PASTELERÍA", 450, 120);

    ctx.fillStyle = "#2F1A10";
    ctx.font = "bold 62px Georgia, serif";
    ctx.fillText(cfg.nombre || "Dulce Encuentro", 450, 195);

    ctx.fillStyle = "#6B4735";
    ctx.font = "italic 32px Georgia, serif";
    ctx.fillText(cfg.lema || "Un lugar para disfrutar y compartir", 450, 248);

    // QR grande al centro
    const qrTemp = document.createElement("canvas");
    dibujarQrEnCanvas(qrTemp, urlDestino, 520);
    ctx.fillStyle = "#FFF9F2";
    const xQr = Math.round((900 - qrTemp.width) / 2);
    ctx.fillRect(xQr - 24, 304, qrTemp.width + 48, qrTemp.height + 48);
    ctx.strokeStyle = "#4A2C1D";
    ctx.lineWidth = 4;
    ctx.strokeRect(xQr - 24, 304, qrTemp.width + 48, qrTemp.height + 48);
    ctx.drawImage(qrTemp, xQr, 328);

    // Pie imprimible
    ctx.fillStyle = "#2F1A10";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("Escanea nuestro Menú QR", 450, 935);

    ctx.fillStyle = "#6B4735";
    ctx.font = "22px sans-serif";
    ctx.fillText("Av. Radial 27 B, entre calle 4 · Santa Cruz de la Sierra", 450, 985);
    ctx.fillText("Pequeños momentos, grandes historias", 450, 1030);

    const enlace = document.createElement("a");
    enlace.download = "tarjeta-menu-qr-dulce-encuentro.png";
    enlace.href = tarjeta.toDataURL("image/png");
    enlace.click();
    mostrarToast("Tarjeta QR descargada.");
  });

  // Accesibilidad A+
  const btnA11y = document.getElementById("btn-a11y");
  const estadoA11y = leerStorage("dulce_a11y_large", false);
  if (estadoA11y) {
    document.body.classList.add("a11y-large-text");
    btnA11y?.setAttribute("aria-pressed", "true");
  }
  btnA11y?.addEventListener("click", function () {
    const activo = document.body.classList.toggle("a11y-large-text");
    btnA11y.setAttribute("aria-pressed", activo ? "true" : "false");
    guardarStorage("dulce_a11y_large", activo);
    mostrarToast(activo ? "Texto ampliado activado." : "Tamaño de lectura estándar.");
  });

  // Menú móvil
  const btnMenu = document.getElementById("btn-menu-toggle");
  const mainNav = document.getElementById("main-nav");
  btnMenu?.addEventListener("click", function () {
    const abierto = mainNav?.classList.toggle("open");
    btnMenu.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  mainNav?.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mainNav.classList.remove("open");
      btnMenu?.setAttribute("aria-expanded", "false");
    });
  });

  // Encuesta rápida local
  const surveyForm = document.getElementById("survey-form");
  const surveyFeedback = document.getElementById("survey-feedback");
  surveyForm?.addEventListener("submit", function (ev) {
    ev.preventDefault();
    const seleccionado = surveyForm.querySelector('input[name="favorito"]:checked')?.value || "Nuestras masitas";
    const comentario = (document.getElementById("survey-comment")?.value || "").trim();
    guardarStorage("dulce_encuentro_encuesta", { seleccionado: seleccionado, comentario: comentario });

    if (surveyFeedback) {
      surveyFeedback.hidden = false;
      surveyFeedback.textContent =
        "¡Gracias por compartir tu opinión! Registramos tu preferencia: «" + seleccionado + "»" +
        (comentario ? " (" + comentario + ")" : "") +
        ". En el sitio publicado también podrás enlazar tu encuesta oficial de Google Forms.";
    }
    mostrarToast("¡Preferencia registrada con éxito!");
  });

  // Animación sutil con IntersectionObserver sin ocultar nada si falla o se reduce movimiento
  function iniciarAnimaciones() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return;
    }
    const items = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.remove("is-hidden");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

    items.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.95) {
        el.classList.add("is-hidden");
      }
      obs.observe(el);
    });
  }

  // Inicialización
  aplicarConfiguracionYMedios();
  renderizarCarta();
  renderizarCombos();
  renderizarPedido();
  iniciarAnimaciones();
})();
