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
export declare function getEditorInfo(files: readonly string[], options?: Options): {
    binary: string;
    arguments: string[];
    isTerminalEditor: boolean;
};
export default function openEditor(files: readonly string[], options?: Options): Promise<boolean>;
/**
 * Try to open files with editors
 * try retry with other editors if previous editor failed
 * @param files
 * @param editorOptions
 * @returns
 */
export declare function tryOpenEditor(files: string[], editorOptions: Options[]): Promise<boolean>;
