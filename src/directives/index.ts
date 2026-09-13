import { App } from 'vue';
import perms from './perms';
import roles from './roles';

export default {
  install: (app: App) => {
    app.directive('perms', perms);
    app.directive('roles', roles);
  },
};
