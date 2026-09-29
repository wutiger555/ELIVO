// systap：用 Core Audio process tap（macOS 14.2+）擷取系統音訊，
// 轉成 16 kHz mono float32 little-endian，寫到 stdout，給 stream_demo.py 當「他人」那一路。
//
// 不需要安裝 BlackHole 等虛擬音訊驅動。第一次執行時，macOS 會對啟動它的 App（例如終端機）
// 詢問「系統錄音」權限；沒給權限時 tap 仍會啟動，但只會收到靜音。
//
// 編譯：./build.sh    執行：./systap > out.f32    （Ctrl-C 結束）

import AVFoundation
import AudioToolbox
import CoreAudio
import Foundation

func log(_ msg: String) {
    FileHandle.standardError.write(("systap: " + msg + "\n").data(using: .utf8)!)
}

func check(_ status: OSStatus, _ what: String) {
    if status != noErr {
        log("\(what) 失敗（OSStatus \(status)）")
        exit(1)
    }
}

func getProperty<T: BitwiseCopyable>(_ obj: AudioObjectID, _ selector: AudioObjectPropertySelector, _ value: inout T) -> OSStatus {
    var addr = AudioObjectPropertyAddress(
        mSelector: selector, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var size = UInt32(MemoryLayout<T>.size)
    return AudioObjectGetPropertyData(obj, &addr, 0, nil, &size, &value)
}

func getString(_ obj: AudioObjectID, _ selector: AudioObjectPropertySelector) -> String? {
    var addr = AudioObjectPropertyAddress(
        mSelector: selector, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var value: Unmanaged<CFString>?
    var size = UInt32(MemoryLayout<Unmanaged<CFString>?>.size)
    guard AudioObjectGetPropertyData(obj, &addr, 0, nil, &size, &value) == noErr, let value else { return nil }
    return value.takeRetainedValue() as String
}

// 1. 全域立體聲 tap：擷取所有程序的輸出，但不排除任何程序；不靜音原本的播放
let tapDesc = CATapDescription(stereoGlobalTapButExcludeProcesses: [])
tapDesc.uuid = UUID()
tapDesc.name = "ELIVO systap"
tapDesc.isPrivate = true
tapDesc.muteBehavior = .unmuted

var tapID = AudioObjectID(kAudioObjectUnknown)
check(AudioHardwareCreateProcessTap(tapDesc, &tapID), "建立 process tap")

var tapASBD = AudioStreamBasicDescription()
check(getProperty(tapID, kAudioTapPropertyFormat, &tapASBD), "讀取 tap 格式")

// 2. 以預設輸出裝置為主時鐘，建立只含這個 tap 的私有 aggregate device
var outputID = AudioObjectID(kAudioObjectUnknown)
var addr = AudioObjectPropertyAddress(
    mSelector: kAudioHardwarePropertyDefaultSystemOutputDevice, mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain)
var size = UInt32(MemoryLayout<AudioObjectID>.size)
check(AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &outputID), "讀取預設輸出裝置")
guard let outputUID = getString(outputID, kAudioDevicePropertyDeviceUID) else {
    log("讀取輸出裝置 UID 失敗")
    exit(1)
}

let aggDesc: [String: Any] = [
    kAudioAggregateDeviceNameKey: "ELIVO systap",
    kAudioAggregateDeviceUIDKey: UUID().uuidString,
    kAudioAggregateDeviceMainSubDeviceKey: outputUID,
    kAudioAggregateDeviceIsPrivateKey: true,
    kAudioAggregateDeviceIsStackedKey: false,
    kAudioAggregateDeviceTapAutoStartKey: true,
    kAudioAggregateDeviceSubDeviceListKey: [[kAudioSubDeviceUIDKey: outputUID]],
    kAudioAggregateDeviceTapListKey: [[
        kAudioSubTapDriftCompensationKey: true,
        kAudioSubTapUIDKey: tapDesc.uuid.uuidString,
    ]],
]
var aggID = AudioObjectID(kAudioObjectUnknown)
check(AudioHardwareCreateAggregateDevice(aggDesc as CFDictionary, &aggID), "建立 aggregate device")

// 3. tap 格式（通常 48 kHz float32 立體聲）→ 16 kHz mono float32
guard let inFormat = AVAudioFormat(streamDescription: &tapASBD),
      let outFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16000, channels: 1, interleaved: false),
      let converter = AVAudioConverter(from: inFormat, to: outFormat)
else {
    log("無法建立格式轉換器")
    exit(1)
}
log("tap 格式：\(Int(inFormat.sampleRate)) Hz、\(inFormat.channelCount) 聲道 → 16000 Hz mono")

let stdout = FileHandle.standardOutput
let queue = DispatchQueue(label: "elivo.systap.io")
var heard = false  // 只在 queue 上讀寫

var procID: AudioDeviceIOProcID?
check(AudioDeviceCreateIOProcIDWithBlock(&procID, aggID, queue) { _, inInputData, _, _, _ in
    guard let inBuf = AVAudioPCMBuffer(pcmFormat: inFormat, bufferListNoCopy: inInputData, deallocator: nil) else { return }
    let capacity = AVAudioFrameCount(Double(inBuf.frameLength) * 16000 / inFormat.sampleRate) + 32
    guard let outBuf = AVAudioPCMBuffer(pcmFormat: outFormat, frameCapacity: capacity) else { return }
    var fed = false
    var error: NSError?
    converter.convert(to: outBuf, error: &error) { _, status in
        if fed {
            status.pointee = .noDataNow
            return nil
        }
        fed = true
        status.pointee = .haveData
        return inBuf
    }
    guard error == nil, outBuf.frameLength > 0, let ch = outBuf.floatChannelData?[0] else { return }
    let n = Int(outBuf.frameLength)
    if !heard {
        for i in 0..<n where ch[i] != 0 {
            heard = true
            break
        }
    }
    stdout.write(Data(bytes: ch, count: n * MemoryLayout<Float>.size))
}, "建立 IO proc")
check(AudioDeviceStart(aggID, procID), "啟動擷取")
log("擷取中（Ctrl-C 結束）")

// 開始 10 秒內完全沒有聲音就提醒一次：沒有「系統錄音」權限時 tap 只會送出全零
DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
    queue.async {
        if !heard {
            log("前 10 秒只收到靜音。若確實有聲音在播放，請到「系統設定 › 隱私權與安全性 › 螢幕與系統錄音」允許啟動 systap 的 App（例如終端機）錄製系統音訊")
        }
    }
}

func shutdown() {
    AudioDeviceStop(aggID, procID)
    if let procID { AudioDeviceDestroyIOProcID(aggID, procID) }
    AudioHardwareDestroyAggregateDevice(aggID)
    AudioHardwareDestroyProcessTap(tapID)
    exit(0)
}

var signalSources: [DispatchSourceSignal] = []
for sig in [SIGINT, SIGTERM, SIGPIPE] {
    signal(sig, SIG_IGN)
    let src = DispatchSource.makeSignalSource(signal: sig, queue: .main)
    src.setEventHandler(handler: shutdown)
    src.resume()
    signalSources.append(src)
}
dispatchMain()
