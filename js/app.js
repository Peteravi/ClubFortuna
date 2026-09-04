"use strict";

const TAWK_EMBED_URL = "https://embed.tawk.to/6a9b35f1d880fe3443bd79d3/1k1n4ldpo";
const chatTriggers = [...document.querySelectorAll("[data-tawk-chat]")];
const chatStatus = document.querySelector("#chatStatus");
let tawkLoadPromise;

function announceChat(message) {
  if (chatStatus) chatStatus.textContent = message;
}

function setChatBusy(isBusy) {
  chatTriggers.forEach(trigger => trigger.toggleAttribute("aria-busy", isBusy));
}

function trackIntent(intent) {
  if (typeof window.Tawk_API?.addEvent !== "function") return;
  window.Tawk_API.addEvent(`solicitud-${intent}`, {
    pagina: window.location.pathname,
    origen: "club-fortuna"
  }, error => {
    if (error) console.warn("No se pudo registrar la intención del chat.", error);
  });
}

function loadTawk() {
  if (typeof window.Tawk_API?.maximize === "function") return Promise.resolve(window.Tawk_API);
  if (tawkLoadPromise) return tawkLoadPromise;

  tawkLoadPromise = new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error("Tawk.to tardó demasiado en responder.")), 15000);
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = () => {
      window.clearTimeout(timeoutId);
      window.Tawk_API.hideWidget?.();
      resolve(window.Tawk_API);
    };

    window.Tawk_API.onChatMinimized = () => window.Tawk_API.hideWidget?.();

    const script = document.createElement("script");
    script.id = "tawk-embed-script";
    script.async = true;
    script.src = TAWK_EMBED_URL;
    script.charset = "UTF-8";
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("No se pudo cargar Tawk.to."));
    };
    document.head.append(script);
  }).catch(error => {
    tawkLoadPromise = undefined;
    document.querySelector("#tawk-embed-script")?.remove();
    throw error;
  });

  return tawkLoadPromise;
}

async function openTawkChat(trigger) {
  const intent = trigger.dataset.intent || "general";
  setChatBusy(true);
  announceChat("Abriendo el chat con un asesor…");

  try {
    const api = await loadTawk();
    trackIntent(intent);
    api.showWidget?.();
    api.maximize();
    announceChat("Chat abierto.");
  } catch (error) {
    console.error(error);
    announceChat("No fue posible abrir el chat. Inténtalo nuevamente.");
  } finally {
    setChatBusy(false);
  }
}

chatTriggers.forEach(trigger => {
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.addEventListener("click", () => openTawkChat(trigger));

  const warmTawk = () => loadTawk().catch(() => {});
  trigger.addEventListener("pointerenter", warmTawk, { once: true });
  trigger.addEventListener("focus", warmTawk, { once: true });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      window.requestAnimationFrame(() => entry.target.classList.add("visible"));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: "0px 0px -24px" });

  document.querySelectorAll(".services .reveal, .process li.reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 90, 240)}ms`;
  });
  revealElements.forEach(element => observer.observe(element));
} else {
  revealElements.forEach(element => element.classList.add("visible"));
}
