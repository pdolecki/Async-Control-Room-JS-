import initTypeahead from "./modules/typeahead.js";
import initParallel from "./modules/parallelDashboard.js";
import initPoolDemo from "./modules/promisePoolDemo.js";
import initStreaming from "./modules/streamingDemo.js";
import initWorker from "./modules/workerDemo.js";
import initWS from "./modules/websocketDemo.js";

initTypeahead(document.querySelector("#typeahead"));
initParallel(document.querySelector("#parallel"));
initPoolDemo(document.querySelector("#pool"));
initStreaming(document.querySelector("#stream"));
initWorker(document.querySelector("#worker"));
initWS(document.querySelector("#ws"));
