import { Config } from '../../../config/index';
import { DataSourceOptions } from 'typeorm';
import { entities } from './entitity';
import { migrations } from './migration';

export const createOrmConfig = (): DataSourceOptions => {
  const { host, port, database, username, password } =
    Config.getPostGresConfig();
  const postgressPool = Config.getPostgresPoolConfig();

  const connectionOpts: DataSourceOptions = {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    synchronize: true, // Migrations will handle DB schema changes
    logging: false,
    entities: entities(),
    migrations: migrations(),
    extra: {
      max: postgressPool.max,
      min: postgressPool.min,
      idleTimeoutMillis: postgressPool.idleTimeoutMillis,
      connectionTimeoutMillis: postgressPool.connectionTimeoutMillis,
    },
  };
  return connectionOpts;
};
