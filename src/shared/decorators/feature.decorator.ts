import { SetMetadata } from '@nestjs/common';

export const FEATURE_KEY = 'platform_feature';
export const Feature = (featureCode: string) =>
  SetMetadata(FEATURE_KEY, featureCode);
