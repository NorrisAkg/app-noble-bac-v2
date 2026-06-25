import { resolveNotificationLink } from '../utils/notificationLink';

describe('resolveNotificationLink', () => {
  it('returns the internal path carried by the notification data', () => {
    expect(resolveNotificationLink({ link: '/my-subscription' })).toBe('/my-subscription');
    expect(resolveNotificationLink({ link: '/(tabs)/library?examId=7' })).toBe(
      '/(tabs)/library?examId=7',
    );
  });

  it('returns null when no link is present', () => {
    expect(resolveNotificationLink(null)).toBeNull();
    expect(resolveNotificationLink(undefined)).toBeNull();
    expect(resolveNotificationLink({})).toBeNull();
    expect(resolveNotificationLink({ type: 'welcome' })).toBeNull();
  });

  it('rejects non-string or non-internal links', () => {
    expect(resolveNotificationLink({ link: 42 })).toBeNull();
    expect(resolveNotificationLink({ link: 'https://evil.example.com' })).toBeNull();
    expect(resolveNotificationLink({ link: 'my-subscription' })).toBeNull();
  });
});
