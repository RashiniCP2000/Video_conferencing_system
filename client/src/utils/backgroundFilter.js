let scriptPromise = null;

function loadSelfieSegmentation() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.SelfieSegmentation) {
      resolve(window.SelfieSegmentation);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.SelfieSegmentation) {
        resolve(window.SelfieSegmentation);
      } else {
        reject(new Error("SelfieSegmentation loaded but global not found"));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export class BackgroundFilterProcessor {
  constructor() {
    this.selfieSegmentation = null;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.active = false;
    this.effect = "none"; // "none" | "blur" | "gradient"
    this.videoElement = document.createElement("video");
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.stream = null;
    this.animationFrameId = null;
    this.onTrackReady = null;
    this.processedStream = null;
  }

  async init() {
    const SelfieSegmentationClass = await loadSelfieSegmentation();
    this.selfieSegmentation = new SelfieSegmentationClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    this.selfieSegmentation.setOptions({
      modelSelection: 1, // landscape model (lightweight)
    });

    this.selfieSegmentation.onResults((results) => {
      this.draw(results);
    });
  }

  start(stream, effect, onTrackReady) {
    this.stop();
    this.stream = stream;
    this.effect = effect;
    this.onTrackReady = onTrackReady;

    if (this.effect === "none") {
      const track = stream.getVideoTracks()[0];
      if (track) onTrackReady(track);
      return;
    }

    this.videoElement.srcObject = stream;
    this.videoElement.onloadedmetadata = () => {
      this.canvas.width = this.videoElement.videoWidth || 640;
      this.canvas.height = this.videoElement.videoHeight || 480;
      this.active = true;
      this.videoElement.play().catch(() => {});
      this.startLoop();
    };
  }

  setEffect(effect) {
    this.effect = effect;
    if (effect === "none") {
      this.stop();
      if (this.stream) {
        const track = this.stream.getVideoTracks()[0];
        if (track && this.onTrackReady) this.onTrackReady(track);
      }
    }
  }

  startLoop() {
    const tick = async () => {
      if (!this.active || !this.videoElement || this.videoElement.paused || this.videoElement.ended) {
        return;
      }
      try {
        if (this.selfieSegmentation) {
          await this.selfieSegmentation.send({ image: this.videoElement });
        }
      } catch (err) {
        console.error("Frame processing error:", err);
      }
      if (this.active) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  draw(results) {
    if (!this.active) return;
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw mask
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // Clip to person
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.globalCompositeOperation = "destination-over";

    if (this.effect === "blur") {
      ctx.filter = "blur(12px)";
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    } else if (this.effect === "gradient") {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#2563eb"); // Blue
      gradient.addColorStop(1, "#7c3aed"); // Purple
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();

    if (!this.processedStream) {
      this.processedStream = canvas.captureStream(30);
      const track = this.processedStream.getVideoTracks()[0];
      if (track && this.onTrackReady) {
        this.onTrackReady(track);
      }
    }
  }

  stop() {
    this.active = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }
    if (this.processedStream) {
      this.processedStream.getTracks().forEach((track) => track.stop());
      this.processedStream = null;
    }
  }
}
