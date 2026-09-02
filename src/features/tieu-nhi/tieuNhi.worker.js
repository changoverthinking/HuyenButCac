const TRANSFORMERS_CDN_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";
const MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";

let runtimePromise = null;
let tokenizerPromise = null;
let modelPromise = null;
let stoppingCriteria = null;

async function getRuntime() {
  runtimePromise ??= import(/* @vite-ignore */ TRANSFORMERS_CDN_URL);
  return runtimePromise;
}

async function getModel(progressCallback) {
  const runtime = await getRuntime();
  tokenizerPromise ??= runtime.AutoTokenizer.from_pretrained(MODEL_ID, {
    progress_callback: progressCallback,
  });
  modelPromise ??= runtime.AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    device: "webgpu",
    progress_callback: progressCallback,
  });
  stoppingCriteria ??= new runtime.InterruptableStoppingCriteria();
  return Promise.all([tokenizerPromise, modelPromise, runtime]);
}

async function checkWebGpu() {
  try {
    if (!("gpu" in navigator)) throw new Error("Thiết bị hoặc trình duyệt chưa hỗ trợ WebGPU.");
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("Không tìm thấy GPU adapter tương thích WebGPU.");
    self.postMessage({ status: "compatible" });
  } catch (error) {
    self.postMessage({ status: "unsupported", data: error instanceof Error ? error.message : String(error) });
  }
}

async function loadModel() {
  try {
    self.postMessage({ status: "loading", data: "Đang tải Tiểu Nhị về thiết bị…" });
    const [tokenizer, model] = await getModel((progress) => self.postMessage(progress));
    self.postMessage({ status: "loading", data: "Đang khởi tạo WebGPU…" });
    const warmup = tokenizer("Xin chào");
    await model.generate({ ...warmup, max_new_tokens: 1 });
    self.postMessage({ status: "ready" });
  } catch (error) {
    self.postMessage({ status: "error", data: error instanceof Error ? error.message : String(error) });
  }
}

async function generate(messages) {
  try {
    const [tokenizer, model, runtime] = await getModel();
    stoppingCriteria.reset();

    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
      enable_thinking: false,
    });

    let tokenCount = 0;
    let startedAt = 0;
    const streamer = new runtime.TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      token_callback_function: () => {
        if (!startedAt) startedAt = performance.now();
        tokenCount += 1;
      },
      callback_function: (output) => {
        const elapsed = Math.max(performance.now() - startedAt, 1);
        self.postMessage({
          status: "update",
          output,
          numTokens: tokenCount,
          tps: startedAt ? (tokenCount / elapsed) * 1000 : 0,
        });
      },
    });

    self.postMessage({ status: "start" });
    await model.generate({
      ...inputs,
      do_sample: true,
      top_k: 20,
      temperature: 0.7,
      repetition_penalty: 1.08,
      max_new_tokens: 384,
      streamer,
      stopping_criteria: stoppingCriteria,
    });
    self.postMessage({ status: "complete" });
  } catch (error) {
    self.postMessage({ status: "error", data: error instanceof Error ? error.message : String(error) });
  }
}

self.addEventListener("message", (event) => {
  const { type, data } = event.data ?? {};
  if (type === "check") void checkWebGpu();
  if (type === "load") void loadModel();
  if (type === "generate") void generate(data?.messages ?? []);
  if (type === "interrupt") stoppingCriteria?.interrupt();
});
