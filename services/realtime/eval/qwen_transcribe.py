"""在 ~/.venvs/qwen3-asr 執行（qwen-asr 需要獨立環境）：把一批音檔交給 Qwen3-ASR，輸出 JSON。

  ~/.venvs/qwen3-asr/bin/python eval/qwen_transcribe.py --context "術語：…" a.wav b.wav > out.json
由 asr_compare.py 呼叫；權重在 ~/.cache/huggingface（Qwen/Qwen3-ASR-1.7B）。
"""
import argparse
import json
import sys
import time

import torch
from qwen_asr import Qwen3ASRModel

ap = argparse.ArgumentParser()
ap.add_argument("files", nargs="+")
ap.add_argument("--model", default="Qwen/Qwen3-ASR-1.7B")
ap.add_argument("--context", default="")
a = ap.parse_args()

device = "mps" if torch.backends.mps.is_available() else "cpu"
t0 = time.time()
model = Qwen3ASRModel.from_pretrained(a.model, dtype=torch.bfloat16, device_map=device, max_inference_batch_size=4, max_new_tokens=256)
load_s = time.time() - t0
t0 = time.time()
res = model.transcribe(audio=a.files, context=a.context)
json.dump({"texts": [r.text for r in res], "languages": [r.language for r in res], "device": device,
           "load_s": round(load_s, 1), "infer_s": round(time.time() - t0, 1)}, sys.stdout, ensure_ascii=False)
