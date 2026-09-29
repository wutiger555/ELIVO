> **研究附錄**（2026-09-29 由研究代理以公開網路資料彙整；英文原文保留）。每項非顯而易見的主張均附來源；標示 *unverified* 者尚待一手資料確認。**非法律意見。**

# ELIVO Phase 1–3 Technical Feasibility Report

*Researched 2026-09-29. Prices are list or pay-as-you-go rates unless noted. "Unverified" means I could not confirm the claim from a primary source.*

---

## 0. Executive summary

- **ASR is the riskiest part, and no public benchmark answers the question.** I found no independent head-to-head benchmark of **streaming** zh-TW / Mandarin–English code-switched ASR. The strongest shortlist from vendor claims and batch benchmarks: **Soniox** ($0.12/hr streaming with diarization, code-switching built in), **ElevenLabs Scribe v2 Realtime** ($0.39/hr, best ZH/EN score among the models tested in a Sept-2026 enterprise code-switch benchmark), **Speechmatics `cmn_en` bilingual** ($0.43/hr real-time enhanced), and **Deepgram Nova-3 zh-TW** (cheap, but Chinese is not in its code-switching "multi" list). For local and open models, **Breeze-ASR-25** (Taiwan-tuned Whisper) and **Qwen3-ASR** are the best candidates. Budget 2–3 weeks to build your own 5–10 hour zh-TW code-switch test set before committing to a vendor.
- **Audio capture without a bot is solved on macOS 14.2+/14.4+** through Core Audio process taps. This is the same approach Granola uses. Bots are only needed for per-participant streams or Windows/room coverage. Recall.ai now costs $0.50/hr.
- **The cloud pipeline costs about $0.35–$1.10 per meeting-hour** (ASR + LLM + retrieval). The hyperscaler-ASR path is about $2/hr. A hybrid local pipeline is about $0.18/hr.
- **The "when to surface" policy is the product's moat.** HCI research consistently finds that proactive help raises efficiency but disrupts flow. Design for ambient display by default and gated promotion for anything more intrusive.
- **Phase 2 hardware:** build a thin companion display, not an AI gadget. The lesson from Plaud's success and Humane's and Rabbit's failures is to be an accessory to an existing workflow.
- **Recommended Phase-1 stack:** Tauri 2 (React UI shared with web) + a Swift capture/inference helper + Python (FastAPI) real-time pipeline + Postgres/pgvector, with sqlite-vec locally.

---

## 1. Streaming ASR options

### 1.1 Commercial APIs

| Vendor / model | Streaming price | Latency (vendor claim) | Real-time diarization | Custom vocab | zh-TW / code-switch notes |
|---|---|---|---|---|---|
| **Soniox** `stt-rt-v5` | **$0.12/hr** (async $0.10) [src](https://soniox.com/pricing) | "sub-200ms" [src](https://soniox.com/speech-to-text/chinese) | Yes, included in price | Context/instructions (billed as text tokens) | Automatic mid-sentence zh↔en switching, no config needed [src](https://soniox.com/speech-to-text/chinese). **Traditional output not stated** (unverified; may need OpenCC). No published Chinese WER. |
| **Deepgram Nova-3** | Monolingual $0.0048/min (**$0.29/hr**, promo; list $0.0077/min); multilingual $0.0058/min [src](https://www.happyrobot.ai/hub/deepgram-pricing), [src](https://convertaudiototext.com/blog/deepgram-nova-3-explained) | ~57 ms first partial (English) [src](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming) | Streaming add-on **+$0.002/min** (+$0.12/hr) [src](https://www.gladia.io/blog/deepgram-pricing) | Keyterm prompting [src](https://developers.deepgram.com/docs/keyterm) | `zh-TW`/`zh-Hant` supported in streaming; 44.87% relative WER cut vs Nova-2 (batch) [src](https://deepgram.com/learn/deepgram-nova-3-expands-speech-to-text-support-across-asia-pacific). **Chinese is not in the documented code-switching "multi" list** (en, es, fr, de, hi, ru, pt, ja, it, nl) [src](https://developers.deepgram.com/docs/models-languages-overview). |
| **AssemblyAI** | Universal-Streaming multilingual $0.15/hr; **Universal-3.6 Pro Realtime $0.45/hr**; diarization +$0.12/hr [src](https://www.assemblyai.com/pricing) | — | Yes (inline on U3.6 Pro) | Keyterms included on U3.6 Pro and multilingual | The Pro realtime line lists "Chinese" [src](https://www.assemblyai.com/blog/speech-to-text-api-pricing). Traditional-script output unverified. U-3.5-Pro had ZH/EN CER 4.6% (batch) in CoSE-E, see §1.3. |
| **ElevenLabs Scribe v2 Realtime** | **$0.39/hr** list; ~$0.28 on Business annual [src](https://www.therundown.ai/tools/scribe-v2-realtime) | ~150 ms partials [src](https://elevenlabs.io/blog/introducing-scribe-v2-realtime) | Diarization listed for Scribe v2; realtime diarization unverified | Keyterm prompting, up to 1,000 terms | 90+ languages, auto language switching. Best batch ZH/EN WER among the systems CoSE-E tested (§1.3). |
| **Speechmatics** | RT Standard $0.24/hr; **RT Enhanced $0.43/hr** (cut from $0.56 in Jul 2026) [src](https://www.usagepricing.com/blueprint/activity/speechmatics-2026-07-06-realtime-stt-price-cut) | — | Yes (real-time speaker diarization) | Custom dictionary | Dedicated **Mandarin–English bilingual pack `cmn_en`** [src](https://docs.speechmatics.com/speech-to-text/languages). Traditional and Simplified Mandarin supported [src](https://www.speechmatics.com/pricing). Traditional output *within* `cmn_en` unverified. |
| **Gladia Solaria-1** | $0.75/hr (Scaling tier $0.55) [src](https://www.gladia.io/pricing) | 103 ms partial, ~270 ms final [src](https://www.gladia.io/blog/best-real-time-stt-models-for-meeting-assistants-2026) | Yes | Yes | Code-switching across 100+ languages. No Chinese-specific numbers. |
| **OpenAI** | `gpt-realtime-whisper` / `gpt-live-transcribe` **$0.017/min ($1.02/hr)**; `gpt-4o-transcribe` $0.006/min; `gpt-4o-mini-transcribe` $0.003/min; `gpt-transcribe` $0.0045/min; `gpt-4o-transcribe-diarize` $0.006/min [src](https://developers.openai.com/api/docs/pricing) | — | The diarize variant exists; realtime diarization unverified | Prompt text | Good general Mandarin quality, but Qwen's table shows GPT-4o at 32.27 on WenetSpeech-meeting (poor on meeting audio) [src](https://github.com/QwenLM/Qwen3-ASR) |
| **Google Chirp 3** | $0.016/min (**$0.96/hr**) [src](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) | — | **Not for zh-TW**: diarization covers only Simplified Chinese among the Chinese variants | Adaptation | StreamingRecognize supported [src](https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3) |
| **Azure AI Speech** | $1.00/hr base, +$0.30/hr each for diarization and continuous LID (about **$1.60/hr** all-in) [src](https://azure.microsoft.com/en-us/pricing/details/speech/) | — | Yes (SDK real-time diarization) [src](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-stt-diarization) | Phrase lists, Custom Speech | zh-TW supported. zh-TW real-time diarization unverified. |
| **AWS Transcribe** | $0.024/min (**$1.44/hr**) [src](https://brasstranscripts.com/blog/aws-transcribe-pricing-per-minute-2025-better-alternative) | — | Yes, streaming [src](https://docs.aws.amazon.com/zh_tw/transcribe/latest/dg/diarization.html) | Custom vocabulary | `zh-TW` streaming supported; no custom language models for zh-TW [src](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) |
| **Alibaba Qwen3-ASR-Flash** | $0.000035/s (~$0.13/hr) [src](https://openrouter.ai/qwen/qwen3-asr-flash-2026-02-10) | — | Unverified | Context | Strong on Mandarin. Realtime variant and Traditional output unverified. Data residency is likely a problem for Taiwanese enterprise buyers. |

### 1.2 Open-source and local models

| Model | Size / license | Streaming | zh / code-switch evidence | Fit |
|---|---|---|---|---|
| **MediaTek Breeze-ASR-25** | Whisper-large-v2 fine-tune, Apache-2.0, Jun 2025 | No native streaming (chunked, like Whisper) | CSZS-zh-en WER **13.01 vs 29.49** for Whisper-v2 (−56%); ASCEND-MIX 16.38 vs 21.01; CommonVoice16 zh-TW 7.97 vs 9.84 [src](https://huggingface.co/MediaTek-Research/Breeze-ASR-25) | **Best-evidenced model for Taiwan code-switching.** Community ports exist for WhisperKit CoreML [src](https://huggingface.co/fredchu/breeze-asr-25-whisperkit-coreml) and ggml/whisper.cpp [src](https://huggingface.co/tsuzuri-app/Breeze-ASR-25-ggml). (Breeze-ASR-26 targets Taiwanese Hokkien, not Mandarin–English [src](https://huggingface.co/MediaTek-Research/Breeze-ASR-26).) |
| **Qwen3-ASR** 1.7B / 0.6B | Apache-2.0 | Streaming via vLLM only, no timestamps in streaming mode | 1.7B: AISHELL-2 2.71, WenetSpeech net/meeting **4.97/5.88**, vs Whisper-large-v3 9.86/19.11 [src](https://github.com/QwenLM/Qwen3-ASR). No code-switch numbers published. | Strong server-side self-host option (GPU). Outputs Simplified; convert with OpenCC. |
| **FunASR: Paraformer / SenseVoice / Fun-ASR-Nano** | MIT/Apache-style (check each model) | Paraformer-streaming, Fun-ASR streaming | Vendor-blog Chinese CER: SenseVoice 7.81%, Fun-ASR-Nano 8.06%, Paraformer 10.18%, Whisper-v3 ~20% [src](https://www.funasr.com/en/blog/which-funasr-model.html) (vendor-affiliated blog). Hotwords on Paraformer. | Very fast on CPU; good for the edge device. Simplified output. |
| **Whisper large-v3 / turbo** | MIT | Chunked only | Fails on ZH/EN code-switch through language-ID errors: CoSE-E ZH/EN WER **1.494** (worse than useless) [src](https://arxiv.org/html/2609.35645) | Avoid for code-switching unless you force the language or fine-tune (which is what Breeze does). |
| **WhisperKit / Argmax Pro SDK** | Open-source core; Pro is commercial | Yes; 0.46 s latency, 2.2% WER (English) [src](https://arxiv.org/abs/2507.10860) | Language quality comes from the model you load (can load Breeze CoreML) | Best on-device Apple runtime. Pro SDK bundles Parakeet v3 and **Sortformer streaming diarization** [src](https://www.argmaxinc.com/blog/speakerkit). Pricing not public (unverified). |
| **Apple SpeechAnalyzer** (macOS 26) | OS framework, free | Yes | Supports Chinese Simplified, Traditional and HK among 42 locales [src](https://loronote.com/en/blog/apple-speechanalyzer-vs-whisper). English WER 2.12% on one benchmark [src](https://www.developersdigest.tech/blog/apple-speechanalyzer-vs-whisper-benchmark). No code-switch data. | Zero-cost fallback and privacy mode. Only one locale per transcriber, so code-switching is likely weak (unverified). No custom vocabulary. |
| **NVIDIA Parakeet TDT v3** | CC-BY-4.0 | Yes | **No Chinese**: 25 European languages [src](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) | Not usable for zh. |
| **Kyutai STT** | CC-BY | Yes (0.5 s delay) | English/French only [src](https://kyutai.org/stt/) | Not usable. |
| **Moonshine v2** | — | Yes | Lists Chinese among trained languages [src](https://github.com/moonshine-ai/moonshine-v2); no zh benchmarks | Watch list only. |

### 1.3 Published benchmarks relevant to zh/code-switching

- **CoSE-E (ServiceNow, arXiv 2609.35645, 28 Sep 2026):** an enterprise code-switch benchmark, batch, zero-shot, with 294 ZH/EN utterances [src](https://arxiv.org/html/2609.35645).

  | Model | ZH/EN WER (jieba) | CER |
  |---|---|---|
  | Qwen3-Omni | 0.040 | 0.039 |
  | ElevenLabs Scribe-V2 | 0.073 | 0.031 |
  | Gemini-3-Flash | 0.090 | 0.041 |
  | AssemblyAI U-3.5-Pro | 0.093 | 0.046 |
  | Whisper-v3-turbo | 1.494 | 2.516 |

  Deepgram Nova-3 Multilingual and Parakeet were evaluated on other language pairs, but not ZH/EN (Deepgram's multilingual model does not support ZH/EN).
- **ASCEND / SEAME:** the standard spontaneous Mandarin–English corpora. SEAME is ~192 hours of Singapore/Malaysia speech. A 2025 evaluation reports MER 20.4% on ASCEND and 39.72% on SEAME, with much higher error at the switch points themselves (PIER 34–59%) [src](https://arxiv.org/html/2609.35645). SEAME and ASCEND accents differ from Taiwanese Mandarin, so treat them as a proxy only.
- **Taiwan-specific:** CSZS-zh-en, CommonVoice zh-TW and Formosa sets are reported by Breeze (table above).
- **Streaming leaderboards (Artificial Analysis AA-WER Streaming) are English-only** [src](https://artificialanalysis.ai/articles/new-streaming-speech-to-text-benchmark-aa-wer-streaming). The same is true of Soniox's public benchmark [src](https://soniox.com/benchmarks).

**Recommendation:**
- Build an internal eval: 5–10 hours of real Taiwanese business meetings with English jargon, both remote and in-room.
- Score MER, switch-point error, term recall on your keyterm list, and first-partial and final latency.
- Test Soniox, Scribe v2 RT, Speechmatics `cmn_en`, Deepgram zh-TW and AssemblyAI U3.6 Pro. Offline, test Breeze-ASR-25 and Qwen3-ASR.
- Plan an **OpenCC `s2twp`** post-processing step (Simplified to Taiwan Traditional with phrase conversion) for any engine that outputs Simplified.

---

## 2. Real-time speaker diarization

| Option | Real-time? | Numbers | Notes |
|---|---|---|---|
| **NVIDIA Nemotron 3 Diarization** (23 Sep 2026) | Yes. Buffer latency 0.32 / 0.64 / 1.04 / 30.4 s | Up to **8 speakers**; DIHARD III 13.18% DER at 1.04 s; #1 on VoiceArena (14.72%) [src](https://huggingface.co/blog/nvidia/nemotron-diarization) | 100M params, OpenMDW license. Trained on 21 languages. Baseten hosts it at about 1¢/hr [src](https://www.baseten.co/blog/nvidia-nemotron-3-diarization/). |
| **Streaming Sortformer 4spk v2.1** | Yes, 0.32 s and up | CALLHOME-2spk 6.57%, 4spk 12.44%, DIHARD III 13.24%. **Hard cap of 4 speakers**: 42.56% DER with 5 or more [src](https://huggingface.co/nvidia/diar_streaming_sortformer_4spk-v2.1) | Available on Apple through Argmax Pro [src](https://www.argmaxinc.com/blog/speakerkit) |
| **pyannoteAI** | Streaming through the Live-1 API (beta); open-source Community-1 is offline only | Precision-2 from €0.096/hr; Community-1 €0.035/hr [src](https://www.pyannote.ai/pricing) | Offline refinement after the meeting |
| **Vendor built-ins** | Soniox (included), AssemblyAI (+$0.12/hr), Deepgram (+$0.12/hr), Azure (+$0.30/hr), Speechmatics, AWS | — | Easiest path. Quality on zh is unmeasured. |

**Why in-room single-mic diarization is hard:**
- A far-field single distant mic (AMI "SDM") gives much lower SNR than headset mics.
- Overlap is the dominant error source: one SDM meeting study found **27.9% of frames with two simultaneous speakers** [src](https://arxiv.org/html/2402.08932v1).
- Reverberation and similar voices make clustering unstable. Streaming models must also decide on labels with less than 1 s of context.

**Design implications:**
- **Remote meetings:** use channel separation for free. Mic = "me", system audio = "others". Only diarize the system-audio channel.
- **Names:** true per-participant identity requires a bot, Zoom RTMS, or reading the active-speaker UI (fragile). Otherwise, let users name clusters once and persist speaker embeddings per contact (enrollment).
- **In-room (Phase 2):** a mic array's direction of arrival (XVF3800) is a strong extra cue for diarization.
- Treat diarization labels as provisional in the UI, and re-diarize offline after the meeting.

---

## 3. Audio capture

### 3.1 macOS native (recommended)

- **Core Audio process taps** (`AudioHardwareCreateProcessTap` + `CATapDescription` + aggregate device):
  - The API arrived in macOS 14.2; Apple's sample and TCC behaviour target 14.4 and later [src](https://developer.apple.com/documentation/CoreAudio/capturing-system-audio-with-core-audio-taps), [src](https://github.com/insidegui/AudioCap).
  - Permission is the narrower **"System Audio Recording Only"** (`NSAudioCaptureUsageDescription`), not Screen Recording [src](https://developer.apple.com/documentation/bundleresources/information-property-list/nsaudiocaptureusagedescription).
  - There is **no public API to check or request that permission up front** [src](https://github.com/insidegui/AudioCap).
  - You can tap per-process (for example Zoom). Browsers are harder because audio comes from helper or renderer processes [src](https://www.recall.ai/blog/core-audio-taps).
- **ScreenCaptureKit:** system audio since macOS 13; microphone capture added in macOS 15 (my knowledge; Recall's page says 16+, conflicting, so unverified). It needs the Screen Recording permission, which is heavier for users.
- **How Granola does it:**
  - It captures device system audio plus the mic, with no bot. It cannot isolate a single app, so music gets transcribed too. It does not store audio [src](https://help.granola.ai/article/transcription).
  - Its transcription subprocessors are Deepgram and AssemblyAI [src](https://www.granola.ai/security).
  - One secondary source says it is built as Electron plus a native Swift helper [src](https://ampcode.com/threads/T-019c999d-a6a6-73db-8970-4804d16814c4) (unverified).
- **Gotchas:**
  - Echo: mic plus speakers means remote voices get captured twice. Use `AVAudioEngine` voice processing (AEC) or dedupe by cross-correlation.
  - Handle device changes (AirPods switching).
  - Sample-rate conversion and clock drift between the two streams [src](https://www.recall.ai/blog/core-audio-taps).
  - Older macOS needs a virtual driver such as BlackHole.

### 3.2 Browser capture

- `getDisplayMedia` tab audio works in Chromium.
- **System or window audio on macOS needs Chrome 141+ on macOS 14.2+**, and the user must pick a window or screen and tick "share audio" every session [src](https://blog.addpipe.com/getdisplaymedia-allows-capturing-the-screen-with-system-sounds-on-chrome-on-macos/). Safari and Firefox support is unverified.
- This is fine for a web MVP where Meet runs in a Chrome tab. It is not viable for an always-on side panel.

### 3.3 Meeting bots and platform APIs

| Path | Status / price | Pros / cons |
|---|---|---|
| **Recall.ai** bot or Desktop Recording SDK | **$0.50/recording-hr**, transcription +$0.15/hr, no platform fee (2026) [src](https://www.recall.ai/blog/new-recall-ai-pricing-for-2026) | Per-participant audio (for example Teams) [src](https://www.recall.ai/product/meeting-bot-api/microsoft-teams). Also fronts Zoom RTMS [src](https://docs.recall.ai/docs/meeting-direct-connect-for-zoom-rtms). A visible bot adds social friction. |
| **Zoom RTMS** | Self-service purchasing since May 2026 via Developer Pack credits; paid plans only [src](https://devforum.zoom.us/t/rtms-self-service-purchasing-is-now-available/144524). Per-minute price not public (unverified). | Bot-less WebSocket feed with isolated audio, transcript and speaker events. Needs a Marketplace app and host/admin enablement. |
| **Zoom Meeting SDK bot** | Per-user raw PCM [src](https://developers.zoom.us/docs/meeting-sdk/ios/add-features/raw-data/) | You run headless Linux infrastructure |
| **Teams application-hosted media bot** | C#/.NET, **Windows Server in Azure** for production, 2+ vCPU per VM [src](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots) | Heavy lift for a 1–3 person team. Use Recall instead. |
| **Google Meet Media API** | **Still Developer Preview.** The Cloud project, the OAuth principal *and all participants* must be enrolled [src](https://developers.google.com/workspace/meet/media-api/guides/overview) | Not production-viable yet |

**Recommendation:** go native-capture first (macOS). Add Recall.ai in Phase 3 for customers who want identity-accurate speakers or Windows/room coverage.

---

## 4. Real-time LLM pipeline

### 4.1 Latency budget (target: card within about 3–5 s of the triggering utterance)

These are engineering estimates, not measured.

| Stage | Budget |
|---|---|
| Audio chunk to ASR partial | 0.1–0.3 s (vendor claims 100–200 ms) |
| ASR final / endpoint | 0.3–1.0 s after speech pause |
| Incremental extraction (small model) | 0.5–1.5 s (short output, about 150 tokens) |
| Retrieval: embed + hybrid search + rerank | 0.1–0.4 s (Zep reports P95 300 ms for graph retrieval [src](https://arxiv.org/abs/2501.13956)) |
| Card generation (mid model, streaming) | 1–2 s |
| Gating wait for a turn boundary | 0–3 s (by design) |

### 4.2 Model options (per 1M tokens, input/output)

| Model | Price | Role |
|---|---|---|
| GPT-5-nano | $0.05 / $0.40 [src](https://developers.openai.com/api/docs/pricing) | Always-on extractor |
| GPT-5-mini | $0.25 / $2.00 | Extractor or card writer |
| GPT-4.1-mini | $0.40 / $1.60 | Legacy option |
| Gemini 3.1 Flash-Lite | $0.25 / $1.50 [src](https://ai.google.dev/gemini-api/docs/pricing) | Extractor |
| Gemini 3.6–3.8 Flash | $0.75 / $3.75 until 31 Dec 2026, **doubling on 1 Jan 2027** [src](https://ai.google.dev/gemini-api/docs/pricing) | Card writer |
| Claude Haiku 4.5 | $1 / $5 (Anthropic API pricing, Sept 2026) | Extractor or card writer (strong Chinese) |
| Claude Sonnet 5.5 | $2 / $10 | Card writer and post-meeting summary |
| Local: Qwen3-4B/8B on MLX | Free at the margin. Prefill ~159 / 93 tok/s on Apple Silicon [src](https://arxiv.org/pdf/2601.19139) | Privacy mode extraction |

### 4.3 Architecture for streaming extraction

1. **Two-tier cascade.**
   - Tier 1 is a cheap model that runs every ~15–20 s window, or on each ASR final segment. Input is a compact rolling state (entity table, open topics, candidate decisions) plus new text. Output is structured JSON: `entities[]`, `topic_shift`, `decision_candidate`, `action_item{owner,due}`, `question_unanswered`, `retrieval_query`, `salience 0–1`.
   - Tier 2 is a stronger model, called only when Tier 1 salience and retrieval hits pass thresholds. It writes the card and cites its source.
2. **Prompt caching.** Keep the system prompt and glossary static as a cached prefix, and append new text. This roughly halves Tier-1 input cost.
3. **Custom vocabulary loop.** Use the same glossary (product names, client names, English acronyms) for ASR keyterms, for LLM normalization (fixing ASR spellings), and as entity seeds.

### 4.4 Deciding "when to surface"

Suggested policy (my design proposal, not from a paper):

- `score = relevance × novelty × confidence × actionability − interruption_cost(context)`
- **Relevance:** reranker score between the current window and the retrieved item.
- **Novelty:** 1 − max cosine similarity to cards already shown or to content already said in this meeting.
- **Confidence:** extractor self-report calibrated against user feedback, plus ASR confidence on key terms.
- **Interruption cost:** higher while the user is speaking. Surface only at turn boundaries (VAD silence over 700 ms or a speaker change). Cost rises exponentially with the number of cards in the last N minutes.
- **Hard limits:** a token bucket, for example at most 1 promoted card per 2 minutes and at most 8 per hour. Hold duplicates for 10 minutes. There is a "focus/presenting" mode, and nothing surfaces during screen-share (you can detect this via ScreenCaptureKit or the app state).
- **Two display levels:** an ambient tray that fills quietly with a low-salience list, and promotion (subtle highlight, never sound) only above threshold. Learn per-user thresholds from pin, dismiss and expand events.

**Supporting research:**
- Microsoft Research CHI 2025, "Are We On Track?": *passive* AI meeting feedback kept focus without disruption, while *active* interventions triggered reflection but "risked disrupting the conversation flow" [src](https://arxiv.org/pdf/2504.01082). A CHI 2026 large-scale pre-registered field experiment on meeting-goal nudges is referenced on the MSR project page [src](https://www.microsoft.com/en-us/research/project/intentional-meetings/).
- CHI 2025, "Assistance or Disruption?" (Codellaborator): proactive agents improved efficiency but introduced workflow disruptions. Presence indicators and context support mitigated them [src](https://arxiv.org/abs/2502.18658).
- CHI 2025, "Proactive Conversational Agents with Inner Thoughts": a covert, continuous "thought" stream that decides when to take a turn in multi-party chat beat baselines on turn-taking appropriateness [src](https://arxiv.org/abs/2501.00383). This maps directly onto the Tier-1/Tier-2 design.
- CHI 2026 extended abstract on proactive information support in in-person small groups (relevant to the Phase 2 device) [src](https://arxiv.org/abs/2601.17240).
- Horvitz et al., "Learning and Reasoning about Interruption" (MSR): the classic expected-cost-of-interruption framing [src](https://www.microsoft.com/en-us/research/publication/learning-and-reasoning-about-interruption/).
- ProactiveBench (Lu et al. 2024): 6,790 events; a fine-tuned model reached 66.47% F1 on *when* to help [src](https://arxiv.org/abs/2410.12361). Newer proactive-agent benchmarks exist (UniClawBench, ProEvent) [src](https://arxiv.org/abs/2607.08768).

### 4.5 Coreference such as 「上次那個方案」 ("that plan from last time")

1. **Temporal anchor:** resolve 「上次」 ("last time") using calendar metadata. That means the previous meeting in the same series or with the largest participant overlap. Fall back to the last 14 days.
2. **Type anchor:** map 「方案」 ("plan/proposal") to entity types {proposal, option, quote, plan}.
3. **Candidate retrieval:** pull those entities from the anchored meeting's decisions and topics (knowledge-graph edges with validity time), plus hybrid search.
4. **LLM ranking** with the current utterance's context.
5. **Show only if the top-1 margin is above a threshold.** Otherwise show a quiet "Did you mean A / B?" chip in the tray.

This needs an **entity registry with aliases** (Chinese and English names, abbreviations, ASR misspellings). That registry is where Graphiti-style temporal edges earn their keep.

---

## 5. Retrieval layer

**Embeddings (Chinese + English):**

| Model | Price | Notes |
|---|---|---|
| Qwen3-Embedding-8B / 4B / 0.6B | Open weights | 8B was #1 on the MMTEB multilingual leaderboard (70.58, Jun 2025); strong on C-MTEB [src](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models) |
| BGE-M3 | Open | Dense + sparse + multi-vector in one model; ~63.2 MTEB snapshot [src](https://www.morphllm.com/ollama-embedding-models) |
| OpenAI text-embedding-3-small / large | $0.02 / $0.13 per M [src](https://developers.openai.com/api/docs/pricing) | — |
| Voyage-4 / 4-lite / 4-large | $0.06 / $0.02 / $0.12 per M, first 200M tokens free [src](https://docs.voyageai.com/docs/pricing) | — |
| Cohere Embed v4 | $0.12 per M text [src](https://embeddingcost.com/cohere) | — |
| Gemini Embedding 2 | $0.20 per M [src](https://ai.google.dev/gemini-api/docs/pricing) | — |

**Recommendation:** Qwen3-Embedding-0.6B locally (Mac/edge) and Voyage-4 or Qwen3-Embedding-4B in the cloud. Run a small C-MTEB-style eval on your own documents first.

**Rerankers:**
- Voyage rerank-2.5: $0.05 per M tokens [src](https://docs.voyageai.com/docs/pricing).
- Cohere Rerank 4 Pro / Fast: $2.50 / $2.00 per 1k searches [src](https://openrouter.ai/cohere/rerank-4-pro/pricing).
- Qwen3-Reranker (open) for self-hosting [src](https://arxiv.org/pdf/2506.05176).

**Hybrid search and the Chinese tokenization trap:**
- Chinese has no spaces, so lexical search needs segmentation.
- SQLite FTS5's `trigram` tokenizer handles CJK, but matches need at least 3 characters, and many key Chinese terms are 2 characters (for example 報價, "quote"). Pre-segment with jieba into a whitespace-joined column, or index character bigrams.
- The same trick works on any managed Postgres: segment in the app, then store a `to_tsvector('simple', …)`. This avoids needing the zhparser/pg_jieba extensions.
- Fuse lexical and vector results with RRF [src](https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html).

**Vector stores:**
- **Cloud:** Postgres + pgvector (one database for app data, permissions, ACL filtering). Move to Qdrant only past roughly 10M+ chunks or if heavy filtering hurts.
- **Local:** sqlite-vec + FTS5 (tiny footprint, one file) or LanceDB (columnar, better for large corpora) [src](https://www.firecrawl.dev/blog/best-vector-databases).

**Knowledge graph:**
- Zep/Graphiti is a temporal KG where each edge has a validity interval (valid until superseded), which suits "decision X was replaced by Y". It reports P95 retrieval of 300 ms and 94.8% on the DMR benchmark [src](https://arxiv.org/abs/2501.13956). Graphiti is open source; Zep's hosted tier starts around $25/month [src](https://vectorize.io/articles/mem0-vs-zep).
- **Recommendation:** start with a relational entity/decision/action table in Postgres with `valid_from` / `valid_to` columns ("KG-lite"). Adopt Graphiti only when multi-hop queries become a proven need.

**Connectors (Phase 3):**
- **Google Drive:** Drive API `changes.list` for incremental sync (standard; no pricing).
- **M365:**
  - Graph delta queries for OneDrive/SharePoint.
  - The **Copilot Retrieval API** returns permission-trimmed text extracts from SharePoint, OneDrive and Copilot connectors [src](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/api/ai-services/retrieval/overview).
  - Pay-as-you-go is $0.10 per call, preview since Jan 2026. It covers SharePoint and connectors only, not OneDrive, and needs at least one Copilot license in the tenant [src](https://office365itpros.com/2026/04/14/copilot-retrieval-api/).
- **Notion:** about 3 requests/s per integration, plus workspace limits [src](https://developers.notion.com/reference/request-limits). The hosted Notion MCP includes meeting-notes queries [src](https://www.jitendrazaa.com/blog/integration/notion-mcp-server-complete-guide-setup-troubleshooting-ai/).
- **MCP as the integration path:**
  - Use vendor-hosted MCP servers (Notion, and others) for *on-demand* lookups during card generation.
  - Keep your own sync plus index for *low-latency* retrieval. MCP round-trips (hundreds of ms to seconds, plus rate limits) are too slow for the 3 s budget.
  - Expose ELIVO itself as an MCP server so Claude, ChatGPT or Copilot users can query their meeting memory. This is cheap distribution.

---

## 6. Unit economics (per meeting-hour)

**Assumptions** (mine; tune after measurement):
- Transcript ≈ 15k tokens/hr.
- Tier-1 extraction every 20 s: 180 calls × 2k input (half cacheable) + 150 output, so 360k input / 27k output.
- ~30 retrievals/hr, each reranking 20 × 300-token candidates (180k rerank tokens).
- 12 Tier-2 card generations × 6k input / 250 output, so 72k input / 3k output.
- Post-meeting summary: 20k input / 2k output.
- Infrastructure (WebSocket servers, database, storage): $0.02–0.05/hr (estimate).

**Component costs:**

| Component | Option | $/meeting-hr |
|---|---|---|
| **ASR** | Soniox RT (with diarization) | 0.12 |
| | Deepgram Nova-3 zh-TW + diarization (promo / list) | 0.41 / 0.58 |
| | ElevenLabs Scribe v2 RT | 0.39 |
| | Speechmatics RT Enhanced | 0.43 |
| | AssemblyAI U3.6 Pro + diarization | 0.57 |
| | OpenAI realtime transcribe | 1.02 |
| | Google Chirp 3 / AWS / Azure (+diarization +LID) | 0.96 / 1.44 / 1.60 |
| **Tier-1 extraction** | GPT-5-nano | 0.03 |
| | Gemini 3.1 Flash-Lite | 0.13 |
| | GPT-5-mini | 0.14 |
| | Haiku 4.5 (with cache) | ~0.33 |
| **Tier-2 cards** | Gemini Flash (2026 promo price) | 0.07 |
| | Haiku 4.5 | 0.09 |
| | Sonnet 5.5 | 0.17 |
| **Summary** | Sonnet 5.5 | 0.06 |
| **Embedding** | Any API | <0.01 |
| **Rerank** | Voyage 2.5 / Cohere 4 Pro | 0.01 / 0.075 |
| **Bot capture (optional)** | Recall.ai | +0.50 |

**Pipeline totals:**

| Pipeline | Composition | $/meeting-hr | $/user-month at 30 meeting-hrs |
|---|---|---|---|
| **A. Lean cloud** | Soniox + GPT-5-nano + Haiku cards + Sonnet summary + Voyage rerank + infra | **≈ $0.34** | ≈ $10 |
| **B. Quality cloud** | Speechmatics or Scribe (~0.40) + Haiku Tier-1 + Sonnet cards/summary + Cohere rerank + infra | **≈ $1.05–1.10** (≈ $0.80 with Soniox) | ≈ $24–33 |
| **C. Hyperscaler** | Azure (with diarization + LID) + GPT-5-mini + Sonnet + Cohere | **≈ $2.10** | ≈ $63 |
| **D. Hybrid local** | On-device ASR (Breeze via WhisperKit, or SpeechAnalyzer) + local MLX extractor + cloud Haiku cards + Sonnet summary | **≈ $0.18** (plus Argmax licence if used, unverified) | ≈ $5 |

Notes:
- Pipeline D moves cost to the user's battery and thermals. It needs Apple Silicon with 16GB+ for comfortable ASR + 4B LLM concurrency (estimate).
- Gemini Flash prices double on 1 Jan 2027, so don't lock the model around the promo price.
- The Deepgram rate is promotional.

---

## 7. Phase 2 hardware feasibility

**Platform options:**

| Platform | Compute | Price signals | Verdict |
|---|---|---|---|
| **ESP32-S3 thin client** + XVF3800 + 3.5–7" LCD | Wi-Fi streaming only; all inference on Mac or cloud | Seeed sells an XVF3800 + XIAO ESP32S3 combo [src](https://www.seeedstudio.com/ReSpeaker-XVF3800-4-Mic-Array-With-XIAO-ESP32S3-p-6489.html). Estimated BOM ~$40–80 (unverified). | **Best first device.** Cheap; a pre-certified radio module cuts FCC cost. |
| **Raspberry Pi 5 / CM5** | 4× A76, no NPU | Memory-driven price hikes in 2026: 8GB +$30, 16GB +$60 in Feb 2026 [src](https://www.raspberrypi.com/news/more-memory-driven-price-rises/); Pi 5 16GB now $205 [src](https://www.tomshardware.com/raspberry-pi/raspberry-pi-5-price-increases-drastically-as-ai-shortage-bites-16gb-version-now-usd205-second-price-increase-in-three-months-over-70-percent-more-expensive-than-original-msrp) | Good prototyping; weak for local ASR/LLM |
| **Rockchip RK3588** | 8-core, **6 TOPS NPU**; 4B LLM at ~5–8 tok/s [src](https://turingpi.com/run-llm-locally-arm-rk3588-ollama-llama-cpp/) | Orange Pi 5 Max ~$160 retail [src](https://tinycomputers.io/posts/rk3588-orange-pi-5-max-review.html) | Can run SenseVoice/Paraformer + a small LLM locally; strong Taiwan/Shenzhen ODM ecosystem |
| **Jetson Orin Nano Super** | 67 TOPS | **Now $399** after NVIDIA's July 2026 hike of up to 101% [src](https://www.cnx-software.com/2026/07/22/nvidia-increases-the-price-of-jetson-modules-and-devkits-by-up-to-101/) | Too expensive for a consumer BOM |
| **Android panel** (RK3566/3568-class, 8–10") | Runs the Android app | ~$60–150 at ODM (unverified) | Fastest path to market; ODMs often hold existing certifications |

**Mic arrays:**
- reSpeaker XVF3800: 4-mic circular array with AEC, beamforming, DoA, AGC, dereverberation, pickup up to 5 m, USB or I2S. **$54.90** ($49.90 at 10+) [src](https://www.seeedstudio.com/ReSpeaker-XVF3800-USB-Mic-Array-p-6488.html).
- At volume, design in the XVF3800 chip directly.

**Display:**
- **E-ink** suits the "glanceable, low-interruption" brand promise: no glow, low power, readable in sunlight. Refresh is slow and full refreshes flash, and there is little colour (qualitative).
- **E Ink Holdings is Taiwanese**, a local supply-chain advantage.
- **IPS LCD 7–10"** suits animation and higher density.
- A reasonable choice is a 7.5" colour e-paper for the "ambient" SKU and LCD for the "pro" SKU.

**Rough BOM** (estimates, unverified; 2026 DRAM inflation matters):
- Thin client: $45–90.
- RK3588 local-inference unit: $150–250.
- Retail at roughly 2.5–4× BOM.

**Certification:**
- **FCC:** $3k–8k and 2–6 weeks using a pre-certified module (Part 15B only); $18k–58k and 8–16 weeks for a custom radio [src](https://markready.io/learn/fcc-certification-cost).
- **NCC (Taiwan):** tens of thousands to NT$100k+, ~5–6 weeks. BSMI covers safety/EMC [src](https://www.blueasialabs.com/shouyehuandeng/2025-taiwan-ncc-product-certification-cost-a-complete-breakdown), [src](https://ib-lenhardt.com/type-approval/taiwan).
- **CE RED:** similar order to FCC (unverified).
- Lithium batteries add UN38.3 and IEC 62368 testing. Avoid a battery in v1 and use USB-C power.

**Taiwan advantage:**
- Local ODMs, E Ink, and MediaTek/Realtek silicon.
- Fast Hsinchu–Shenzhen prototyping loops.
- Local NCC test labs.
- The Breeze models come from MediaTek Research, a potential partnership.

**Lessons from other devices:**
- **Humane** was shut down in Feb 2025; HP bought its assets for $116M [src](https://www.axios.com/2025/02/18/humane-ai-pin-shut-down-hp). The standalone "phone replacement" category failed.
- **Rabbit** sold about 100k units on a demo it could not deliver [src](https://www.digitalapplied.com/blog/ai-product-failures-2026-sora-humane-rabbit-lessons).
- **Plaud** has shipped **2M+ devices, with its software business above $100M ARR** (Jun 2026) [src](https://techcrunch.com/2026/06/16/plaud-says-its-software-business-topped-100m-in-arr-after-shipping-over-2m-ai-notetakers/). It does one job (capture), pairs with a phone, and monetizes through subscription.
- **Takeaway:** make the Phase-2 device an accessory to the Phase-1 software (mic + ambient display for in-room meetings), not an independent AI.

---

## 8. Recommended Phase-1 stack (1–3 people)

**Desktop:**
- **Tauri 2 + React/TypeScript UI**, with a small **Swift helper**, either a sidecar binary or a Swift plugin via `swift-rs` [src](https://v2.tauri.app/develop/plugins/).
- The Swift helper handles Core Audio taps, mic with AEC, SpeechAnalyzer/WhisperKit, and MLX.
- Why:
  - The capture and local-ML code must be Swift regardless.
  - The React UI is shared with the web app and a future Windows build.
  - Tauri bundles are ~3–10 MB versus 120–200 MB for Electron, with much lower idle RAM [src](https://www.pkgpulse.com/guides/electron-vs-tauri-2026).
- Alternatives:
  - **Electron** is equally valid, and Granola reportedly uses it (unverified). Choose it if the team is JS-only and wants Chromium consistency.
  - **Pure SwiftUI** gives the best macOS feel but forks the UI from the web.

**Real-time backend:**
- **Python 3.12 + FastAPI/asyncio WebSockets**, because the AI and NLP ecosystem is there: jieba, OpenCC, pyannote, eval tooling, vendor SDKs.
- One "session worker" per live meeting fans audio out to the ASR vendor, runs Tier-1/Tier-2, and pushes cards.
- Put Redis Streams or NATS between stages when you scale out.

**Data:**
- Postgres (Neon/Supabase/Cloud SQL) + pgvector + app-side jieba tokens for lexical search.
- Object storage only if the user opts in to keeping audio (default: don't store, like Granola).
- Locally: SQLite + sqlite-vec + FTS5.

**Infra and regions:**
- GCP `asia-east1` (Changhua, Taiwan) for Taiwanese enterprise data-residency expectations. The AWS Taipei region status is unverified; check it.
- Run behind a vendor abstraction layer. ASR and LLM must stay swappable because prices change monthly: Deepgram's promo, Gemini's January 2027 doubling, Speechmatics' July cut.

**Build order:**
1. Mac capture helper + Soniox streaming + OpenCC + live transcript (weeks 1–3).
2. Internal zh-TW code-switch evaluation harness (in parallel).
3. Tier-1 extractor + entity registry + ambient tray (weeks 4–6).
4. Hybrid retrieval over past meetings + gated Tier-2 cards (weeks 7–10).
5. Drive/Notion ingestion, then an ELIVO MCP server.

**Compliance:**
- Taiwan's Personal Data Protection Act (PDPA) and US two-party-consent states: add a clear recording indicator and an optional auto-message to participants.
- Use zero-retention agreements with ASR and LLM vendors, which enterprise buyers in Taiwan will ask about.

---

**Top unverified items to close first:**
1. Traditional-script output and code-switch quality for Soniox, Scribe v2 RT and Speechmatics `cmn_en` on Taiwanese speech.
2. AssemblyAI streaming Chinese support scope.
3. Zoom RTMS per-minute price.
4. Argmax Pro licence cost.
5. Android-panel and thin-client BOM quotes from Taiwanese ODMs.