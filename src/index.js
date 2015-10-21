'use strict';

const ShellComponent = require('./shell-component');
const electronApp = require('remote').require('browser-window');

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

    get currentHTerm() {
      const current = app.tabs.current();
      if (!current) {
        return null;
      }
      return current.component.hterm || null;
    },

    get currentComponent() {
      const current = app.tabs.current();
      if (!current) {
        return null;
      }
      return current.component.hterm ? current.component : null;
    },

    get cursorRow() {
      const shell = this.currentHTerm;
      if (!shell) {
        return null;
      }
      return shell.screen_.cursorPosition.row;
    },

    get cursorCol() {
      const shell = this.currentHTerm;
      if (!shell) {
        return null;
      }
      return shell.screen_.cursorPosition.column;
    },

    get cursorRowText() {
      const shell = this.currentHTerm;
      if (!shell) {
        return null;
      }
      return shell.screen_.cursorRowNode_.textContent;
    },

    name: 'shell',
    path: __dirname
  };

  app.on('window-ready', () => {
    app.window.on('maximize', () => {
      pkg.currentHTerm.scrollPort_.onResize_();
    });
    setTimeout(()=>pkg.currentHTerm.scrollPort_.onResize_(), 500);
  });

  app.commands.register('new-tab', () => {
    const component = new ShellComponent(app, pkg);
    const tab = app.tabs.add(component);
    component.on('process-closed', () => {
      app.tabs.activateFirstTab();
      tab.close();
    });
  });

  app.commands.register('prev-word', () => {
    const component = pkg.currentComponent;
    const col = pkg.cursorCol;
    const text = pkg.cursorRowText;

    if (!text) {
      return;
    }

    let i = col - 1;
    while (i && text[i].match(/\s/)) {
      component.sendKey(0x25, 'keydown');
      i--;
    }

    while (i && !text[i].match(/\s/)) {
      component.sendKey(0x25, 'keydown');
      i--;
    }
  });

  app.commands.register('next-word', () => {
    const component = pkg.currentComponent;
    const col = pkg.cursorCol;
    const text = pkg.cursorRowText;

    if (!text) {
      return;
    }

    let i = col - 1;
    while (i && text[i].match(/\s/)) {
      component.sendKey(0x27, 'keydown');
      i++;
    }

    while (i && !text[i].match(/\s/)) {
      component.sendKey(0x27, 'keydown');
      i++;
    }
  });

  app.commands.register('start-line', () => {
    const component = pkg.currentComponent;
    const col = pkg.cursorCol;

    if (!col) {
      return;
    }

    let i = col - 1;
    while (i--) {
      component.sendKey(0x25, 'keydown');
    }
  });

  app.commands.register('end-line', () => {
    const component = pkg.currentComponent;
    const col = pkg.cursorCol;
    const text = pkg.cursorRowText;

    if (!text) {
      return;
    }

    let i = text.length - col + 1;
    while (i--) {
      component.sendKey(0x27, 'keydown');
    }
  });


  return pkg;
};
