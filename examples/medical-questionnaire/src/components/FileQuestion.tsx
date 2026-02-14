import { useRef } from 'react';
import type { FileQuestion as FileQuestionType } from 'questionnaire-engine';
import type { FileAnswerValue } from 'questionnaire-engine';

function getAllowedExtensions(question: FileQuestionType): string[] | undefined {
  const rule = question.validation?.find((r) => r.type === 'allowedExtensions');
  const fromRule = rule && Array.isArray(rule.value) ? rule.value : undefined;
  return fromRule ?? question.allowedExtensions;
}

function getAccept(question: FileQuestionType): string | undefined {
  const exts = getAllowedExtensions(question);
  if (!exts?.length) return undefined;
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  const normalized = exts.map((e) => (e.startsWith('.') ? e : `.${e}`).toLowerCase());
  const mimes = normalized
    .map((e) => mimeMap[e])
    .filter(Boolean);
  if (mimes.length) return mimes.join(',');
  return exts.join(',');
}

function getDimensionBounds(question: FileQuestionType) {
  const get = (type: 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight') => {
    const rule = question.validation?.find((r) => r.type === type);
    const v = rule && typeof rule.value === 'number' ? rule.value : undefined;
    const direct = question[type];
    return (typeof direct === 'number' ? direct : undefined) ?? v ?? null;
  };
  return {
    minWidth: get('minWidth'),
    maxWidth: get('maxWidth'),
    minHeight: get('minHeight'),
    maxHeight: get('maxHeight'),
  };
}

interface FileQuestionProps {
  question: FileQuestionType;
  value: FileAnswerValue | undefined;
  error?: string;
  onChange: (value: FileAnswerValue | null) => void;
}

function FileQuestionComponent({ question, value, error, onChange }: FileQuestionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dims = getDimensionBounds(question);
  const hasDimensionRules =
    dims.minWidth != null || dims.maxWidth != null || dims.minHeight != null || dims.maxHeight != null;
  const isImage = question.fileKind === 'image' || (question.fileKind !== 'document' && hasDimensionRules);

  const handleFile = (file: File) => {
    const base: FileAnswerValue = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    if (isImage && file.type.startsWith('image/')) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        onChange({
          ...base,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        onChange(base);
      };
      img.src = url;
    } else {
      onChange(base);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    } else {
      onChange(null);
    }
    e.target.value = '';
  };

  const handleClear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const accept = getAccept(question);
  const hint =
    question.fileKind === 'image'
      ? 'Image (e.g. JPG, PNG). Dimensions will be validated.'
      : question.fileKind === 'document'
        ? 'Document (e.g. PDF, CSV, TXT).'
        : 'Any file.';

  return (
    <div className="question">
      <div className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </div>
      <div className="question-hint">{hint}</div>
      <div className="file-question-controls">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className={`question-input file-input ${error ? 'error' : ''}`}
          aria-describedby={error ? `${question.id}-error` : undefined}
        />
        {value && (
          <div className="file-value">
            <span className="file-name">{value.name}</span>
            <span className="file-meta">
              {(value.size / 1024).toFixed(1)} KB
              {value.width != null && value.height != null && ` • ${value.width}×${value.height}px`}
            </span>
            <button type="button" className="file-clear" onClick={handleClear}>
              Clear
            </button>
          </div>
        )}
      </div>
      {error && (
        <div id={`${question.id}-error`} className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default FileQuestionComponent;
