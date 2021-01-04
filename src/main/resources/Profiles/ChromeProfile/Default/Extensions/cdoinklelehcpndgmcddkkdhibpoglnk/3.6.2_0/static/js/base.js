require(['jquery.min', 'oAuth', 'sha1', 'twitter'], function() {
  var $content = (window.$content = $('#content'));

  chrome.browserAction.setBadgeText({ text: '' });

  setTimeout(function() {
    (function(i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r;
      (i[r] =
        i[r] ||
        function() {
          (i[r].q = i[r].q || []).push(arguments);
        }),
        (i[r].l = 1 * new Date());
      (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
      a.async = 1;
      a.src = g;
      m.parentNode.insertBefore(a, m);
    })(
      window,
      document,
      'script',
      'https://www.google-analytics.com/analytics.js',
      'ga'
    );

    ga('create', 'UA-129804160-1', 'auto');
    ga('set', 'checkProtocolTask', function() {});
    ga('require', 'displayfeatures');
    ga('send', 'pageview', 'popup.html');
  }, 1);

  /* Make sure the user is logged in */
  if (!Twitter.isLoggedIn()) {
    $('#header').remove();
    $('header img').addClass('login')
    $(
      '<div style="padding: 40px 50px 20px; text-align: center;"><a href="#">Login to your Twitter account</a></div>'
    )
      .on('click', function() {
        Twitter.authenticate();
      })
      .appendTo('#content');
    return null;
  }

  require(['compose'], function(compose) {
    compose.load();
  });

  $.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
      if (o[this.name]) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  };

  setTimeout(function() {
    $(document.body)
      .css({ height: $(document.body).height() + 1 + 'px' })
      .trigger('resize');
  }, 100);
});
