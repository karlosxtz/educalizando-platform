export type PresentationVideo = { provider: 'youtube' | 'instagram'; id: string; url: string; embedUrl: string };

/** Only canonical public media URLs. Never embed arbitrary origins, delivery links or HTML. */
export function presentationVideo(value: unknown): PresentationVideo | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return { provider: 'youtube', id, url: `https://www.youtube.com/watch?v=${id}`, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (['instagram.com', 'www.instagram.com'].includes(host)) {
      const match = /^\/(reel|reels|p|tv)\/([\w-]{3,128})\/?$/.exec(url.pathname);
      if (!match) return null;
      const kind = match[1] === 'reels' ? 'reel' : match[1];
      const canonical = `https://www.instagram.com/${kind}/${match[2]}/`;
      return { provider: 'instagram', id: match[2], url: canonical, embedUrl: canonical + 'embed/' };
    }
  } catch { /* Invalid/unsupported URLs never reach an iframe. */ }
  return null;
}
export function productPresentationVideo(product: { presentation_video_url?: string | null; instagram_video_url?: string | null }) {
  return presentationVideo(product.presentation_video_url) || presentationVideo(product.instagram_video_url);
}
export function presentationEmbedUrl(video: PresentationVideo, preview = false) {
  return video.provider === 'youtube'
    ? `${video.embedUrl}?autoplay=1&mute=1&playsinline=1&rel=0&controls=${preview ? 0 : 1}&loop=1&playlist=${video.id}`
    : video.embedUrl;
}
