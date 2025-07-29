# palantir-java-format-vscode README

## Requirements

- `palantir-java-format` executable

## Commands Supported

- `editor.action.formatDocument`
- `editor.action.formatSelection`

## Commands Added

- `palantir-java-format-vscode.openExtensionSettings`: Open `palantir-java-format-vscode` Exstension Settings.
- `palantir-java-format-vscode.formatImports`: Format import statements.
- `palantir-java-format-vscode.documentFormatExcludingImports`: Format document excluding import statements.

## Extension Settings

This extension contributes the following settings:

- `palantir-java-format-vscode.pathForExecutable`: Excutable path for the palantir-java-format executable.
  - DEFAULT: palantir-java-format
- `palantir-java-format-vscode.style`: Formatting style to use. Options are Google Style, AOSP (--aosp) OR Palantir (--palantir). Cannot use both aosp and palantir style.
  - DEFAULT: Palantir
  - Applying commands:
    - all
- `palantir-java-format-vscode.skipSortingImports`: If true, skips fixing the import order but still removes unused imports. Equivalent to --skip-sorting-imports.
  - DEFAULT: false
  - Applying commands:
    - editor.action.formatDocument
    - palantir-java-format-vscode.formatImports
- `palantir-java-format-vscode.skipRemovingUnusedImports`: If true, skips removing unused imports but still sorts imports. Equivalent to --skip-removing-unused-imports.
  - DEFAULT: false
  - Applying commands:
    - editor.action.formatDocument
    - palantir-java-format-vscode.formatImports
- `palantir-java-format-vscode.skipReflowingLongStrings`: If true, does not reflow string literals that exceed the column limit. Equivalent to --skip-reflowing-long-strings.

  - DEFAULT: false
  - Applying commands:
    - editor.action.formatDocument
    - palantir-java-format-vscode.documentFormatExcludingImports

- `palantir-java-format-vscode.enableDocumentFormatExcludingImports`: (extension added mode) When enabled, causes `editor.action.formatDocument` to behave like `palantir-java-format-vscode.documentFormatExcludingImports`.
  - DEFAULT: false
  - Applying commands:
    - editor.action.formatDocument

<!-- ## Known Issues -->

## Release Notes

### 1.0.0

Initial release
