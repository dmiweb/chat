import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.user = null;
    this.users = [];
    this.api = new ChatAPI();
    this.websocket = null;

    this.bindToDOM = this.bindToDOM.bind(this);
    this.registerEvents = this.registerEvents.bind(this);
    this.onEnterChatHandler = this.onEnterChatHandler.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.sendExitMessage = this.sendExitMessage.bind(this);
  }

  static get markupChat() {
    return `
      <div class="container">
        <div class="chat__connect">
          <div class="chat__userlist"></div>
        </div>
        <div class="chat__container">
          <div class="chat__area">
            <div class="chat__messages-container"></div>
            <div class="chat__messages-input">
              <form class="form form__group">
                <input name="message" class="form form__input" type="text">
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static markupUser(id, name) {
    return `
      <div id="${id}" class="chat__user">
        <div class="chat-user-avatar"></div>
        <div class="chat-user-name">${name}</div>
      </div>
    `;
  }

  static markupMessage(interlocutor, message) {
    return `
      <div class="message__container">
        <span class="message__container-interlocutor">${interlocutor}</span>
        <span class="message__header">${message}</span>
        <div class="popover-arrow-left"></div>
        <div class="popover-arrow-right"></div>
      </div>
    `;
  }

  init() {
    const loginWidget = document.querySelector(".widget__authorization");

    loginWidget.addEventListener("submit", this.bindToDOM);
  }

  async bindToDOM(e) {
    e.preventDefault();

    const userName = e.target.name.value.trim();

    if (!userName) return;

    const response = await this.api.registerUser({ name: userName });

    if (response.status === "ok") {
      document.querySelector(".widget__authorization").style.display = "none";

      this.container.insertAdjacentHTML("beforeEnd", Chat.markupChat);

      this.user = response.user;

      this.users.push(response.user);
    }

    if (response.status === "error") {
      const inputContainer = this.container.querySelector(
        ".widget__input-container"
      );
      const nameInput = this.container.querySelector(".widget__input-name");

      if (document.querySelector(".widget__hint")) return;

      inputContainer.insertAdjacentHTML(
        "beforeEnd",
        '<span class="widget__hint">Этот ник уже занят!</span>'
      );

      nameInput.addEventListener("focus", () => {
        const hint = document.querySelector(".widget__hint");

        if (hint) hint.remove();
      });

      return;
    }

    this.onEnterChatHandler();

    this.websocket = new WebSocket("https://chat-backend-6287.onrender.com/");
    this.subscribeOnEvents();

    document
      .querySelector(".form")
      .addEventListener("submit", this.sendMessage);
  }

  async registerEvents(e) {
    const message = await JSON.parse(e.data);

    if (message.type === "send") {
      this.renderMessage(message.name, message.msg);
      return;
    }

    this.users = message;

    this.onEnterChatHandler();
  }

  subscribeOnEvents() {
    this.websocket.addEventListener("message", this.registerEvents);
    this.websocket.addEventListener("close", this.registerEvents);
    this.websocket.addEventListener("error", () => {
      console.log("error connect");
    });
    window.addEventListener("visiblitychange", this.sendExitMessage);
  }

  onEnterChatHandler() {
    const userList = document.querySelector(".chat__userlist");

    if (!userList) return;

    userList.innerHTML = "";

    this.users.forEach((user) => {
      userList.insertAdjacentHTML(
        "beforeEnd",
        Chat.markupUser(user.id, user.name)
      );
    });

    document
      .getElementById(this.user.id)
      .classList.add("chat-user-name__yourself");
  }

  sendMessage(e) {
    e.preventDefault();
    const message = e.target.message;

    const validMessage = message.value.trim();

    if (!validMessage) return;

    const msg = {
      type: "send",
      name: this.user.name,
      msg: validMessage,
    };

    this.websocket.send(JSON.stringify(msg));

    message.value = "";
  }

  renderMessage(name, message) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const currentDate = time.slice(0, 5) + " " + date;

    const interlocutor = name + ", " + currentDate;

    const chatList = document.querySelector(".chat__messages-container");

    chatList.insertAdjacentHTML(
      "beforeEnd",
      Chat.markupMessage(interlocutor, message)
    );

    const lastMessage = chatList.lastElementChild;

    if (name === this.user.name) {
      lastMessage.classList.add("message__container-yourself");
    }

    chatList.scrollTop = chatList.scrollHeight;
  }

  sendExitMessage() {
    if (!this.user) return;

    const closeMessage = {
      type: "exit",
      user: {
        name: this.user.name,
      },
    };

    this.websocket.send(JSON.stringify(closeMessage));
  }
}
