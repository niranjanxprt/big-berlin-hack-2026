export type ContentTypeId = 'video' | 'image' | 'animation';

export type AspectRatioId = 'vertical' | 'square' | 'horizontal';

export type PlatformId =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'youtube';

export type PlatformConfig = {
  audience: string;
  contentTypes: ContentTypeId[];
  templates: Partial<Record<ContentTypeId, string>>;
  aspectRatios: Partial<Record<ContentTypeId, AspectRatioId>>;
};

export type ChoiceConfig = {
  platforms: Partial<Record<PlatformId, PlatformConfig>>;
};
