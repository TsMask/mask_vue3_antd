import { App } from 'vue';
import permsDirective from './perms-directive';
import rolesDirective from './roles-directive';

export default {
  install: (app: App) => {
    app.directive('perms', permsDirective);
    app.directive('roles', rolesDirective);
  },
};
