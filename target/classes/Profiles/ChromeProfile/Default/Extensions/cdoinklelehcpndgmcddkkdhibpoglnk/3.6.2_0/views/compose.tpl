<form method="post" action="/" id="compose_form">
  <div class="row">Hey <span id="tw_user"></span></div>
  <textarea
    id="compose"
    name="status"
    placeholder="What's on your mind?"
    autocorrect="no"
  ></textarea>
  <div class="row">
    <button class="fr" type="submit">Tweet</button>
    <div><span id="char_count">140</span> chars left</div>
  </div>
  <footer class="row">
    <span class="fl">&copy; Bird Nest</span>
    <a
      href="https://chrome.google.com/webstore/detail/bird-nest-for-twitter/cdoinklelehcpndgmcddkkdhibpoglnk/reviews"
      target="_blank"
      >Feedback</a
    >
    <a href="#" id="logout">Logout</a>
  </footer>
</form>
