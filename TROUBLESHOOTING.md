# Troubleshooting

Known operational issues and quick fixes for `aienvmp`.

## npm publish succeeds but `npm view` still shows the old version

Symptom:

```text
npm publish
+ aienvmp@0.1.2
npm view aienvmp version
0.1.1
```

Cause:

- npm registry metadata can lag briefly after publish.

Check:

```bash
npm view aienvmp versions --json
npm dist-tag ls aienvmp
```

Fix:

- Wait briefly and re-check `npm view aienvmp version`.

## Windows `npm exec --package ... -- aienvmp --help` cannot find the command

Symptom:

```text
'aienvmp' is not recognized as an internal or external command
```

Notes:

- The package bin metadata can still be valid.
- A direct temporary install creates the expected `.bin/aienvmp.cmd` shim.

Check:

```bash
npm view aienvmp bin --json
npm install aienvmp@latest --prefix ./tmp-aienvmp-check
```

Workaround:

```bash
npx aienvmp@latest --version
```

or install first:

```bash
npm install -g aienvmp
aienvmp --version
```

## macOS SSH session cannot find `node` or `npm`

Symptom:

```text
command -v node
# empty in non-interactive SSH command
```

Cause:

- Node may be configured only in the login shell environment.

Fix:

```bash
/bin/zsh -lc 'node --version && npm --version'
```

For automation, make sure the shell PATH includes the Node/npm location.

## Missing manifest

Symptom:

```text
aienvmp: missing manifest; run `aienvmp sync` first
```

Fix:

```bash
npx aienvmp sync
```

Then retry:

```bash
npx aienvmp context
```
