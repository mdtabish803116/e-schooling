import * as path from 'path';

export const entities = () => {
  const rootDir = process.cwd();
  const isTsNode =
    process.argv.some((arg) => arg.includes('ts-node')) ||
    !__dirname.includes('dist');

  const pattern = isTsNode
    ? path.join(rootDir, 'src/models/entities/**/*.entity.ts')
    : path.join(rootDir, 'dist/models/entities/**/*.entity.js');

  return [pattern.replace(/\\/g, '/')];
};
