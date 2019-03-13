import EmberObject from '@ember/object';
import Evented from '@ember/object/evented';
import { bind, cancel, later } from '@ember/runloop';
import { get, set } from '@ember/object';

import { addQueryParam } from 'shared/utils/url';

var INSECURE     = 'ws://';
var SECURE       = 'wss://';
var sockId       = 1;
var warningShown = false;
var wasConnected = false;

const DISCONNECTED = 'disconnected';
const CONNECTING   = 'connecting';
const CONNECTED    = 'connected';
const CLOSING      = 'closing';
const RECONNECTING = 'reconnecting';

export default EmberObject.extend(Evented, {
  url:             null,
  autoReconnect:   true,
  watchdogTimeout: 11000,
  metadata:        null,

  _socket:         null,
  _state:          DISCONNECTED,
  _framesReceived: 0,
  _frameTimer:     null,
  _reconnectTimer: null,
  _tries:          0,
  _disconnectCbs:  null,
  _disconnectedAt: null,
  _closingId:      null,

  connect(metadata) {
    if ( get(this, '_socket') ) {
      console.error('Socket refusing to connect while another socket exists');

      return;
    }

    set(this, '_disconnectCbs', get(this, '_disconnectCbs') || []);
    set(this, 'metadata', metadata || get(this, 'metadata') || {});

    var url = get(this, 'url');

    // If the site is SSL, the WebSocket should be too...
    if ( window.location.protocol === 'https:' && url.indexOf(INSECURE) === 0 ) {
      url = SECURE + url.substr(INSECURE.length);
      set(this, 'url', url);
    }

    var id = sockId++;

    console.log(`Socket connecting (id=${ id }, url=${ `${ url.replace(/\?.*/, '')  }...` })`);

    var socket = new WebSocket(addQueryParam(url, 'sockId', id));

    socket.__sockId  = id;
    socket.metadata  = get(this, 'metadata');
    socket.onmessage = bind(this, this._message);
    socket.onopen    = bind(this, this._opened);
    socket.onerror   = bind(this, this._error);
    socket.onclose   = bind(this, this._closed);

    this.setProperties({
      _socket: socket,
      _state:  CONNECTING,
    });
  },

  send(/* arguments*/) {
    let socket = get(this, '_socket');

    if ( socket ) {
      socket.send(...arguments);
    }
  },

  disconnect(cb) {
    if ( cb ) {
      get(this, '_disconnectCbs').pushObject(cb);
    }

    set(this, 'autoReconnect', false);
    this._close();
  },

  reconnect(metadata) {
    set(this, 'metadata', metadata || {});
    if ( get(this, '_state') ===  CONNECTING ) {
      this._log('Ignoring reconnect for socket in connecting');

      return;
    }

    if ( get(this, '_socket') ) {
      this._close();
    } else {
      this.connect(metadata);
    }
  },

  getMetadata() {
    let socket = get(this, '_socket');

    if ( socket ) {
      return socket.metadata;
    } else {
      return {};
    }
  },

  getId() {
    let socket = get(this, '_socket');

    if ( socket ) {
      return socket.__sockId;
    } else {
      return null;
    }
  },

  _close() {
    var socket = get(this, '_socket');

    if ( socket ) {
      try {
        this._log('closing');
        set(this, '_closingId', socket.__sockId);
        socket.onopen = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      } catch (e) {
        this._log('Socket exception', e);
        // Meh..
      }

      this.setProperties({ _state: CLOSING, });
    }
  },

  _opened() {
    this._log('opened');
    var now = (new Date()).getTime();

    var at = get(this, '_disconnectedAt');
    var after = null;

    if ( at ) {
      after = now - at;
    }

    this.setProperties({
      _state:          CONNECTED,
      _framesReceived: 0,
      _disconnectedAt: null,
    });

    this.trigger('connected', get(this, '_tries'), after);
    this._resetWatchdog();
    cancel(get(this, '_reconnectTimer'));
  },

  _message(event) {
    this._resetWatchdog();
    set(this, '_tries', 0);
    this.incrementProperty('_framesReceived');
    this.trigger('message', event);
  },

  _resetWatchdog() {
    if ( get(this, '_frameTimer') ) {
      cancel(get(this, '_frameTimer'));
    }

    let timeout = get(this, 'watchdogTimeout');

    if ( timeout && get(this, '_state') === CONNECTED) {
      set(this, '_frameTimer', later(this, function() {
        this._log('Socket watchdog expired after', timeout, 'closing');
        this._close();
        this.trigger('watchdogTimeout');
      }, timeout));
    }
  },

  _error() {
    set(this, '_closingId', get(this, '_socket.__sockId'));
    this._log('error');
  },

  _closed() {
    this._log(`Socket ${ get(this, '_closingId') } closed`);

    set(this, '_closingId', null);
    set(this, '_socket', null);
    cancel(get(this, '_reconnectTimer'));
    cancel(get(this, '_frameTimer'));

    let cbs = get(this, '_disconnectCbs') || [];

    while ( cbs.get('length') ) {
      let cb = cbs.popObject();

      cb.apply(this);
    }

    if ( [CONNECTED, CLOSING].indexOf(get(this, '_state')) >= 0 ) {
      this.trigger('disconnected');
      wasConnected = true;
    }

    if ( get(this, '_disconnectedAt') === null ) {
      set(this, '_disconnectedAt', (new Date()).getTime());
    }

    if ( !warningShown && !wasConnected ) {
      set(this, 'autoReconnect', false);
      set(this, '_state', DISCONNECTED);

      // const intl = window.l('service:intl');
      // let warningMessage = intl.t('growl.webSocket.connecting.warning');
      // window.l('service:growl').error(intl.t('growl.webSocket.connecting.title'), warningMessage);
      warningShown = true;
    } else if ( get(this, 'autoReconnect') ) {
      set(this, '_state', RECONNECTING);
      this.incrementProperty('_tries');
      let delay = Math.max(1000, Math.min(1000 * get(this, '_tries'), 30000));

      set(this, '_reconnectTimer', later(this, this.connect, delay));
    } else {
      set(this, '_state', DISCONNECTED);
    }
  },

  _log(/* arguments*/) {
    var args = ['Socket'];

    for ( var i = 0 ; i < arguments.length ; i++ ) {
      args.push(arguments[i]);
    }

    args.push(`(state=${ get(this, '_state') }, id=${ get(this, '_socket.__sockId') })`);

    console.log(args.join(' '));
  },
});
