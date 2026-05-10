import { Config } from '../../../config/index';
import * as path from 'path';

export const migrations = () => {
  const defaultMigrations = [
    path.join(
      process.cwd(),
      'dist/core/database/postgres/migrations/**/*{.ts,.js}',
    ),
  ];
  const migrationsList = [
    ...defaultMigrations,
    // Add other project migrations here if any
  ];
  return migrationsList;
};
