(function() {
  var API_URL = 'https://api.twitter.com/',
    STREAM_URL = 'https://userstream.twitter.com/',
    consumer_key = '8bXJCPum5SdeskaADI7qN9NPn',
    consumer_secret = 'EvgvtNWxG9JjuNjtPsMqjypA099oc1SVw4Qa00WB1t1BZbCLEn',
    oauth_token = localStorage.oauth_token || null,
    oauth_token_secret = localStorage.oauth_token_secret || '';

  var Twitter = {
    setUserName: function(username) {
      localStorage.setItem('username', username);
    },
    getUserName: async function() {
      const username = localStorage.getItem('username');
      return username;
    },
    authenticate: function() {
      oauth_token_secret = '';
      oauth_token = null;
      localStorage.removeItem('oauth_token');
      localStorage.removeItem('oauth_token_secret');
      this.api(
        'oauth/request_token',
        'POST',
        $.proxy(function(response) {
          var des = this.deparam(response);
          oauth_token_secret = des.oauth_token_secret;
          oauth_token = des.oauth_token;
          var url =
            'https://api.twitter.com/oauth/authenticate?oauth_token=' +
            oauth_token;
          window.open(url);
        }, this)
      );
    },
    logout: function() {
      localStorage.removeItem('oauth_token');
      localStorage.removeItem('oauth_token_secret');
      oauth_token = false;
      oauth_token_secret = false;
      chrome.browserAction.setBadgeText({ text: '' });
    },
    isLoggedIn: function() {
      return oauth_token && oauth_token_secret;
    },
    setOAuthTokens: function(tokens) {
      $('header img').removeClass('login')
      localStorage.oauth_token = oauth_token = tokens.oauth_token;
      localStorage.oauth_token_secret = oauth_token_secret =
        tokens.oauth_token_secret;
    },
    stream: function(path) {
      var args = Array.prototype.slice.call(arguments, 1),
        fn = false,
        params = {},
        method = 'GET',
        self = this;

      /* Parse arguments to their appropriate position */
      for (var i in args) {
        switch (typeof args[i]) {
          case 'function':
            fn = args[i];
            break;
          case 'object':
            params = args[i];
            break;
          case 'string':
            method = args[i].toUpperCase();
            break;
        }
      }

      /* Add an oauth token if it is an api request */
      oauth_token && (params.oauth_token = oauth_token);

      /* Add a 1 and .json if its not an authentication request */
      !path.match(/oauth/) && (path = '2/' + path + '.json');

      var accessor = {
          consumerSecret: consumer_secret,
          tokenSecret: oauth_token_secret
        },
        message = {
          action: STREAM_URL + path,
          method: method,
          parameters: [
            ['oauth_consumer_key', consumer_key],
            ['oauth_signature_method', 'HMAC-SHA1']
          ]
        };

      $.each(params, function(k, v) {
        OAuth.setParameter(message, k, v);
      });

      OAuth.completeRequest(message, accessor);

      var stream,
        index = 0;

      var notifications = localStorage.optNotifications;
      if (notifications === '0') {
        setTimeout(function() {
          Twitter.stream('user', fn);
        }, 3000);
      } else {
        $.ajax({
          type: 'GET',
          url: STREAM_URL + path,
          data: OAuth.getParameterMap(message.parameters),
          dataType: 'json',
          xhr: function() {
            stream = new XMLHttpRequest();
            stream.addEventListener(
              'progress',
              function(e) {
                $.each(
                  $.trim(stream.responseText)
                    .split('\r')
                    .slice(index),
                  function(a, b) {
                    try {
                      fn($.parseJSON(b));
                    } catch (e) {}
                    index++;
                  }
                );
              },
              false
            );
            return stream;
          },
          success: fn,
          error: function() {
            setTimeout(function() {
              Twitter.stream('user', fn);
            }, 3000);
          }
        });
      }
    },
    api: function(path /* params obj, callback fn */) {
      var args = Array.prototype.slice.call(arguments, 1),
        fn = false,
        params = {},
        method = 'GET';

      /* Parse arguments to their appropriate position */
      for (var i in args) {
        switch (typeof args[i]) {
          case 'function':
            fn = args[i];
            break;
          case 'object':
            params = args[i];
            break;
          case 'string':
            method = args[i].toUpperCase();
            break;
        }
      }

      /* Add an oauth token if it is an api request */
      oauth_token && (params.oauth_token = oauth_token);

      /* Add a 1.1 and .json if its not an authentication request */
      !path.match(/oauth/) && (path = '1.1/' + path + '.json');

      var accessor = {
          consumerSecret: consumer_secret,
          tokenSecret: oauth_token_secret
        },
        message = {
          action: API_URL + path,
          method: method,
          parameters: [
            ['oauth_consumer_key', consumer_key],
            ['oauth_signature_method', 'HMAC-SHA1']
          ]
        };

      $.each(params, function(k, v) {
        OAuth.setParameter(message, k, v);
      });

      OAuth.completeRequest(message, accessor);

      var p = [];
      $.each(OAuth.getParameterMap(message.parameters), function(k, v) {
        p.push(k + '=' + OAuth.percentEncode(v));
      });

      $[method.toLowerCase()](API_URL + path, p.join('&'), fn).error(function(
        res
      ) {
        if (res && res.responseText && res.responseText.match(/89/)) {
          Twitter.authenticate();
        }
      });
    },
    deparam: function(params) {
      var obj = {};
      $.each(params.split('&'), function() {
        var item = this.split('=');
        obj[item[0]] = item[1];
      });
      return obj;
    }
  };

  window.Twitter = Twitter;
})();
