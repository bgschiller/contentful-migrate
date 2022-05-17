import contentful from 'contentful-management'
import { ContentType } from 'contentful-management/dist/typings/export-types'
import chalk from 'chalk'
import pMap from 'p-map'
import log from 'migrate/lib/log'

import createFile from './createFile'
import { jsonToScript } from './jsonToScript'

// Magic number to prevent overloading the contentful management API.
// TODO: passed in from bootstrap command as an option
const concurrency = 5

export default async function generateScripts (
  spaceId: string, environmentId: string, accessToken: string, migrationsDirectory: string
) {
  const client = contentful.createClient({ accessToken })
  const space = await client.getSpace(spaceId)
  const environment = await space.getEnvironment(environmentId)
  // TODO: add pagination when content type exceeds 1000
  const contentTypeResponse = await environment.getContentTypes({ limit: 1000 })
  const requiredContentTypes = contentTypeResponse.items.filter(item => item.sys.id !== 'migration')

  const mapper = (contentType: ContentType) => {
    const contentTypeId = contentType.sys.id
    return environment.getEditorInterfaceForContentType(contentTypeId)
      .then((editorInterface) => {
        return createFile(
          contentTypeId,
          jsonToScript(contentType, editorInterface.controls),
          migrationsDirectory
        )
      })
  }

  const files = await pMap(requiredContentTypes, mapper, { concurrency })
  log(chalk.bold.green('🎉  Scripts generation'), chalk.bold.green('successful'))
  return files
}

