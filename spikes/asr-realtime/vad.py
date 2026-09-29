"""Silero VAD（onnx）。每次輸入 512 個取樣（16 kHz，32 ms），回傳語音機率。"""
import numpy as np
import onnxruntime as ort

from config import SAMPLE_RATE, VAD_ONNX

CHUNK = 512
_CONTEXT = 64  # v5 之後每個 chunk 前要接上一個 chunk 的最後 64 個取樣


class SileroVAD:
    def __init__(self):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        self.session = ort.InferenceSession(str(VAD_ONNX), sess_options=opts, providers=["CPUExecutionProvider"])
        self.reset()

    def reset(self):
        self.state = np.zeros((2, 1, 128), dtype=np.float32)
        self.context = np.zeros((1, _CONTEXT), dtype=np.float32)

    def __call__(self, chunk: np.ndarray) -> float:
        x = np.concatenate([self.context, chunk.reshape(1, -1).astype(np.float32)], axis=1)
        out, self.state = self.session.run(
            None, {"input": x, "state": self.state, "sr": np.array(SAMPLE_RATE, dtype=np.int64)}
        )
        self.context = x[:, -_CONTEXT:]
        return float(out[0, 0])
