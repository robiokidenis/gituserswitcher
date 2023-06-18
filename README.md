# Git User Switcher

This Visual Studio Code extension allows you to easily switch between multiple Git users in your development environment.

## Features

- Switch between multiple Git users with a single click
- Add and manage Git users with their respective usernames, email addresses, and SSH keys
- Update existing Git users
- Delete Git users

## Getting Started

1. Install the Git User Switcher extension in Visual Studio Code.
2. Open the Command Palette (press `Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and search for `Git User Switcher: Add Git User`.
3. Enter the username, email address, and SSH key (optional) for the Git user you want to add.
4. Once added, you can see the current Git user in the status bar on the right side.
5. To switch between Git users, click on the status bar item (Git User: <username>) and select the desired user from the list.
6. To update a Git user, open the Command Palette and search for `Git User Switcher: Update Git User`. Select the user you want to update and enter the new details.
7. To delete a Git user, open the Command Palette and search for `Git User Switcher: Delete Git User`. Select the user you want to delete.

## Switching Between Git Users

To switch between Git users, follow these steps:

1. Locate the status bar on the right side of the Visual Studio Code window.
2. Click on the status bar item displaying the current Git user (Git User: <username>).
3. A dropdown list will appear, showing all the saved Git usernames.
4. Select the desired Git user from the list.
5. The selected Git user will be activated, and their credentials will be used for Git operations.

Please note that switching Git users will affect the Git operations performed in the current workspace.

## Configuration

The extension uses a configuration file (`config.json`) to store the Git users' information. You can find the file in the extension's installation directory.

## Additional Notes

- If no Git user is configured, the extension will try to use the current Git user obtained from the Git configuration.
- The SSH key specified during user addition will be used for authentication when interacting with remote Git repositories.

## Support

If you encounter any issues or have any suggestions or feedback, please feel free to open an issue on the [GitHub repository](https://github.com/your-username/git-user-switcher).

## License

This extension is licensed under the [MIT License](https://opensource.org/licenses/MIT).
