export default class BlockManager {
  block(prompt) {
    if (typeof prompt !== "function" && typeof prompt !== "string") {
      throw new Error("Prompt must be string or function");
    }

    this.prompt = prompt;
    return () => this.unblock();
  }
  triggerBlock(location, action, callback) {
    if (!this.prompt) return;

    // 安全性
    if (typeof this.prompt !== "string" && typeof this.prompt !== "function") {
      throw new Error("Prompt must be string or function");
    }

    const message =
      typeof this.prompt === "function"
        ? this.prompt(location, action)
        : this.prompt;

    this.getUserConfirmation(message, (resulet) => {
      resulet && callback();
    });
  }

  unblock() {
    this.prompt = null;
  }

  constructor(getUserConfirmation) {
    this.getUserConfirmation = getUserConfirmation;
  }
}
