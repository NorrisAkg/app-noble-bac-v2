/**
 * Deep linking from notifications.
 *
 * The backend attaches a `link` field to every notification's `data` payload
 * (an expo-router path, e.g. `/my-subscription` or `/(tabs)/library?examId=7`).
 * The mobile app reads it on tap and routes there.
 */

/**
 * Extract the deep-link path from a notification `data` payload, or null when
 * absent / unsafe. Only internal app paths (starting with `/`) are accepted —
 * this guards against routing to anything the backend didn't intend.
 */
export function resolveNotificationLink(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) {
    return null;
  }

  const link = data.link;

  if (typeof link !== 'string' || !link.startsWith('/')) {
    return null;
  }

  return link;
}
