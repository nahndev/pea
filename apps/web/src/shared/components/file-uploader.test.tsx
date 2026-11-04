import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FileUploader } from './file-uploader';

const ACCEPT = '.log,.txt';

function Harness({ onChange = vi.fn(), disabled = false }: { onChange?: (file?: File) => void; disabled?: boolean }) {
  const [file, setFile] = useState<File>();
  return (
    <FileUploader
      id="file"
      label="Log"
      accept={ACCEPT}
      maxSize={1024 * 1024}
      value={file}
      onChange={(next) => {
        setFile(next);
        onChange(next);
      }}
      hint="One event per line."
      error="Attach the log."
      disabled={disabled}
    />
  );
}

const dropzone = () => screen.getByLabelText('Log').parentElement!;
const drop = (files: File[]) => fireEvent.drop(dropzone(), { dataTransfer: { files } });

describe('FileUploader', () => {
  it('describes the accepted files and wires the hint and error to the input', () => {
    render(<Harness />);

    expect(screen.getByText('.log, .txt · up to 1 MB')).toBeInTheDocument();
    const input = screen.getByLabelText('Log');
    expect(input).toHaveAttribute('accept', ACCEPT);
    expect(input).toHaveAccessibleDescription('One event per line. Attach the log.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('selects a file from the picker', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const file = new File(['x'], 'events.log');

    await userEvent.upload(screen.getByLabelText('Log'), file);

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByText('events.log')).toBeInTheDocument();
    expect(screen.getByText('1 B')).toBeInTheDocument();
  });

  it('selects the first dropped file and highlights while dragging', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const file = new File(['abc'], 'dropped.log');

    fireEvent.dragEnter(dropzone(), { dataTransfer: { files: [] } });
    expect(screen.getByText('Drop the file to upload')).toBeInTheDocument();
    drop([file, new File(['y'], 'other.log')]);

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByText('dropped.log')).toBeInTheDocument();
  });

  it('removes the selected file', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    drop([new File(['x'], 'events.log')]);

    await userEvent.click(screen.getByRole('button', { name: 'Remove events.log' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByText('events.log')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Log')).toHaveFocus();
  });

  it('ignores drops while disabled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} disabled />);

    drop([new File(['x'], 'events.log')]);

    expect(onChange).not.toHaveBeenCalled();
  });
});
