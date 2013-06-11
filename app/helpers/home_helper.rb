module HomeHelper
  def bookmarlet_code
    @bookmarkletCode ||= "javascript:" + IO.read(File.expand_path(RAILS_ROOT) + "/public/javascripts/bookmarklet.min.js");
  end
end
