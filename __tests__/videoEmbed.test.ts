import { buildEmbedUri, isPlayerExitUrl } from '@/utils/videoEmbed';

describe('buildEmbedUri', () => {
  it('construit une URL de lecteur embarqué YouTube, pas une page du site', () => {
    const uri = buildEmbedUri('youtube', 'abc123');
    expect(uri).toContain('https://www.youtube-nocookie.com/embed/abc123');
    expect(uri).not.toContain('/watch');
  });

  it('applique les paramètres du lecteur YouTube', () => {
    const uri = buildEmbedUri('youtube', 'abc123');
    expect(uri).toContain('playsinline=1');
    expect(uri).toContain('rel=0');
    expect(uri).toContain('modestbranding=1');
    expect(uri).toContain('iv_load_policy=3');
  });

  it('échappe les identifiants de vidéo', () => {
    expect(buildEmbedUri('youtube', 'a b/c')).toContain('/embed/a%20b%2Fc?');
  });

  it('utilise le lecteur Vimeo pour le provider vimeo', () => {
    expect(buildEmbedUri('vimeo', '987')).toBe(
      'https://player.vimeo.com/video/987?autoplay=1&playsinline=1',
    );
  });
});

describe('isPlayerExitUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc123',
    'https://m.youtube.com/watch?v=abc123',
    'https://www.youtube.com/',
    'https://www.youtube.com/@chaine',
    'https://youtu.be/abc123',
    'https://vimeo.com/987',
  ])('bloque la sortie vers le site : %s', (url) => {
    expect(isPlayerExitUrl(url)).toBe(true);
  });

  it.each([
    'https://www.youtube-nocookie.com/embed/abc123?playsinline=1',
    'https://www.youtube.com/embed/abc123',
    'https://player.vimeo.com/video/987?autoplay=1',
    'about:blank',
  ])('laisse passer le lecteur : %s', (url) => {
    expect(isPlayerExitUrl(url)).toBe(false);
  });

  it('ne bloque pas les ressources tierces chargées par le lecteur', () => {
    expect(isPlayerExitUrl('https://googleads.g.doubleclick.net/pagead/id')).toBe(false);
    expect(isPlayerExitUrl('https://i.ytimg.com/vi/abc123/hqdefault.jpg')).toBe(false);
  });
});
