import process from 'process';
import {execa} from 'execa';
import {getEditor, defaultEditor} from 'env-editor';
import {parseLineColumnPath, stringifyLineColumnPath} from 'line-column-path';
import open from 'open';

export interface Options {
	/**
	The editor to use.

	By default, it will try to open the file in the following editors, in this order:
	- Your default editor, if you have specified one.
	- Visual Studio Code
	- Visual Studio Code - Insiders
	- Sublime Text
	- Atom
	- WebStorm
	- TextMate
	- Vim
	- NeoVim
	- IntelliJ IDEA
	*/
	readonly editor?: string;

	/**
	Wait for the editor to close.

	@default false
	*/
	readonly wait?: boolean;

	/**
	Fallback to system open command when editor fails.

	@default true
	*/
	readonly fallback?: boolean;
}

export function getEditorInfo(files: readonly string[], options: Options = {}) {
	if (!Array.isArray(files)) {
		throw new TypeError(`Expected an \`Array\`, got ${typeof files}`);
	}

	const editor = options.editor ? getEditor(options.editor) : defaultEditor();
	const editorArguments: string[] = [];

	if (['vscode', 'vscodium', 'cursor', 'trae', 'windsurf'].includes(editor.id)) {
		editorArguments.push('--goto');
	}

	for (const file of files) {
		const parsed = parseLineColumnPath(file);

		if (['sublime', 'atom', 'zed', 'vscode', 'vscodium', 'cursor', 'trae', 'windsurf'].includes(editor.id)) {
			editorArguments.push(stringifyLineColumnPath(parsed));

			if (options.wait) {
				editorArguments.push('--wait');
			}

			continue;
		}

		if (['webstorm', 'intellij'].includes(editor.id)) {
			editorArguments.push(stringifyLineColumnPath(parsed, {column: false}));

			if (options.wait) {
				editorArguments.push('--wait');
			}

			continue;
		}

		if (editor.id === 'textmate') {
			editorArguments.push(
				'--line',
				stringifyLineColumnPath(parsed, {
					file: false,
				}),
				parsed.file,
			);

			if (options.wait) {
				editorArguments.push('--wait');
			}

			continue;
		}

		if (['vim', 'neovim'].includes(editor.id)) {
			editorArguments.push(
				`+call cursor(${parsed.line}, ${parsed.column})`,
				parsed.file,
			);

			continue;
		}

		editorArguments.push(parsed.file);
	}

	return {
		binary: editor.binary,
		arguments: editorArguments,
		isTerminalEditor: editor.isTerminalEditor,
	};
}

export default async function openEditor(files: readonly string[], options: Options = {}): Promise<boolean> {
	const { fallback = true } = options;
	const result = getEditorInfo(files, options);
	const stdio = result.isTerminalEditor ? 'inherit' : 'ignore';

	try {
		const subprocess = execa(result.binary, result.arguments, {
			detached: true,
			stdio,
		});

		// Wait a bit to see if the process starts successfully
		await new Promise((resolve, reject) => {
			let resolved = false;

			// Set a timeout to check if process starts
			const timeout = setTimeout(() => {
				if (!resolved) {
					resolved = true;
					resolve(true); // Process started successfully
				}
			}, 100); // Wait 100ms to see if there's an immediate error

			// Handle immediate errors (like command not found)
			subprocess.on('error', async (error) => {
				if (!resolved) {
					resolved = true;
					clearTimeout(timeout);

					if (fallback) {
						// Fallback to system open command
						for (const file of files) {
							const parsed = parseLineColumnPath(file);
							await open(parsed.file);
						}
						resolve(true);
					} else {
						reject(error);
					}
				}
			});

			// Handle process exit for immediate failures
			subprocess.on('exit', async (code) => {
				if (!resolved && code !== 0) {
					resolved = true;
					clearTimeout(timeout);

					if (fallback) {
						// Fallback to system open command
						for (const file of files) {
							const parsed = parseLineColumnPath(file);
							await open(parsed.file);
						}
						resolve(true);
					} else {
						reject(new Error(`Editor exited with code ${code}`));
					}
				}
			});
		});

		if (options.wait) {
			return new Promise((resolve, reject) => {
				subprocess.on('exit', (code) => {
					if (code === 0) {
						resolve(true);
					} else if (fallback) {
						// Fallback and resolve as success
						files.forEach(async (file) => {
							const parsed = parseLineColumnPath(file);
							await open(parsed.file);
						});
						resolve(true);
					} else {
						reject(new Error(`Editor exited with code ${code}`));
					}
				});
				subprocess.on('error', (error) => {
					if (fallback) {
						// Fallback and resolve as success
						files.forEach(async (file) => {
							const parsed = parseLineColumnPath(file);
							await open(parsed.file);
						});
						resolve(true);
					} else {
						reject(error);
					}
				});
			});
		}

		if (result.isTerminalEditor) {
			subprocess.on('exit', process.exit);
		} else {
			subprocess.unref();
		}

		// Return true only after confirming the process started
		return true;
	} catch (error) {
		if (fallback) {
			// Fallback to system open command
			for (const file of files) {
				const parsed = parseLineColumnPath(file);
				await open(parsed.file);
			}
			return true;
		} else {
			throw error;
		}
	}
}

/**
 * Try to open files with editors
 * try retry with other editors if previous editor failed
 * @param files
 * @param editorOptions
 * @returns
 */
export async function tryOpenEditor(files: string[], editorOptions: Options[]): Promise<boolean> {
	for (const editorOption of editorOptions) {
		try {
			// Set fallback to false to get proper error handling
			const res = await openEditor(files, editorOption);
			if(res) {
				return true;
			}
		} catch (e) {
			// console.log('Editor failed:', (e as Error).message);
		}
	}
	return false;
}
