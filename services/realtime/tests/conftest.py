import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from elivo.asr.whisper_server import Result  # noqa: E402
from elivo.minutes import OpBatch, Reflection  # noqa: E402

SMOKE = Path("~/ELIVO-data/eval/datasets/synthetic/smoke.wav").expanduser()


class FakeASR:
    """不跑模型：每次推論回傳同一句，延遲極短。"""

    def transcribe(self, pcm, prompt=None, fallback=False):
        seg = {"start": 0.0, "end": len(pcm) / 16000, "text": "我們下禮拜三要跟 client 開會", "avg_logprob": -0.1, "no_speech_prob": 0.0}
        return Result(text=seg["text"], segments=[seg], elapsed=0.01)


class FakeLLM:
    """fast：每批新增一個決策；reflect：原樣回傳目前項目並給一段摘要。"""

    def __init__(self):
        self.calls = []

    async def complete_json(self, model, system, prompt, schema, max_tokens=8192, format_hint=None):
        self.calls.append(schema.__name__)
        if schema is OpBatch:
            return OpBatch.model_validate({"ops": [{"op": "add", "kind": "decision", "text": "下禮拜三跟 client 開會", "reason": "測試", "utt_ids": []}]}), {}
        # 真正的 reflect 會列出所有項目（沒列出的會被撤回），這裡原樣回傳 prompt 裡的目前記錄
        state = prompt.split("目前的會議記錄：\n", 1)[1].split("\n\n", 1)[0]
        items = json.loads(state) if state.startswith("[") else []
        return Reflection.model_validate({"items": items, "summary": [{"topic": "測試", "points": ["下禮拜三開會"]}], "corrections": []}), {}


@pytest.fixture
def smoke_wav():
    if not SMOKE.exists():
        pytest.skip(f"缺少測試音檔 {SMOKE}（先跑 spikes/asr-realtime 的合成音檔）")
    return SMOKE
