# Easy-Diffusion-Plugins
A simple plugin manager with a search box, that installs and auto updates plugins from GitHub.

You just need this: https://raw.githubusercontent.com/patriceac/Easy-Diffusion-Plugins/main/plugin-manager-1.8.plugin.js

Plugin developers, feel free to add your plugins to this repo in one easy steps:
1. Edit plugins.json to add an entry for your plugin. Mandatory fields to add a plugin to the catalog are: id, name, and url. All other fields are optional.

To update an existing plugin, just edit it in your usual repo. Clients will pick it up automatically (GitHub repos only).
