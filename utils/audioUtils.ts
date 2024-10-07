export function encodeAudioToBase64(audioData: Int16Array): string {
  const buffer = new ArrayBuffer(audioData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < audioData.length; i++) {
    view.setInt16(i * 2, audioData[i], true);
  }
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))));
  return base64;
}
