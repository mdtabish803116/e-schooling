import { Config } from '../../../config/index';
import * as path from 'path';

export const migrations = () => {
  const rootDir = process.cwd();
  const isTsNode =
    process.argv.some((arg) => arg.includes('ts-node')) ||
    !__dirname.includes('dist');

  const pattern = isTsNode
    ? path.join(rootDir, 'src/core/database/postgres/migrations/**/*{.ts,.js}')
    : path.join(rootDir, 'dist/core/database/postgres/migrations/**/*{.ts,.js}');

  return [pattern.replace(/\\/g, '/')];
};
