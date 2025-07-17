import psList from 'ps-list';
import { tryOpenEditor, Options } from './src/index.js';

const processes = await psList();
const editors: Options[] = [];

const isRunning = (name: (string | RegExp)[]) => {
	return processes.find((item) => name.some((n) => {
		const m = item.cmd!.match(n);
		if (m) {
			console.log(item.cmd);
		}
		return m;
	}));
}

[{
	cmdPattern: /Cursor[^a-zA-Z]/,
	editorOption: { editor: 'cursor', fallback: true },
}, {
	cmdPattern: /Visual Studio Code[^a-zA-Z]/,
	editorOption: { editor: 'vscode', fallback: false },
}, {
	cmdPattern: /Trae[^a-zA-Z]/,
	editorOption: { editor: 'trae', fallback: false },
}].forEach((item) => {
	if (isRunning([item.cmdPattern])) {
		editors.push(item.editorOption);
	}
});
try {
	tryOpenEditor([
		'src/index.ts:5:5',
		'package.json:10:10',
	], editors).then((result: boolean) => {
		console.log('Final result:', result);
	});
} catch (e) {
	console.log('Unexpected error:', (e as Error));
}
