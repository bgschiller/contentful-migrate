import chalk from 'chalk'
import log, { error as logError } from 'migrate/lib/log'

import generateScripts from './bootstrap/generateScripts'
import deleteScripts from './bootstrap/deleteScripts'
import rewriteMigration from './bootstrap/rewriteMigration'
import getClient from './client'
import { getStoreEntry, initSpace, noContentType } from './store'
import downloadSchema from './download-schema'

export default async function bootstrap(
  spaceId: string,
  environmentId: string,
  accessToken: string,
  migrationsDirectory: string,
  writeMigrationState: boolean
) {
  try {
    await deleteScripts(migrationsDirectory)
    const files = await generateScripts(spaceId, environmentId, accessToken, migrationsDirectory)
    await downloadSchema({ spaceId, environmentId, accessToken, migrationsDirectory });
    if (writeMigrationState) {
      const args = { spaceId, environmentId, accessToken };
      const environment = await getClient(args);
      const entry = await getStoreEntry(environment);
      if (entry === noContentType) {
        await initSpace(args);
      }

      await rewriteMigration(spaceId, environmentId, accessToken, files)
    }
    log(chalk.bold.green('🎉  Bootstrap'), chalk.bold.green('successful'))
  } catch (error) {
    logError('🚨  Failed to perform bootstrap', error)
  }
}
