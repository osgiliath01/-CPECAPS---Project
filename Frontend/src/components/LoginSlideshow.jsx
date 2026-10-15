import { useEffect, useState } from "react";

const modules = import.meta.glob("../assets/login/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});
const IMAGES = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);

export default function LoginSlideshow({ interval = 6000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (IMAGES.length < 2) return;
    // after the last image, (i + 1) % length wraps back to the first
    const t = setInterval(() => setIndex((i) => (i + 1) % IMAGES.length), interval);
    return () => clearInterval(t);
  }, [interval]);

  if (IMAGES.length === 0) return null;

  return (
    <div className="login-slides" aria-hidden="true">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className={`login-slide${i === index ? " active" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}