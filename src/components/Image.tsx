import NextImage, { type ImageProps } from "next/image";
import { proxiedImageSrc } from "@/lib/image-proxy";

export function Image({ src, ...props }: ImageProps) {
  const resolvedSrc = typeof src === "string" ? proxiedImageSrc(src) : src;
  return <NextImage {...props} src={resolvedSrc} />;
}

export default Image;
