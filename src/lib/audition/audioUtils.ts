export function float32ToInt16(buffer: Float32Array): Int16Array {
  const out = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function int16ToFloat32(buffer: Int16Array): Float32Array {
  const out = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    out[i] = buffer[i] / (buffer[i] < 0 ? 0x8000 : 0x7fff);
  }
  return out;
}

export function int16ToBase64(buffer: Int16Array): string {
  const bytes = new Uint8Array(buffer.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
