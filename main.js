import initTypeaheadDemo from "./js/modules/typeaheadDemo.js";
import initParallelDemo from "./js/modules/parallelDemo.js";
import initPromisePoolDemo from "./js/modules/promisePoolDemo.js";
import initStreamingDemo from "./js/modules/streamingDemo.js";
import initWorkerDemo from "./js/modules/workerDemo.js";
import initWebSocketDemo from "./js/modules/websocketDemo.js";

initTypeaheadDemo(document.querySelector("#typeahead"));
initParallelDemo(document.querySelector("#parallel"));
initPromisePoolDemo(document.querySelector("#pool"));
initStreamingDemo(document.querySelector("#stream"));
initWorkerDemo(document.querySelector("#worker"));
initWebSocketDemo(document.querySelector("#ws"));
