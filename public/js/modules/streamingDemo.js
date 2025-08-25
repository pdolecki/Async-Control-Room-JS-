/**
Streaming Demo (ReadableStream + chunks + abort)
WHAT:
  Simulates a streaming endpoint that emits text chunks over time,
  and lets you start/stop consuming with AbortController.

WHY:
  - Real APIs stream responses (chat/logs/etc.)
  - We want incremental reads and the ability to cancel mid-stream

HOW:
  - ReadableStream enqueues a chunk every 300ms
  - reader.read() appends chunks as they arrive
  - Stop button calls reader.cancel(); the stream's cancel() clears the timer
 */
export default function initStreaming(root) {
  root.innerHTML = `
    <h2>Streaming Demo</h2>
    <div class="row">
      <button id="start" type="button">▶ Start</button>
      <button id="stop" type="button">⏹ Stop</button>
    </div>
    <pre id="out"></pre>
    <small class="muted">Simulated 10 chunks (~300ms apart). Stop cancels the reader and clears the timer.</small>
  `;

  const out = root.querySelector("#out");
  let reader = null; // keep the current reader so we can cancel it

  // Fake streaming endpoint with proper cancel cleanup
  function makeStream() {
    let t = null,
      i = 0;
    return new ReadableStream({
      start(controller) {
        t = setInterval(() => {
          controller.enqueue(new TextEncoder().encode(`chunk ${++i}\n`));
          if (i >= 10) {
            clearInterval(t);
            controller.close();
          }
        }, 300);
      },
      cancel(/* reason */) {
        // Called when reader.cancel() is invoked — clear the timer
        if (t) {
          clearInterval(t);
          t = null;
        }
      },
    });
  }

  root.querySelector("#start").addEventListener("click", async () => {
    // Cancel any previous run
    if (reader) {
      try {
        await reader.cancel("restart");
      } catch {}
      reader = null;
    }
    out.textContent = "";

    const stream = makeStream();
    reader = stream.getReader(); // no { signal } here

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        out.textContent += decoder.decode(value);
      }
      out.textContent += "\n[done]";
    } catch (e) {
      // If a pending read was canceled, some browsers reject the read
      out.textContent += `\n[aborted]`;
    } finally {
      reader?.releaseLock();
      reader = null;
    }
  });

  root.querySelector("#stop").addEventListener("click", async () => {
    // Properly cancel the reader -> triggers stream.cancel() to clear interval
    if (reader) {
      try {
        await reader.cancel("user stop");
      } catch {}
      reader = null;
      out.textContent += `\n[aborted]`;
    }
  });
}
