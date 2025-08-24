export default function initStreaming(root){
  root.innerHTML = `
    <h2>Streaming (chunks)</h2>
    <div class="row"><button id="start">Start</button> <button id="stop">Stop</button></div>
    <pre id="out"></pre>
    <small>Demonstrates reading chunked text. Uses a local simulated stream.</small>
  `;
  const out = root.querySelector('#out');
  let ctrl;

  // simulate a streaming endpoint with a ReadableStream
  function makeStream(){
    let i=0;
    return new ReadableStream({
      start(controller){
        const t = setInterval(()=>{
          controller.enqueue(new TextEncoder().encode(`chunk ${++i}\n`));
          if (i>=10) { clearInterval(t); controller.close(); }
        }, 300);
      }
    });
  }

  root.querySelector('#start').addEventListener('click', async ()=>{
    ctrl?.abort(); ctrl = new AbortController();
    out.textContent = '';
    const stream = makeStream();
    const reader = stream.getReader({ signal: ctrl.signal });
    try {
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        out.textContent += new TextDecoder().decode(value);
      }
    } catch(e) {
      out.textContent += `\n[aborted]`;
    }
  });

  root.querySelector('#stop').addEventListener('click', ()=> ctrl?.abort());
}
