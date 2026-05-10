import { Config } from '../../../config/index';
import * as path from 'path';

export const entities = () => {
  const entitiesList = [
    path.join(
      process.cwd(),
      'dist/models/entities/**/*.entity{.ts,.js}',
    ),
  ];
  return entitiesList;
};
