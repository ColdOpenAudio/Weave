import { execFileSync } from 'child_process';

export function selectProjectFolder(prompt: string): string {
  switch (process.platform) {
    case 'darwin':
      return runCommand('osascript', [
        '-e',
        `POSIX path of (choose folder with prompt "${escapeAppleScript(prompt)}")`
      ]);
    case 'win32':
      return runCommand('powershell', [
        '-NoProfile',
        '-Command',
        [
          'Add-Type -AssemblyName System.Windows.Forms;',
          '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog;',
          `$dialog.Description = "${escapePowerShell(prompt)}";`,
          '$dialog.ShowNewFolderButton = $true;',
          'if ($dialog.ShowDialog() -eq "OK") { $dialog.SelectedPath }'
        ].join(' ')
      ]);
    default:
      return selectProjectFolderLinux(prompt);
  }
}

function selectProjectFolderLinux(prompt: string): string {
  const zenityArgs = ['--file-selection', '--directory', '--title', prompt];
  const kdialogArgs = ['--getexistingdirectory', '--title', prompt];

  try {
    return runCommand('zenity', zenityArgs);
  } catch {
    try {
      return runCommand('kdialog', kdialogArgs);
    } catch {
      throw new Error('No supported folder dialog found (install zenity or kdialog).');
    }
  }
}

function runCommand(command: string, args: string[]): string {
  const output = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
  if (!output) {
    throw new Error('Folder selection canceled.');
  }
  return output;
}

function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapePowerShell(value: string): string {
  return value.replace(/"/g, '""');
}
