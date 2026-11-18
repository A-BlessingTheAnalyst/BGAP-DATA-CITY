"use client";

import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
}

export const MonacoSqlEditor: React.FC<Props> = ({ value, onChange, onRun }) => {
  // The command is registered once; the ref always calls the latest onRun (current query).
  const run = useRef(onRun);
  run.current = onRun;
  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run.current());
  };
  return (
    <Editor
      height="100%"
      language="sql"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || '')}
      onMount={onMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        lineNumbersMinChars: 3,
        wordWrap: 'on',
      }}
    />
  );
};
