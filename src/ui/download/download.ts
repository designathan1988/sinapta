// Saves text as a file the browser downloads. The workspace file has its
// own saver in src/persistence/, which may not import this layer.
export interface TextFile {
  readonly name: string;
  readonly type: string;
  readonly text: string;
}

export interface BinaryFile {
  readonly name: string;
  readonly type: string;
  readonly data: Uint8Array;
}

// Saves bytes, such as a ZIP archive, as a file the browser downloads.
export function downloadFile(file: BinaryFile): void {
  const blob = new Blob([new Uint8Array(file.data)], { type: file.type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(file: TextFile): void {
  const url = URL.createObjectURL(new Blob([file.text], { type: file.type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}
