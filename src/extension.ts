// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec, execSync } from 'child_process';
import * as vscode from 'vscode';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const publisher = context.extension.packageJSON["publisher"];
    const openExtensionSettings = vscode.commands.registerCommand("palantir-java-format-vscode.openExtensionSettings",
        () => vscode.commands.executeCommand(
            'workbench.action.openSettings',
            `@ext:${publisher}.palantir-java-format-vscode`
        )
    );
    context.subscriptions.push(openExtensionSettings);


    const documentFormattingEditProvider = {
        provideDocumentFormattingEdits: provideDocumentFormattingEditsImpl
    };
    const fullDocumentFormatting = vscode.languages.registerDocumentFormattingEditProvider('java', documentFormattingEditProvider);
    context.subscriptions.push(fullDocumentFormatting);


    const documentRangeFormattingEditProvider = {
        provideDocumentRangeFormattingEdits: provideDocumentRangeFormattingEditsImpl
    };
    const selectionFormatting = vscode.languages.registerDocumentRangeFormattingEditProvider('java', documentRangeFormattingEditProvider);
    context.subscriptions.push(selectionFormatting); 

    const formatImports = vscode.commands.registerCommand('palantir-java-format-vscode.formatImports', formatImportsImpl);
    context.subscriptions.push(formatImports); 

    const documentFormatExcludingImports = vscode.commands.registerCommand('palantir-java-format-vscode.documentFormatExcludingImports', documentFormatExcludingImportsImpl);
    context.subscriptions.push(documentFormatExcludingImports); 

}

function documentFormatExcludingImportsImpl(){
  const { activeTextEditor } = vscode.window;

  if (activeTextEditor && activeTextEditor.document.languageId === 'java') {
    try {

        const extensionConfig = vscode.workspace.getConfiguration("palantir-java-format-vscode");
        const pathForExecutable = extensionConfig.get<string>("pathForExecutable");
        if (!pathForExecutable) {
            throw new Error("Activation failed: 'pathForExecutable' not configured");
        }

        // documentFormatExcludingImports configs
        const style = extensionConfig.get<string>("style");
        const skipReflowingLongStrings = extensionConfig.get<boolean>("skipReflowingLongStrings");
        // documentFormatExcludingImports configs end

        // documentFormatExcludingImports options
        const styleOpt = getStyleOpt(style);
        const skipReflowingLongStringsOpt = skipReflowingLongStrings ? " --skip-reflowing-long-strings" : "";

        const optionsString = styleOpt + skipReflowingLongStringsOpt + " --skip-sorting-imports --skip-removing-unused-imports" ;
        // documentFormatExcludingImports options end

        const { document } = activeTextEditor;
        const fullText = document.getText();

        let output;
        // getExceptImportsReformattedOutput 
        if (document.lineCount < 1){
            throw new Error("Activation failed: 0 line file");
        } else if (document.lineCount === 1){
            const command = `${pathForExecutable} - ${optionsString}`;
            output = execSync(command, { input: fullText }).toString();
        } else {
            const maybeImportLine = findLastImportLineNum(fullText);
            const nextLineOrBeginning = maybeImportLine? maybeImportLine + 1 : 1;
            const lastLineOrSameLine = document.lineCount > nextLineOrBeginning? document.lineCount : nextLineOrBeginning;
            const command = `${pathForExecutable} - --lines=${nextLineOrBeginning}:${lastLineOrSameLine} ${optionsString}`;
            output = execSync(command, { input: fullText }).toString();
        }
        // getExceptImportsReformattedOutput end

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, 
            new vscode.Range(
            document.positionAt(0),
            document.positionAt(fullText.length)), 
            output);
        return vscode.workspace.applyEdit(edit);


    }
    catch (e) {
        if (e instanceof Error) {
            const eString = e.toString();
            if (eString.includes("Permission denied")) {
                vscode.window.showErrorMessage(eString + "- The file is not excutable by the current process.");
            } else if (eString.includes("No such file or directory")) {
                vscode.window.showErrorMessage(eString + "- You should provide valid path for your `palantir-java-format` executable");
            } else {
                vscode.window.showErrorMessage(eString);
            }
        }

    }
  }
}
function formatImportsImpl(){
  const { activeTextEditor } = vscode.window;

  if (activeTextEditor && activeTextEditor.document.languageId === 'java') {
    try {
        const extensionConfig = vscode.workspace.getConfiguration("palantir-java-format-vscode");
        const pathForExecutable = extensionConfig.get<string>("pathForExecutable");
        if (!pathForExecutable) {
            throw new Error("Activation failed: 'pathForExecutable' not configured");
        }

        // formatImports configs
        const style = extensionConfig.get<string>("style");
        const skipSortingImports = extensionConfig.get<boolean>("skipSortingImports");
        const skipRemovingUnusedImports = extensionConfig.get<boolean>("skipRemovingUnusedImports");
        // formatImports configs end

        // formatImports options
        const styleOpt = getStyleOpt(style);
        const skipSortingImportsOpt = skipSortingImports ? " --skip-sorting-imports" : "";
        const skipRemovingUnusedImportsOpt = skipRemovingUnusedImports ? " --skip-removing-unused-imports" : "";

        const optionsString = " --fix-imports-only" + styleOpt + skipSortingImportsOpt + skipRemovingUnusedImportsOpt;
        // formatImports options end

        const { document } = activeTextEditor;
        const fullText = document.getText();

        const command = `${pathForExecutable} -  ${optionsString}`;
        const output = execSync(command, { input: fullText }).toString();

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, 
            new vscode.Range(
            document.positionAt(0),
            document.positionAt(fullText.length)), 
            output);

        return vscode.workspace.applyEdit(edit);
    }
    catch (e) {
        if (e instanceof Error) {
            const eString = e.toString();
            if (eString.includes("Permission denied")) {
                vscode.window.showErrorMessage(eString + "- The file is not excutable by the current process.");
            } else if (eString.includes("No such file or directory")) {
                vscode.window.showErrorMessage(eString + "- You should provide valid path for your `palantir-java-format` executable");
            } else {
                vscode.window.showErrorMessage(eString);
            }
        }
    }
  }

}




function provideDocumentFormattingEditsImpl(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    try {
        const extensionConfig = vscode.workspace.getConfiguration("palantir-java-format-vscode");
        const pathForExecutable = extensionConfig.get<string>("pathForExecutable");
        if (!pathForExecutable) {
            throw new Error("Activation failed: 'pathForExecutable' not configured");
        }

        const documentFormatExcludingImportsEnabled = extensionConfig.get<boolean>("extension_documentFormatExcludingImports");
        if (documentFormatExcludingImportsEnabled){
            // documentFormatExcludingImports configs
            const style = extensionConfig.get<string>("style");
            const skipReflowingLongStrings = extensionConfig.get<boolean>("skipReflowingLongStrings");
            // documentFormatExcludingImports configs end

            // documentFormatExcludingImports options
            const styleOpt = getStyleOpt(style);
            const skipReflowingLongStringsOpt = skipReflowingLongStrings ? " --skip-reflowing-long-strings" : "";

            const optionsString = styleOpt + skipReflowingLongStringsOpt + " --skip-sorting-imports --skip-removing-unused-imports" ;
            // documentFormatExcludingImports options end

            const fullText = document.getText();

            let output;
            // getExceptImportsReformattedOutput 
            if (document.lineCount < 1){
                throw new Error("Activation failed: 0 line file");
            } else if (document.lineCount === 1){
                const command = `${pathForExecutable} - ${optionsString}`;
                output = execSync(command, { input: fullText }).toString();
            } else {
                const maybeImportLine = findLastImportLineNum(fullText);
                const nextLineOrBeginning = maybeImportLine? maybeImportLine + 1 : 1;
                const lastLineOrSameLine = document.lineCount > nextLineOrBeginning? document.lineCount : nextLineOrBeginning;
                const command = `${pathForExecutable} - --lines=${nextLineOrBeginning}:${lastLineOrSameLine} ${optionsString}`;
                output = execSync(command, { input: fullText }).toString();
            }
            // getExceptImportsReformattedOutput end

            return [vscode.TextEdit.replace(new vscode.Range(
                document.positionAt(0),
                document.positionAt(fullText.length)
            ), output)];

        }


        //  fullFocumentFormatting configs 
        const style = extensionConfig.get<string>("style");
        const skipSortingImports = extensionConfig.get<boolean>("skipSortingImports");
        const skipRemovingUnusedImports = extensionConfig.get<boolean>("skipRemovingUnusedImports");
        const skipReflowingLongStrings = extensionConfig.get<boolean>("skipReflowingLongStrings");
        // fullFocumentFormatting configs end

        // fullFocumentFormatting options
        const styleOpt = getStyleOpt(style);
        const skipSortingImportsOpt = skipSortingImports ? " --skip-sorting-imports" : "";
        const skipRemovingUnusedImportsOpt = skipRemovingUnusedImports ? " --skip-removing-unused-imports" : "";
        const skipReflowingLongStringsOpt = skipReflowingLongStrings ? " --skip-reflowing-long-strings" : "";

        const optionsString = styleOpt + skipSortingImportsOpt + skipRemovingUnusedImportsOpt + skipReflowingLongStringsOpt;
        // fullFocumentFormatting options end

        const fullText = document.getText();

        const command = `${pathForExecutable} - ${optionsString}`;
        const output = execSync(command, { input: fullText }).toString();

        return [vscode.TextEdit.replace(new vscode.Range(
            document.positionAt(0),
            document.positionAt(fullText.length)
        ), output)];

    }
    catch (e) {
        if (e instanceof Error) {
            const eString = e.toString();
            if (eString.includes("Permission denied")) {
                vscode.window.showErrorMessage(eString + "- The file is not excutable by the current process.");
            } else if (eString.includes("No such file or directory")) {
                vscode.window.showErrorMessage(eString + "- You should provide valid path for your `palantir-java-format` executable");
            } else {
                vscode.window.showErrorMessage(eString);
            }
        }
        return [];
    }

}

function getStyleOpt(style: string | undefined): string {
    if (style === "AOSP") {
        return " --aosp";
    }
    if (style === "Palantir") {
        return " --palantir";
    }
    return "";
}

function provideDocumentRangeFormattingEditsImpl(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    try {
        const extensionConfig = vscode.workspace.getConfiguration("palantir-java-format-vscode");
        const pathForExecutable = extensionConfig.get<string>("pathForExecutable");
        if (!pathForExecutable) {
            throw new Error("Activation failed: 'pathForExecutable' not configured");
        }

        // selectionFormatting configs
        const style = extensionConfig.get<string>("style");
        // selectionFormatting configs end

        // selectionFormatting options
        const styleOpt = getStyleOpt(style);

        const optionsString = styleOpt  + " --skip-sorting-imports --skip-removing-unused-imports  --skip-reflowing-long-strings" ;
        // selectionFormatting options end

        const fullText = document.getText();

        const selectedText = document.getText(range);
        const length = selectedText.length;
        const offset = document.offsetAt(range.start);



        const command = `${pathForExecutable} - --offset=${offset} --length=${length} ${optionsString}`;
        const output = execSync(command, { input: fullText }).toString();

        return [vscode.TextEdit.replace(new vscode.Range(
            document.positionAt(0),
            document.positionAt(fullText.length)
        ), output)];

    }
    catch (e) {
        if (e instanceof Error) {
            const eString = e.toString();
            if (eString.includes("Permission denied")) {
                vscode.window.showErrorMessage(eString + "- The file is not excutable by the current process.");
            } else if (eString.includes("No such file or directory")) {
                vscode.window.showErrorMessage(eString + "- You should provide valid path for your `palantir-java-format` executable");
            } else {
                vscode.window.showErrorMessage(eString);
            }
        }
        return [];
    }

}

// This method is called when your extension is deactivated
export function deactivate() { }
function findLastImportLineNum(fullText: string) {
    let lineNum = null; 
    const lines = fullText.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        // Skip empty lines or comments
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            continue;
        }
        if (trimmed.startsWith("import ")){
            lineNum = i+1;
        }
        // Check for class-like declarations
        if (trimmed.match(/(^|\s)(class|enum|interface|record|@interface)\s/)) {
            return lineNum;
        }
    } 
    throw new Error("Activation failed: not a valid Java file");
}

