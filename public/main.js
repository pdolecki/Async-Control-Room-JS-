import initTypeahead from "./js/modules/typeaheadDemo.js";
import initParallel from "./js/modules/parallelDashboardDemo.js";
import initPoolDemo from "./js/modules/promisePoolDemo.js";
import initStreaming from "./js/modules/streamingDemo.js";
import initWorker from "./js/modules/workerDemo.js";
import initWS from "./js/modules/websocketDemo.js";

initTypeahead(document.querySelector("#typeahead"));
initParallel(document.querySelector("#parallel"));
initPoolDemo(document.querySelector("#pool"));
initStreaming(document.querySelector("#stream"));
initWorker(document.querySelector("#worker"));
initWS(document.querySelector("#ws"));
