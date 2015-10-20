const ShellComponent = require('./shell-component');

module.exports = function init(app) {
  app.config.on('all-preferences-loaded', () => {
    const pref = app.packages.shell.preferences;
    pref['user-css'] = (pref['user-css'] || '').replace(/~/g, app.config.configFolder);
  });

  app.on('packages-init-done', () => {
    app.commands.execute('inject-script', __dirname + '/hterm_all.js');
    setTimeout(()=>app.commands.execute('new-tab'), 100);
  });

  const pkg = {
    initializeTerminal(t) {
      Object.keys(this.preferences).forEach(k => {
        t.prefs_.set(k, this.preferences[k]);
      });
    },

    name: 'shell',
    path: __dirname
  };

  app.commands.register('new-tab', () => {
    const component = new ShellComponent(app, pkg);
    const tab = app.tabs.add(component);
    component.on('process-closed', () => {
      app.tabs.activateFirstTab();
      tab.close();
    });
  });


  return pkg;
};
