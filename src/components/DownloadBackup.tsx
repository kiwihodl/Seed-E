"use client";

interface DownloadBackupProps {
  username?: string;
  recoveryKey?: string;
  isRecovery?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function DownloadBackup({
  username,
  recoveryKey,
  isRecovery = false,
  className = "",
  children,
}: DownloadBackupProps) {
  const downloadBackup = () => {
    const currentUsername = username || localStorage.getItem("username");
    const currentRecoveryKey =
      recoveryKey || localStorage.getItem("recoveryKey") || "Not available";

    const fileTitle = isRecovery
      ? "Seed-E Recovery File"
      : "Seed-E Backup File";
    const passwordNote = isRecovery
      ? "Set during recovery"
      : "Set during registration";
    const fileName = isRecovery ? "recovery" : "backup";

    const backupText = `${fileTitle}
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep this file secure. You'll need these credentials if you forget your password or 2FA.

Username: ${currentUsername}
Password: ${passwordNote}
Master Key: ${currentRecoveryKey}

Note: This backup file contains your account recovery information. Store it safely and do not share it with anyone.`;

    const blob = new Blob([backupText], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-${currentUsername}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={downloadBackup} className={className}>
      {children}
    </button>
  );
}
