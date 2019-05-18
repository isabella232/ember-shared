export function initialize(application) {
  const router = application.lookup('service:router');

  application.fallbackRoute = application.fallbackRoute || 'authed';

  application.currentPath = '';
  application.previousPaths = [];
  application.maxPrevPaths = 10;

  router.on('routeDidChange', (transition) => {
    if ( !transition.to ) {
      return;
    }

    const name = transition.to.name;
    const args = router._argsFor(transition.to);

    const path = transition.router.generate(name, ...args);

    if ( path.replace(/\?.*$/) !== application.currentPath.replace(/\?.*$/) ) {
      const prev = application.currentPath;

      if ( application.ignoreNextRoute ) {
        application.ignoreNextRoute = false;

        return;
      }

      application.currentPath = path;

      if ( prev ) {
        application.previousPaths.push(prev);
        if ( application.previousPaths.length > application.maxPrevPaths ) {
          application.previousPaths.length = application.maxPrevPaths;
        }
      }
    }
  });

  router.reopen({
    _rootTransitionTo() {
      // Transitions on the main router, regardless of what engine you're in
      const router = window.l('router:main');

      return router.transitionTo(...arguments);
    },

    // Collect all the parameters for transitioning to a route
    _argsFor(route) {
      const out = [];

      while ( route ) {
        if ( route.paramNames && route.paramNames.length ) {
          for ( let i = route.paramNames.length - 1 ; i >= 0 ; i-- ) {
            out.unshift(route.params[ route.paramNames[i] ]);
          }
        }

        route = route.parent;
      }

      return out;
    },

    _keysFor(route) {
      const out = [];

      while ( route ) {
        if ( route.paramNames && route.paramNames.length ) {
          for ( let i = route.paramNames.length - 1 ; i >= 0 ; i-- ) {
            out.unshift(route.paramNames[i]);
          }
        }

        route = route.parent;
      }

      return out;
    },

    goToParent() {
      let to = this.currentRoute;

      if ( to.localName === 'index' ) {
        to = to.parent.parent;
      } else {
        to = to.parent;
      }

      const args = this._argsFor(to);

      args.unshift(to.name);

      application.ignoreNextRoute = true;

      this._rootTransitionTo.apply(this, args).catch(() => {
        this._rootTransitionTo(application.fallbackRoute);
      });
    },

    goToPrevious() {
      const path = application.previousPaths.pop();

      application.ignoreNextRoute = true;

      if ( path ) {
        this._rootTransitionTo(path);
      } else {
        this.goToParent();
      }
    },

    transitionToNearest(...params) {
      let route = this.currentRoute;
      let name;
      let args;

      do {
        name = route.name;
        args = this._argsFor(route);

        if ( args.length > params.length ) {
          route = route.parent;
        }
      } while ( route && args.length > params.length )

      // If they didn't match, make it match now
      params.length = args.length;

      this._rootTransitionTo(name, ...params).catch(() => {
        router.transitionTo(application.fallbackRoute);
      });
    }
  });
}

export default {
  name: 'route-navigation',
  initialize,
};
