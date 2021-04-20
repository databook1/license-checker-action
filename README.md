# License Checker Action

## Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos.  Packaging the action will create a packaged action in the dist folder.

Run prepare

```bash
npm run prepare
```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

## Usage

### Define licenses file

Create a new file `.licenses.json` in the root directory.

File should have the following structure:

```json
    [source]: {
      dependencies: {
        [package-name]: {
          version: 'string',
          license: 'string'
        }
      }
    }
```

### Add action to your workflows

```yaml
uses: databook1/license-checker-action@master
with:
  dependencies-sources: 'package.json,bower.json'
```

Supported dependencies sources: package.json, bower.json.
Provide a comma-separated list.
