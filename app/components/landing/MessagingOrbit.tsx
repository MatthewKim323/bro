"use client";

// the messaging platforms bro lives in, orbiting the "lives where you
// do" section. real app icons (transparent, in public/), orbited on a
// slow ellipse with the path shown. gentle tilt so it does not slope
// hard.

import OrbitImages from "./OrbitImages";

const LOGOS = [
  "/icon-discord.webp",
  "/icon-imessage.png",
  "/icon-telegram.png",
  "/icon-instagram.png",
  "/icon-x.webp",
  "/icon-whatsapp.webp",
];

export function MessagingOrbit() {
  return (
    <OrbitImages
      images={LOGOS}
      shape="ellipse"
      radiusX={580}
      radiusY={170}
      rotation={-3}
      duration={32}
      itemSize={170}
      showPath
      pathColor="rgba(94,115,81,0.45)"
      pathWidth={3}
      responsive
    />
  );
}
