interface Options {
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
}
declare function getEditorInfo(files: readonly string[], options?: Options): {
    binary: string;
    arguments: string[];
    isTerminalEditor: boolean;
};
declare function openEditor(files: readonly string[], options?: Options): Promise<unknown>;

export { type Options, openEditor as default, getEditorInfo };
