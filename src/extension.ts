import * as vscode from "vscode";
import * as path from "path";
import {
  readConfigFile,
  writeConfigFile,
  getCurrentGitUser,
  switchToGitUser,
  deleteGitUser,
  getSavedUsernames,
  getCurrentGitEmail,
  updateStatusBarItem,
} from "./helper";

interface GitUser {
  username: string;
  email: string;
  sshKey: string;
}

export function activate(context: vscode.ExtensionContext) {
  const CONFIG_FILE_PATH = path.join(context.extensionPath, "config.json");

  // Create a new status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  // Read the configuration file on extension activation
  let config = readConfigFile(CONFIG_FILE_PATH);
  // If no config is found, try to get the username from git config
  // If no config is found, try to get the username, email, and sshKey from git config
  if (!config || config.gitUsers.length < 1) {
    getCurrentGitUser((currentGitUser) => {
      if (currentGitUser) {
        getCurrentGitEmail((currentGitEmail) => {
          const gitUser: GitUser = {
            username: currentGitUser,
            email: currentGitEmail || "",
            sshKey: "",
          };
          config = {
            gitUsers: [gitUser],
          };
          writeConfigFile(config, CONFIG_FILE_PATH);
          vscode.window.showInformationMessage(`No saved Git users found. Synchronizing with Git config user: ${currentGitUser}.`);
          // Update the status bar item
          updateStatusBarItem(statusBarItem, config);
        });
      }
    });
  } else {
    // Update the status bar item
    updateStatusBarItem(statusBarItem, config);
  }

  statusBarItem.tooltip = "Click to change Git user"; // Hover tooltip
  statusBarItem.command = "gituserswitcher.selectGitUser"; // Command to be executed on click

  // Register a command to add a new Git user
  const addGitUserCommand = vscode.commands.registerCommand(
    "gituserswitcher.addGitUser",
    () => {
      vscode.window
        .showInputBox({ prompt: "Enter new Git username" })
        .then((newUsername) => {
          if (newUsername) {
            vscode.window
              .showInputBox({ prompt: "Enter Git email" })
              .then((newEmail) => {
                if (newEmail) {
                  vscode.window
                    .showInputBox({ prompt: "Enter SSH key Name" })
                    .then((newSshKey) => {
                      const gitUser: GitUser = {
                        username: newUsername,
                        email: newEmail,
                        sshKey: newSshKey || "",
                      };
                      if (config) {
                        config.gitUsers.push(gitUser);
                      } else {
                        config = {
                          gitUsers: [gitUser],
                        };
                      }
                      writeConfigFile(config, CONFIG_FILE_PATH);
                      switchToGitUser(gitUser, statusBarItem); // Switch to the new Git user
                      updateStatusBarItem(statusBarItem, config);
                    });
                }
              });
          }
        });
    }
  );
  const updateGitUserCommand = vscode.commands.registerCommand(
    "gituserswitcher.updateGitUser",
    () => {
      const savedUsernames = getSavedUsernames(CONFIG_FILE_PATH);
      if (savedUsernames.length === 0) {
        vscode.window.showInformationMessage("No saved Git usernames found.");
        return;
      }

      vscode.window
        .showQuickPick(savedUsernames, {
          placeHolder: "Select a Git username to update",
        })
        .then((selectedUsername) => {
          if (selectedUsername) {
            const gitUserToUpdate = config?.gitUsers.find(
              (user) => user.username === selectedUsername
            );
            if (gitUserToUpdate) {
              vscode.window
                .showInputBox({
                  prompt: "Enter new Git username",
                  value: gitUserToUpdate.username,
                })
                .then((newUsername) => {
                  if (newUsername) {
                    vscode.window
                      .showInputBox({
                        prompt: "Enter new Git email",
                        value: gitUserToUpdate.email,
                      })
                      .then((newEmail) => {
                        if (newEmail) {
                          vscode.window
                            .showInputBox({
                              prompt: "Enter new SSH key name",
                              value: gitUserToUpdate.sshKey,
                            })
                            .then((newSshKey) => {
                              const updatedGitUser: GitUser = {
                                username: newUsername,
                                email: newEmail,
                                sshKey: newSshKey || "",
                              };

                              if (config) {
                                const index = config.gitUsers.findIndex(
                                  (user) => user.username === selectedUsername
                                );
                                if (index !== undefined && index !== -1) {
                                  config.gitUsers[index] = updatedGitUser;
                                  writeConfigFile(config, CONFIG_FILE_PATH);

                                  vscode.window.showInformationMessage(
                                    `Git user "${selectedUsername}" has been updated.`
                                  );
                                }
                              }
                            });
                        }
                      });
                  }
                });
            }
          }
        });
    }
  );

  // Register a command to select and switch to a saved Git username
  const selectGitUserCommand = vscode.commands.registerCommand(
    "gituserswitcher.selectGitUser",
    () => {
      const savedUsernames = getSavedUsernames(CONFIG_FILE_PATH);
      if (savedUsernames.length === 0) {
        vscode.window.showInformationMessage("No saved Git usernames found.");
        return;
      }
      vscode.window
        .showQuickPick([...savedUsernames, "-- Add New --"], {
          placeHolder: "Select a Git username",
        })
        .then((selectedUsername) => {
          if (selectedUsername === "-- Add New --") {
            vscode.commands.executeCommand("gituserswitcher.addGitUser");
          } else if (selectedUsername) {
            const selectedGitUser = config?.gitUsers.find(
              (user) => user.username === selectedUsername
            );
            if (selectedGitUser) {
              switchToGitUser(selectedGitUser, statusBarItem);
            }
          }
        });
    }
  );

  // Register a command to view the saved Git usernames
  const viewSavedUsernamesCommand = vscode.commands.registerCommand(
    "gituserswitcher.viewSavedUsernames",
    () => {
      const savedUsernames = getSavedUsernames(CONFIG_FILE_PATH);
      if (savedUsernames.length === 0) {
        vscode.window.showInformationMessage("No saved Git usernames found.");
      } else {
        vscode.window.showInformationMessage(
          `Saved Git Usernames:\n${savedUsernames.join("\n")}`
        );
      }
    }
  );

  // Register a command to delete a Git user
  const deleteGitUserCommand = vscode.commands.registerCommand(
    "gituserswitcher.deleteGitUser",
    () => {
      const savedUsernames = getSavedUsernames(CONFIG_FILE_PATH);
      if (savedUsernames.length === 0) {
        vscode.window.showInformationMessage("No saved Git usernames found.");
        return;
      }
      vscode.window
        .showQuickPick(savedUsernames, {
          placeHolder: "Select a Git username to delete",
        })
        .then((usernameToDelete) => {
          if (usernameToDelete) {
            deleteGitUser(usernameToDelete, CONFIG_FILE_PATH);
            vscode.window.showInformationMessage(
              `Git user "${usernameToDelete}" has been deleted.`
            );

            // Refresh savedUsernames
            let config = readConfigFile(CONFIG_FILE_PATH);
            // Update status bar item
            updateStatusBarItem(statusBarItem, config);
          }
        });
    }
  );

  // Add the deleteGitUserCommand to the extension context
  // Add the status bar item and commands to the extension context
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(addGitUserCommand);
  context.subscriptions.push(selectGitUserCommand);
  context.subscriptions.push(viewSavedUsernamesCommand);
  context.subscriptions.push(deleteGitUserCommand);
  context.subscriptions.push(updateGitUserCommand);

  // Automatically update the Git user when the extension is activated
  // vscode.commands.executeCommand("gituserswitcher.GitUserActivate");
}

export function deactivate() {
  // Clean up resources if needed
}
