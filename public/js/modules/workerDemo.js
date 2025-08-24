export default function initWorker(root){
  root.innerHTML = `
    <h2>Web Worker (offload)</h2>
    <div class="row"><button id="run">Process 2M numbers</button> <span id="status"></span></div>
    <pre id="out"></pre>
  `;
  const status = root.querySelector('#status');
  const out = root.querySelector('#out');

  const workerCode = `
    self.onmessage = () => {
      const n = 2_000_000; let sum=0;
      for (let i=0;i<n;i++) sum += Math.sqrt(i%1000);
      self.postMessage({ sum });
    };
  `;
  const workerURL = URL.createObjectURL(new Blob([workerCode], {type:'text/javascript'}));

  root.querySelector('#run').addEventListener('click', ()=>{
    out.textContent = '';
    status.textContent = 'Main… ';
    const t0 = performance.now();
    // main-thread baseline
    let sum=0; for (let i=0;i<2_000_000;i++) sum += Math.sqrt(i%1000);
    const mainMs = (performance.now()-t0)|0;
    status.textContent += `done ${mainMs}ms. Worker… `;

    const w = new Worker(workerURL);
    const t1 = performance.now();
    w.onmessage = (e)=>{
      const workerMs = (performance.now()-t1)|0;
      status.textContent += `done ${workerMs}ms.`;
      out.textContent = `main sum=${sum|0} in ${mainMs}ms\nworker sum=${e.data.sum|0} in ${workerMs}ms`;
      w.terminate();
    };
    w.postMessage('go');
  });
}
