import BlockManager from "./BlockManager.js";
import ListenerManager from "./ListenerManager.js";

const createBrowserHistory = (options = {}) => {
  const {
    basename = "",
    forceRefresh = false,
    keyLength = 6,
    getUserConfirmation = (message, callback) =>
      callback(window.confirm(message)),
  } = options;

  const listenerManager = new ListenerManager();
  const blockManager = new BlockManager(getUserConfirmation);

  addDomListener();

  const history = {
    action: "POP",
    length: window.history.length,
    location: createLocation(basename),
    block,
    goBack,
    goForward,
    push,
    listen,
    go,
    replace,
  };

  return history;

  function block(prompt) {
    return blockManager.block(prompt);
  }

  function go(step) {
    window.history.go(step);
  }

  function goBack() {
    go(-1);
  }

  function goForward() {
    go(1);
  }

  function handlePathAndState(path, state) {
    if (typeof path === "string") {
      return {
        path,
        state,
      };
    } else if (typeof path === "object") {
      let pathResult = path.pathname;

      let { search, hash } = path;

      if (search.charAt(0) !== "?") {
        search = "?" + search;
      }
      if (hash.charAt(0) !== "#") {
        hash = "#" + hash;
      }

      pathResult += search + hash;

      return {
        path: pathResult,
        state: state,
      };
    } else {
      throw new Error("path must be a string or an object");
    }
  }

  function push(path, state) {
    changePage(path, state, "PUSH");
  }

  function replace(path, state) {
    changePage(path, state, "REPLACE");
  }

  function changePage(path, state, action) {
    if (action !== "REPLACE" && action !== "PUSH") {
      throw new Error("action must be PUSH or REPLACE");
    }

    const pathInfo = handlePathAndState(path, state);
    pathInfo.path = basename + pathInfo.path;

    const jump =
      action === "REPLACE"
        ? window.history.replaceState.bind(window.history)
        : window.history.pushState.bind(window.history);

    const location = createLocationFromPath(pathInfo, basename);

    blockManager.triggerBlock(location, action, () => {
      listenerManager.triggerListener(location, action);
      jump(
        {
          key: createKey(keyLength),
          state: pathInfo.state,
        },
        null,
        pathInfo.path
      );

      history.action = action;
      history.location = location;

      if (forceRefresh) {
        window.location.href = pathInfo.path;
      }
    });
  }

  function addDomListener() {
    window.addEventListener("popstate", () => {
      const location = createLocation(basename);
      blockManager.triggerBlock(location, "POP", () => {
        listenerManager.triggerListener(location, "POP");
        history.location = location;
      });
    });
  }

  function listen(listener) {
    return listenerManager.addListener(listener);
  }
};

function createLocation(basename = "") {
  const location = {
    hash: window.location.hash,
    search: window.location.search,
  };

  // 处理pathname
  const reg = new RegExp(`^${basename}`);
  const pathname = window.location.pathname;
  location.pathname = pathname.replace(reg, "");

  // 处理state
  let historyState = window.history.state;

  if (historyState === null) {
    location.state = undefined;
  } else if (typeof historyState !== "object") {
    location.state = historyState;
  } else {
    if ("key" in historyState) {
      location.key = historyState.key;
      location.state = historyState.state;
    } else {
      location.state = historyState;
    }
  }

  return location;
}

function createLocationFromPath(pathInfo, basename = "") {
  let hashIndex = pathInfo.path.indexOf("#");
  hashIndex = hashIndex === -1 ? pathInfo.path.length : hashIndex;

  let searchIndex = pathInfo.path.indexOf("?");
  searchIndex = searchIndex === -1 ? hashIndex : searchIndex;

  let pathname = pathInfo.path.substring(0, searchIndex);
  const search = pathInfo.path.substring(searchIndex, hashIndex);
  const hash = pathInfo.path.substring(hashIndex);

  // 也可以用正则处理
  // let pathname = pathInfo.path.replace(/[?#].*$/,"");

  const reg = new RegExp(`^${basename}`);
  pathname = pathname.replace(reg, "");

  return {
    pathname,
    search,
    hash,
    state: pathInfo.state,
  };
}

function createKey(keyLen) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + keyLen);
}

window.his = createBrowserHistory();
export default createBrowserHistory;
