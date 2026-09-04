"use strict";

const panel = document.querySelector("#chatPanel");
const overlay = document.querySelector("#chatOverlay");
const closeButton = document.querySelector("#chatClose");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#chatInput");
const messages = document.querySelector("#chatMessages");
const chatTriggers = [...document.querySelectorAll("[data-open-chat]")];
let lastFocusedElement = null;

function openChat(text = "") {
  const wasClosed = !panel.classList.contains("active");
  lastFocusedElement = document.activeElement;
  panel.classList.add("active");
  overlay.classList.add("active");
  panel.inert = false;
  panel.setAttribute("aria-hidden", "false");
  chatTriggers.forEach(trigger => trigger.setAttribute("aria-expanded", "true"));
  document.body.classList.add("lock");
  window.setTimeout(() => input.focus(), 350);
  if (text && wasClosed) window.setTimeout(() => send(text), 250);
}

function closeChat() {
  if (!panel.classList.contains("active")) return;
  panel.classList.remove("active");
  overlay.classList.remove("active");
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  chatTriggers.forEach(trigger => trigger.setAttribute("aria-expanded", "false"));
  document.body.classList.remove("lock");
  lastFocusedElement?.focus?.();
}

chatTriggers.forEach(trigger => {
  trigger.setAttribute("aria-expanded", "false");
  trigger.addEventListener("click", () => openChat(trigger.dataset.message || ""));
});

document.querySelectorAll("[data-quick-message]").forEach(button => {
  button.addEventListener("click", () => send(button.dataset.quickMessage));
});

closeButton.addEventListener("click", closeChat);
overlay.addEventListener("click", closeChat);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeChat();
  if (event.key !== "Tab" || !panel.classList.contains("active")) return;
  const focusable = [...panel.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])")];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const value = input.value.trim();
  if (!value) return;
  input.value = "";
  send(value);
});

async function send(text) {
  addMessage(text, "user");
  scrollMessages();
  showTyping();
  await new Promise(resolve => window.setTimeout(resolve, 700));
  document.querySelector("#typing")?.remove();
  addMessage(getReply(text), "operator");
  scrollMessages();
}

function addMessage(text, sender) {
  const wrapper = document.createElement("div");
  const content = document.createElement("div");
  const bubble = document.createElement("p");
  const time = document.createElement("small");
  wrapper.className = `message ${sender}`;
  bubble.textContent = text;
  time.textContent = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  content.append(bubble, time);
  wrapper.append(content);
  messages.append(wrapper);
}

function showTyping() {
  document.querySelector("#typing")?.remove();
  const wrapper = document.createElement("div");
  const bubble = document.createElement("p");
  wrapper.id = "typing";
  wrapper.className = "message operator";
  bubble.textContent = "Escribiendo...";
  wrapper.append(bubble);
  messages.append(wrapper);
  scrollMessages();
}

function getReply(text) {
  const value = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (value.includes("recarga")) return "Perfecto. Recibimos tu solicitud de recarga. Un asesor continuará contigo para completar el proceso.";
  if (value.includes("usuario") || value.includes("cuenta")) return "Claro. Podemos ayudarte con tu usuario. Cuéntanos si deseas crear uno nuevo o recuperar el acceso.";
  if (value.includes("promocion") || value.includes("bono")) return "Con gusto te contamos las promociones disponibles y sus condiciones.";
  if (value.includes("ayuda") || value.includes("soporte")) return "Estamos para ayudarte. Describe brevemente lo ocurrido para orientarte mejor.";
  return "Gracias por escribirnos. Recibimos tu mensaje y un asesor continuará con tu atención.";
}

function scrollMessages() {
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

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
