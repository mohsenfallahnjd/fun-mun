import NextLink from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof NextLink>;

export function Link({ className = "", ...props }: LinkProps) {
  return (
    <NextLink
      className={`text-accent underline-offset-4 transition-colors hover:text-accent/80 hover:underline ${className}`}
      {...props}
    />
  );
}

export default Link;
