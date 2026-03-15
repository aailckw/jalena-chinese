/**
 * MediaRecorder helper for browser audio capture.
 * Chunks are collected and passed to onRecordComplete as a single Blob.
 */
export function getRecorder(stream: MediaStream): MediaRecorder {
  const options: MediaRecorderOptions = { audioBitsPerSecond: 16000 };
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    options.mimeType = "audio/webm;codecs=opus";
  }
  return new MediaRecorder(stream, options);
}
