import { exec, spawn } from "child_process";
import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

interface Config {
  gitUsers: GitUser[];
}

interface GitUser {
  username: string;
  email: string;
  sshKey: string;
}

export function readConfigFile(configFilePath: string): Config | undefined {
  try {
    const configData = fs.readFileSync(configFilePath, "utf8");
    const config: Config = JSON.parse(configData);
    return config;
  } catch (err) {
    return undefined;
  }
}

export function writeConfigFile(config: Config, configFilePath: string) {
  const jsonData = JSON.stringify(config, null, 2);
  fs.writeFileSync(configFilePath, jsonData, "utf8");
}

export function updateStatusBarItem(
  statusBarItem: vscode.StatusBarItem,
  config: Config | undefined
) {
  // Update the status bar item
  if (config && config.gitUsers.length > 0) {
    const firstGitUser = config.gitUsers[0];
    statusBarItem.text = `$(user) Git User: ${firstGitUser.username}`;
  } else {
    statusBarItem.text = "$(user) Git User: Unknown - Please Add";
  }
  statusBarItem.show();
}

export function getCurrentGitUser(
  callback: (gitUser: string | undefined) => void
) {
  const childProcess = spawn("git", ["config", "user.name"]);

  let gitUser = "";
  childProcess.stdout.on("data", (data) => {
    gitUser += data.toString();
  });

  childProcess.on("close", (code) => {
    if (code === 0) {
      callback(gitUser.trim());
    } else {
      callback(undefined);
    }
  });
}
export function getCurrentGitEmail(
  callback: (gitEmail: string | undefined) => void
) {
  const childProcess = spawn("git", ["config", "user.email"]);

  let gitEmail = "";
  childProcess.stdout.on("data", (data) => {
    gitEmail += data.toString();
  });

  childProcess.on("close", (code) => {
    if (code === 0) {
      callback(gitEmail.trim());
    } else {
      callback(undefined);
    }
  });
}
export function getCurrentGitSshKey(callback: (sshKey: string | null) => void) {
  exec("git config user.sshKey", (error, stdout) => {
    if (error) {
      console.error("Error getting current Git SSH key:", error);
      callback(null);
    } else {
      const sshKey = stdout.trim();
      callback(sshKey);
    }
  });
}

export function getSavedUsernames(configFilePath: string): string[] {
  const config = readConfigFile(configFilePath);
  if (config) {
    return config.gitUsers.map((user) => user.username);
  }
  return [];
}

export function deleteGitUser(username: string, configFilePath: string) {
  const config = readConfigFile(configFilePath);

  if (config) {
    const index = config.gitUsers.findIndex(
      (user) => user.username === username
    );

    if (index !== -1) {
      config.gitUsers.splice(index, 1);
      writeConfigFile(config, configFilePath);
    }
  }
}
export function switchToGitUser(
  selectedGitUser: GitUser,
  statusBarItem: vscode.StatusBarItem
) {
  exec(
    `git config --global user.name ${selectedGitUser.username} && git config --global user.email ${selectedGitUser.email}`,
    (error, stdout, stderr) => {
      if (error || stderr) {
        const errorMessage = error ? error.message : stderr;
        vscode.window.showErrorMessage(
          `Failed to switch to Git user: ${errorMessage}`
        );
      } else {
        statusBarItem.text = `$(user) Git User: ${selectedGitUser.username}`;
        statusBarItem.show();

        const sshKeyPath = selectedGitUser.sshKey;
        if (!sshKeyPath) {
          vscode.window.showErrorMessage(
            "SSH key path is empty. Please provide a valid SSH key path."
          );
          return;
        }

        const absolutePath = sshKeyPath;
        // const absolutePath = path.join(os.homedir(), ".ssh", sshKeyPath);

        // Check if the SSH key file exists
        fs.access(absolutePath, fs.constants.F_OK, (err) => {
          if (err) {
            // vscode.window.showErrorMessage(
            //   `SSH key file not found: ${sshKeyPath}`
            // );

            // Prompt the user to generate the SSH key
            vscode.window
              .showInformationMessage(
                `SSH key file not found: '${sshKeyPath}'
                Do you want to generate an SSH key for this Git user?`,
                "Yes (Be Own Risk)",
                "No"
              )
              .then((choice) => {
                if (choice === "Yes (Be Own Risk)") {
                  vscode.window.showInformationMessage("Generating ssh key..");
                  generateSshKey(selectedGitUser, absolutePath);
                }
              });

            return;
          }

          // Clean SSH key
          exec(`ssh-add -D`);

          // Add SSH key using ssh-add command
          exec(`ssh-add ${absolutePath}`, (error, stdout, stderr) => {
            if (error) {
              const errorMessage = error.message;
              if (errorMessage.includes("No such")) {
                vscode.window.showErrorMessage("SSH key file not found");
              } else {
                vscode.window.showErrorMessage(
                  `Failed to add SSH key: ${errorMessage}`
                );
              }
            } else {
              vscode.window.showInformationMessage(
                "Git user switched successfully."
              );
            }
          });
        });
      }
    }
  );
}
function generateSshKey(gitUser: GitUser, sshKeyPath: string) {
  vscode.window
    .showInputBox({
      prompt: "Enter passphrase for SSH key (empty for no passphrase)",
      password: true,
    })
    .then((passphrase) => {
      const args = ["-t", "ed25519", "-C", gitUser.email, "-f", sshKeyPath];
      if (passphrase) {
        args.push("-N");
        args.push(passphrase);
      } else {
        args.push("-P");
        args.push("");
      }

      const sshKeygen = spawn("ssh-keygen", args);

      sshKeygen.stdout.on("data", (data) => {
        // Show the output of the SSH key generation process to the user
        const output = data.toString().trim();
        vscode.window.showInformationMessage(output);
      });

      sshKeygen.stderr.on("data", (data) => {
        // Show the error output of the SSH key generation process to the user
        const error = data.toString().trim();
        vscode.window.showErrorMessage(error);
      });

      sshKeygen.on("close", (code) => {
        if (code === 0) {
          vscode.window.showInformationMessage(
            "SSH key generated successfully."
          );
        } else {
          vscode.window.showErrorMessage("Failed to generate SSH key.");
        }
      });
    });
}
