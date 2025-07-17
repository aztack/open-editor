# open-editor2

> This is a fork of [open-editor](https://github.com/sindresorhus/open-editor)
> Add support for cjs+esm
> Add support for Cursor, Trae, Windsurf

> Open files in your editor at a specific line and column

Supports any editor, but only the following editors will open at a specific line and column:

- Sublime Text
- Atom
- Zed
- Visual Studio Code
- VSCodium
- Cursor
- Trae
- Windsurf
- WebStorm*
- TextMate
- Vim
- NeoVim
- IntelliJ IDEA*

*\*Doesn't support column.*

## Install

```sh
npm install open-editor
```

## Usage

ESM:

```js
import openEditor from 'open-editor';

openEditor(['unicorn.js:5:3']);
```

CommonJS:

```js
const openEditor = require('open-editor');

openEditor(['unicorn.js:5:3']);
```

## API

### openEditor(files, options?)

Open the given files in the user's editor at specific line and column if supported by the editor. It does not wait for the editor to start or quit unless you specify `wait: true` in the options.

#### files

Type: `string[]`

Items should be in the format `foo.js:1:5`.

#### options

Type: `object`

```ts
interface Options {
	/**
	The editor to use.
	*/
	readonly editor?: string;

	/**
	Wait for the editor to close.

	@default false
	*/
	readonly wait?: boolean;
}
```

### getEditorInfo(files, options?)

Same as `openEditor()`, but returns an object with the binary name, arguments, and a flag indicating whether the editor runs in the terminal.

Example: `{binary: 'subl', arguments: ['foo.js:1:5'], isTerminalEditor: false}`

Can be useful if you want to handle opening the files yourself.

```js
import {getEditorInfo} from 'open-editor';

getEditorInfo([
	{
		file: 'foo.js',
		line: 1,
		column: 5,
	}
]);
//=> {binary: 'subl', arguments: ['foo.js:1:5'], isTerminalEditor: false}
```

## Related

- [open-editor-cli](https://github.com/sindresorhus/open-editor-cli) - CLI for this module
- [open](https://github.com/sindresorhus/open) - Open stuff like URLs, files, executables
