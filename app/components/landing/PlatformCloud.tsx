"use client";

// the platforms bro plugs into, on a rotating icon cloud. real brand
// marks via the simple-icons package (already a dependency): every mark
// is a normalized 24x24 path, so every logo renders the exact same
// size. colored with each brand's official hex. slugs absent from this
// simple-icons build (openai, slack, etc.) are simply not listed.

import {
  siDiscord,
  siTelegram,
  siWhatsapp,
  siSignal,
  siInstagram,
  siX,
  siMessenger,
  siWechat,
  siLine,
  siSnapchat,
  siReddit,
  siImessage,
  siAnthropic,
  siClaude,
  siGmail,
  siZoom,
  siNotion,
  siGooglecalendar,
  siGooglemessages,
  siKakaotalk,
  siViber,
  siThreads,
  siBluesky,
  siGooglechat,
  siFacebook,
} from "simple-icons";
import { IconCloud } from "./IconCloud";

const ICONS = [
  siDiscord,
  siTelegram,
  siWhatsapp,
  siSignal,
  siInstagram,
  siX,
  siMessenger,
  siWechat,
  siLine,
  siSnapchat,
  siReddit,
  siImessage,
  siAnthropic,
  siClaude,
  siGmail,
  siZoom,
  siNotion,
  siGooglecalendar,
  siGooglemessages,
  siKakaotalk,
  siViber,
  siThreads,
  siBluesky,
  siGooglechat,
  siFacebook,
];

const IMAGES = ICONS.map(
  (i) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${i.path}' fill='#${i.hex}'/></svg>`,
    )}`,
);

export function PlatformCloud() {
  return <IconCloud images={IMAGES} />;
}
