import 'dotenv/config';

import { DataSource } from 'typeorm';
import { createOrmConfig } from './create-typeorm';

const AppDataSource = (async () => {
  try {
    const ormConfig = createOrmConfig();
    return new Promise((resolve) => {
      resolve(new DataSource(ormConfig));
    });
  } catch (e) {
    console.log('Error initializing data source', e);
  }
})();

export default AppDataSource;
