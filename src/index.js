#! /usr/bin/env node

import { program } from 'commander'
import fs from 'fs-extra'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import toString from 'stream-to-string'

program
  .name('diagnose-applinks')
  .requiredOption('-b, --bundle <bundle id>', 'app bundle identifier')
  .requiredOption('-s, --sysdiagnose <tar.gz path>', 'path to sysdiagnose tar.gz')
  .option('-o, --json', 'json output flag')
  .parse(process.argv)

const fileInTar = async (file, zipPath) => {
  return new Promise((resolve, reject) => {
    const extract = tar.extract()
    extract.on('entry', (header, stream, next) => {
      stream.on('end', () => next())
      if (header.name.endsWith(`/${file}`)) resolve(stream)
      else stream.resume() // auto drain the stream
    })
    extract.on('finish', () => reject(new Error('file not found')))
    fs.createReadStream(zipPath)
      .pipe(gunzip())
      .pipe(extract)
  })
}

const headerLine = (name) => {
  const equalsLine = "=".repeat(35)
  return `${equalsLine} ${name.toUpperCase()} ${equalsLine}`
}

const splitLine = () => "-".repeat(80)

const parseDatabaseEntry = (entry) => {
  const lines = entry.split('\n').filter(e => e) // remove empty lines
  const result = {}
  for (const line of lines) {
    const [key, value] = line.split(/\:\s\s+/g)
    result[key] = value
  }
  return result
}

const parseDatabase = (file) => {
  const databaseHeader = headerLine('database')
  const networkHeader = headerLine('network')
  const database = file.split(databaseHeader).pop().split(networkHeader)[0]
  const line = splitLine()
  const entries = database.split(line)
  return entries.map((entry) => parseDatabaseEntry(entry))
}

const cleanupResults = (services, bundle) => {
  return services
    .filter(e => e['Service'] === "applinks")
    .filter(e => e['App ID'] === bundle)
    .map(e => {
      return {
        domain: e['Domain'],
        patterns: `[${e['Patterns']}]`,
        lastChecked: e['Last Checked'],
        nextCheck: e['Next Check']
      }
    })
    .sort((a, b) => new Date(b.lastChecked) - new Date(a.lastChecked))
}

const main = async () => {
  const { bundle, sysdiagnose, json } = program.opts()
  const exists = await fs.exists(sysdiagnose)
  if (!exists) throw new Error(".tar.gz file doesn't exist")
  const fileStream = await fileInTar('swcutil_show.txt', sysdiagnose)
  const file = await toString(fileStream)
  const services = parseDatabase(file)
  const results = cleanupResults(services, bundle)
  if (json) {
    console.log(JSON.stringify(results))
  } else {
    for (const result of results) {
      console.log(`Domain: ${result.domain}`)
      console.log(`Patterns: ${result.patterns}`)
      console.log(`Last Checked: ${result.lastChecked}`)
      console.log(`Next Check: ${result.nextCheck}`)
      console.log(splitLine())
    }
  }
}

main()