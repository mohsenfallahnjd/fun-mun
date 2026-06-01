import type { ContentRating } from "@/lib/rating";
import type { LeisureProgress, LeisureStatus, LeisureType } from "@/lib/types";

export interface PublicItemProfile {
  id: string;
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  isOwn: boolean;
}

export interface PublicItemDetail {
  id: string;
  type: LeisureType;
  title: string;
  subtitle?: string;
  originalTitle?: string;
  imageUrl?: string;
  watchUrl?: string;
  notes?: string;
  status: LeisureStatus;
  year?: number;
  rating?: ContentRating;
  progress?: LeisureProgress;
  createdAt: string;
}

export interface PublicItemPayload {
  profile: PublicItemProfile;
  item: PublicItemDetail;
}

export function readPageHref(watchUrl: string, back?: string): string {
  const params = new URLSearchParams({ url: watchUrl });
  if (back) params.set("back", back);
  return `/read?${params.toString()}`;
}
