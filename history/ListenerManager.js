export default class ListenerManager {
  listeners = [];

  addListener(listener) {
    this.listeners.push(listener);
    return () => this.removeListener(listener);
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }

  triggerListener(location, action) {
    this.listeners.forEach((listener) => listener(location, action));
  }
}
