// Only missing metadata selects the legacy identity. Invalid custom metadata
// must stop the build instead of silently crediting a different author.
export function resolveArticleAttribution(value) {
  if (value === undefined) return { text: null, xHandle: 'selawmqt' };

  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      typeof value.text !== 'string' || !value.text.trim()) {
    throw new TypeError('Invalid article attribution: text must be a nonempty string');
  }

  const handle = value.x_handle;
  if (handle !== undefined &&
      (typeof handle !== 'string' || handle.length < 1 || handle.length > 15 ||
       /[^A-Za-z0-9_]/.test(handle))) {
    throw new TypeError('Invalid article attribution: x_handle must be 1-15 letters, digits or underscores');
  }

  // Text remains a plain React child. The page builds X URLs on a fixed host.
  return { text: value.text, xHandle: handle ?? null };
}
