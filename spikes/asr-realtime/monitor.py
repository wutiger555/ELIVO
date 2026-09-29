"""推論期間的資源取樣：whisper-server 行程的 CPU／RSS（psutil），以及溫度、GPU、功耗（macmon，免 sudo）。"""
import json
import shutil
import subprocess
import threading
import time

import psutil


class ResourceMonitor:
    def __init__(self, pid: int, interval: float = 0.5):
        self.proc = psutil.Process(pid)
        self.interval = interval
        self.samples: list[dict] = []
        self._stop = threading.Event()
        self._macmon: subprocess.Popen | None = None
        self._latest_mac: dict = {}

    def __enter__(self):
        self.proc.cpu_percent(None)
        if shutil.which("macmon"):
            self._macmon = subprocess.Popen(
                ["macmon", "pipe", "-i", str(int(self.interval * 1000))],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True,
            )
            threading.Thread(target=self._read_macmon, daemon=True).start()
        threading.Thread(target=self._loop, daemon=True).start()
        return self

    def __exit__(self, *exc):
        self._stop.set()
        if self._macmon:
            self._macmon.terminate()

    def _read_macmon(self):
        for line in self._macmon.stdout:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            self._latest_mac = {
                "cpu_temp": d["temp"]["cpu_temp_avg"],
                "gpu_temp": d["temp"]["gpu_temp_avg"],
                "gpu_active": d["gpu_active_ratio"],
                "power_w": d["all_power"],
                "swap_gb": d["memory"]["swap_usage"] / 1e9,
            }

    def _loop(self):
        while not self._stop.wait(self.interval):
            try:
                s = {"t": time.time(), "cpu_pct": self.proc.cpu_percent(None), "rss_mb": self.proc.memory_info().rss / 1e6}
            except psutil.NoSuchProcess:
                return
            s.update(self._latest_mac)
            self.samples.append(s)

    def summary(self) -> dict:
        out = {}
        for key in ("cpu_pct", "rss_mb", "cpu_temp", "gpu_temp", "gpu_active", "power_w", "swap_gb"):
            vals = [s[key] for s in self.samples if key in s]
            if vals:
                out[key] = {"mean": sum(vals) / len(vals), "max": max(vals)}
        return out
