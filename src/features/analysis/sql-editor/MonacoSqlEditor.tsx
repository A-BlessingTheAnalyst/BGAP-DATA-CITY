"use client";

import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
}

export const MonacoSqlEditor: React.FC<Props> = ({ value, onChange, onRun }) => {
  return (
    <Editor
      height="100%"
      language="sql"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        lineNumbersMinChars: 3,
      }}
    />
  );
};
