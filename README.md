# Easy-Diffusion-Plugins
A simple plugin manager with a search box, that installs and auto updates plugins from GitHub.

Plugin developers, feel free to add your plugins to this repo in two easy steps:
1. Upload your plugin to the plugins folder. Feel free to create sub directories for your plugins.
2. Edit plugins.json to add an entry for your plugin. Mandatory fields to add a plugin to the catalog are: id, name, and url. All other fields are optional.
3. That's it! Your plugin should now show in the plugins tab in Easy Diffusion. :)

To update an existing plugin, just edit it in the plugin folders. Clients will pick it up automatically.
