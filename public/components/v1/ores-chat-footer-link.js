/* @ores-chat/external-components v0.1.0 | framework-neutral HTML bundle */
const DEFAULT_CHAT_URL = "https://ores-chat.github.io/chat/";
const DEFAULT_CONTEXT_ID = "public";
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_RESPONSE_BYTES = 65_536;
const REQUEST_TIMEOUT_MS = 20_000;
const PROTOCOL_VERSION = "ores.chat/v1";

const HTMLElementBase = globalThis.HTMLElement ?? class {};

const isLoopbackHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

const isOpaqueId = (value) =>
  typeof value === "string"
  && /^[A-Za-z0-9_.:/-]{1,256}$/.test(value)
  && !value.startsWith("/")
  && !value.includes("..")
  && !value.includes("//")
  && !value.includes("://");

export const normalizeContextId = (value) => {
  const candidate = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(candidate)
    ? candidate
    : DEFAULT_CONTEXT_ID;
};

const normalizeHttpUrl = (value, fallback = null) => {
  const candidate = String(value ?? "").trim();
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate);
    const isAllowed = url.protocol === "https:" || (url.protocol === "http:" && isLoopbackHost(url.hostname));
    return isAllowed ? url : fallback;
  } catch {
    return fallback;
  }
};

export const buildChatHref = ({ chatUrl = DEFAULT_CHAT_URL, contextId = DEFAULT_CONTEXT_ID } = {}) => {
  const url = normalizeHttpUrl(chatUrl, new URL(DEFAULT_CHAT_URL));
  url.searchParams.set("context", normalizeContextId(contextId));
  return url.toString();
};

export const buildMessageEndpoint = (apiBase) => {
  const base = normalizeHttpUrl(apiBase);
  if (!base) return null;
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  return new URL("v1/public/chat", base).toString();
};

export const buildPublicChatRequest = ({ requestId, contextId, message, conversationId = null }) => {
  const boundedMessage = String(message ?? "").trim();
  if (!isOpaqueId(requestId)) {
    throw new TypeError("The chat request id was invalid.");
  }
  if (!boundedMessage || boundedMessage.length > MAX_MESSAGE_LENGTH) {
    throw new RangeError("The chat message had an invalid length.");
  }
  if (conversationId !== null && !isOpaqueId(conversationId)) {
    throw new TypeError("The conversation id was invalid.");
  }
  return {
    protocol: PROTOCOL_VERSION,
    request_id: requestId,
    message: boundedMessage,
    context_refs: [{ id: normalizeContextId(contextId) }],
    ...(conversationId === null ? {} : { conversation_id: conversationId }),
  };
};

export const extractAssistantReply = (payload, expectedRequestId) => {
  if (payload?.protocol !== PROTOCOL_VERSION || payload?.request_id !== expectedRequestId) {
    throw new TypeError("The chat response did not match its request.");
  }
  const candidate = payload?.answer;
  if (typeof candidate !== "string") throw new TypeError("The chat response did not contain a text reply.");

  const reply = candidate.trim();
  if (!reply || reply.length > 8_000) throw new RangeError("The chat response had an invalid length.");
  return reply;
};

const createMessage = (role, content) => {
  const message = document.createElement("p");
  message.className = `message message--${role}`;
  message.dataset.role = role;
  message.textContent = content;
  return message;
};

export class OresChatFooterLink extends HTMLElementBase {
  #mounted = false;
  #dialog = null;
  #messages = null;
  #status = null;
  #input = null;
  #submit = null;

  connectedCallback() {
    if (this.#mounted) return;
    this.#mounted = true;

    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: inline;
          color: inherit;
          font: inherit;
        }

        a,
        ::slotted(a) {
          color: inherit;
          font: inherit;
          text-decoration: underline;
          text-decoration-thickness: from-font;
          text-underline-offset: 0.18em;
        }

        a:hover,
        a:focus-visible,
        ::slotted(a:hover),
        ::slotted(a:focus-visible) {
          color: var(--ores-chat-link-hover, inherit);
        }

        dialog {
          width: min(31rem, calc(100vw - 2rem));
          max-height: min(42rem, calc(100vh - 2rem));
          padding: 0;
          overflow: hidden;
          border: 1px solid var(--ores-chat-border, #d7dce5);
          border-radius: var(--ores-chat-radius, 1rem);
          background: var(--ores-chat-surface, #ffffff);
          color: var(--ores-chat-text, #172033);
          box-shadow: 0 1.5rem 5rem rgba(12, 22, 44, 0.24);
          font: 400 1rem/1.5 ui-sans-serif, system-ui, sans-serif;
        }

        dialog::backdrop {
          background: rgba(10, 18, 35, 0.46);
          backdrop-filter: blur(2px);
        }

        .panel {
          display: grid;
          grid-template-rows: auto minmax(8rem, 1fr) auto auto;
          max-height: inherit;
        }

        header,
        form {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
        }

        header {
          justify-content: space-between;
          border-bottom: 1px solid var(--ores-chat-border, #d7dce5);
        }

        h2 {
          margin: 0;
          font: 700 1rem/1.2 ui-sans-serif, system-ui, sans-serif;
        }

        button {
          min-height: 2.5rem;
          padding: 0.55rem 0.85rem;
          border: 1px solid var(--ores-chat-border, #c7ceda);
          border-radius: 0.65rem;
          background: var(--ores-chat-button, #172033);
          color: var(--ores-chat-button-text, #ffffff);
          font: 700 0.9rem/1 ui-sans-serif, system-ui, sans-serif;
          cursor: pointer;
        }

        .close {
          width: 2.5rem;
          padding: 0;
          background: transparent;
          color: inherit;
          font-size: 1.2rem;
        }

        button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .messages {
          display: grid;
          align-content: start;
          gap: 0.65rem;
          padding: 1rem;
          overflow-y: auto;
          background: var(--ores-chat-messages, #f5f7fa);
        }

        .message {
          max-width: 85%;
          margin: 0;
          padding: 0.7rem 0.85rem;
          border-radius: 0.8rem;
          background: var(--ores-chat-assistant, #ffffff);
          overflow-wrap: anywhere;
        }

        .message--user {
          justify-self: end;
          background: var(--ores-chat-user, #172033);
          color: var(--ores-chat-user-text, #ffffff);
        }

        form {
          align-items: stretch;
          border-top: 1px solid var(--ores-chat-border, #d7dce5);
        }

        textarea {
          min-height: 2.75rem;
          max-height: 8rem;
          flex: 1;
          resize: vertical;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--ores-chat-border, #c7ceda);
          border-radius: 0.65rem;
          background: var(--ores-chat-input, #ffffff);
          color: inherit;
          font: inherit;
        }

        .status {
          min-height: 1.25rem;
          margin: 0;
          padding: 0 1rem 0.75rem;
          color: var(--ores-chat-muted, #5b667a);
          font-size: 0.8rem;
        }

        @media (prefers-reduced-motion: reduce) {
          dialog::backdrop { backdrop-filter: none; }
        }
      </style>
      <slot name="link"><a part="link">Chat with us</a></slot>
      <dialog part="dialog" aria-labelledby="ores-chat-title">
        <section class="panel">
          <header>
            <h2 id="ores-chat-title">Ask this site</h2>
            <button class="close" type="button" aria-label="Close chat">×</button>
          </header>
          <div class="messages" role="log" aria-live="polite" aria-relevant="additions"></div>
          <form>
            <textarea name="message" maxlength="${MAX_MESSAGE_LENGTH}" rows="2" required aria-label="Message" placeholder="How can we help?"></textarea>
            <button class="send" type="submit">Send</button>
          </form>
          <p class="status" role="status" aria-live="polite"></p>
        </section>
      </dialog>
    `;

    const pageContext = globalThis.location
      ? new URL(globalThis.location.href).searchParams.get("context")
      : null;
    const contextId = normalizeContextId(this.getAttribute("context-id") ?? pageContext);
    const chatUrl = this.getAttribute("chat-url") || DEFAULT_CHAT_URL;
    const apiBase = this.getAttribute("api-base");
    const mode = this.getAttribute("mode") === "dialog" ? "dialog" : "link";
    const linkSlot = root.querySelector('slot[name="link"]');
    const anchor = linkSlot
      .assignedElements({ flatten: true })
      .find((element) => element instanceof HTMLAnchorElement)
      ?? root.querySelector("a");

    anchor.href = buildChatHref({ chatUrl, contextId });
    this.#dialog = root.querySelector("dialog");
    this.#messages = root.querySelector(".messages");
    this.#status = root.querySelector(".status");
    this.#input = root.querySelector("textarea");
    this.#submit = root.querySelector(".send");

    root.querySelector(".close").addEventListener("click", () => this.#dialog.close());
    root.querySelector("form").addEventListener("submit", (event) => this.#send(event, apiBase, contextId));

    if (mode === "dialog" && buildMessageEndpoint(apiBase)) {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        this.#dialog.showModal();
        this.#input.focus();
      });
    }
  }

  async #send(event, apiBase, contextId) {
    event.preventDefault();
    const endpoint = buildMessageEndpoint(apiBase);
    const message = this.#input.value.trim();
    if (!endpoint || !message || message.length > MAX_MESSAGE_LENGTH) return;

    this.#messages.append(createMessage("user", message));
    this.#input.value = "";
    this.#input.disabled = true;
    this.#submit.disabled = true;
    this.#status.textContent = "Waiting for a response…";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const requestId = globalThis.crypto?.randomUUID?.();
      if (!requestId) throw new Error("Secure request identifiers are unavailable.");
      const request = buildPublicChatRequest({ requestId, contextId, message });
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "strict-origin-when-cross-origin",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-ores-chat-site": contextId,
          "x-request-id": requestId,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      const body = await response.text();
      if (body.length > MAX_RESPONSE_BYTES) throw new RangeError("The chat response was too large.");
      if (!response.ok) throw new Error("The chat service did not accept the message.");

      const reply = extractAssistantReply(JSON.parse(body), requestId);
      this.#messages.append(createMessage("assistant", reply));
      this.#status.textContent = "";
      this.#messages.scrollTop = this.#messages.scrollHeight;
      this.dispatchEvent(new CustomEvent("ores-chat-response", { bubbles: true }));
    } catch {
      this.#status.textContent = "Chat is temporarily unavailable. Please try again later.";
      this.dispatchEvent(new CustomEvent("ores-chat-error", { bubbles: true }));
    } finally {
      clearTimeout(timeout);
      this.#input.disabled = false;
      this.#submit.disabled = false;
      this.#input.focus();
    }
  }
}

if (globalThis.customElements && !globalThis.customElements.get("ores-chat-footer-link")) {
  globalThis.customElements.define("ores-chat-footer-link", OresChatFooterLink);
}
