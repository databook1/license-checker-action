const core = require('@actions/core');
const fs = require('fs');

const DEFAULT_SOURCE = 'package.json';
const SUPPORTED_SOURCES = new Set(['package.json', 'bower.json']);
const LICENSE_FILE = './.licenses.json';

async function run() {
  try {
    const sources = (core.getInput('dependencies-sources') || DEFAULT_SOURCE).split(',');

    const invalidSources = sources.filter(manager => !SUPPORTED_SOURCES.has(manager));

    if (invalidSources.length) {
      throw new Error(`Configuration contains invalid sources: ${invalidSources.join(', ')}`)
    }

    core.info(`Verifying licenses for the following sources: ${sources.join(', ')}`);

    let licenses;

    try {
      fs.statSync(LICENSE_FILE);
      core.info('Found license file');
      licenses = JSON.parse(fs.readFileSync(LICENSE_FILE).toString('utf-8'));
    } catch (err) {
      throw new Error(`License file not found. Create a file with the licenses - ${LICENSE_FILE}`)
    }

    const added = [];
    const updated = [];
    const removed = [];

    sources.forEach(source => {
      const dependencies = getDirectDependencies(source);
      const licenseFileDependencies = getLicenseFileDependencies(source, licenses);

      Object.keys(dependencies).forEach(dependency => {
        const version = dependencies[dependency];
        const config = licenseFileDependencies[dependency];

        if (!config) {
          added.push(`${source}:${dependency}@${version}`);
        } else if (config.version !== version) {
          updated.push(`${source}:${dependency}@${version}`);
        }
      });

      Object.keys(licenseFileDependencies).forEach(dependency => {
        if (!dependencies[dependency]) {
          removed.push(`${source}:${dependency}`);
        }
      })
    });

    if (added.length || updated.length || removed.length) {
      let message = `For all the packages listed below, specify a correct license in the ${LICENSE_FILE} using the format:
      {
        [source]: {
          dependencies: {
            [package-name]: {
              version: 'string',
              license: 'string'
            }
          }
        }
      }\n\n`;

      if (added.length) {
        message += `The following packages were added: ${added.join(', ')}. Add them to the file.\n`
      }

      if (updated.length) {
        message += `The following packages were updated: ${updated.join(', ')}. Update their version (and license if it changed) in the file.\n`
      }

      if (removed.length) {
        message += `The following packages were deleted: ${removed.join(', ')}. Remove them from the file.`
      }

      throw new Error(message)
    }

    core.info('All dependencies look good!');
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getDirectDependencies(file) {
  const dependenciesJsonFile = JSON.parse(fs.readFileSync(file).toString('utf-8'))

  return dependenciesJsonFile.dependencies;
}

function getLicenseFileDependencies(packageManager, file) {
  return file[packageManager] ? file[packageManager].dependencies : {}
}

run();
