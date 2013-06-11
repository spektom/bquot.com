require 'uri'
require 'net/http'
require 'net/https'
require 'core_extensions'

class ProxyController < ApplicationController
  after_filter :output_encoding
  
  def index
    bookmark = Bookmark.by_short_id(params[:id]);
    impressionist(bookmark);
    
    url = URI.parse(bookmark.url)
    
    # Handle redirects:
    found = false
    redirects = 10
    while !found && redirects > 0 
      http = Net::HTTP.new(url.host, url.port)
      if ("https".eql?(url.scheme))
        http.use_ssl = true
        http.verify_mode = OpenSSL::SSL::VERIFY_NONE
      end
      
      # Try to handle hashbangs: simply remove the hashbang part in hope that
      # the service will provide a static page by this address.
      request_uri = url.request_uri
      if (!url.fragment.nil? && url.fragment =~ /^\!\//)
        request_uri = request_uri + url.fragment[2,url.fragment.length]
      end
      
      request = Net::HTTP::Get.new(request_uri)
      response = http.request(request)
      if (response.kind_of?(Net::HTTPRedirection))
        newuri = redirect_url(response)
        
        # If the new URI is relative, just update the previous URL object:
        if (newuri  =~ /^\//)
          query_idx = newuri.index('?')
          if (query_idx.nil?)
            url.path = newuri
          else
            url.path = newuri[0,query_idx]
            url.query=newuri[query_idx+1,newuri.length]
          end
        else
          url = URI.parse(newuri)
        end
      else
        found = true
      end
      
      redirects = redirects - 1
    end
    
    @encoding = document_encoding(response)
    @content = @encoding ? response.body.force_encoding(@encoding) : response.body
    
    # Convert to UTF-8:
    if (@encoding)
      @content = Iconv.conv("UTF-8//IGNORE", @encoding, @content);
    end
    @content = @content.enforce_utf8();
    
    fix_base_url(url.merge(".").to_s)
    inject_scripts(bookmark)
    
    # Convert back to the original encoding:
    if (@encoding)
      @content = Iconv.conv(@encoding + "//IGNORE", "UTF-8", @content);
    end
    
    render :layout => false
  end
  
  private
  def redirect_url(response)
    if response['location'].nil?
      response.body.match(/<a href=\"([^>]+)\">/i)[1]
    else
      response['location']
    end
  end
  
  def document_encoding(response)
    encoding = nil
    response.type_params.each_pair do |k,v|
      encoding = v.upcase if k =~ /charset/i
    end
    unless encoding
      encoding = response.body =~ /<meta[^>]*HTTP-EQUIV=["']Content-Type["'][^>]*content=["']([^"']+)["']/i && $1 =~ /charset=(.+)/i && $1.upcase
    end
    if (!encoding.nil?)
      encoding = "UTF-8" if encoding.downcase == "utf8"
    end
    encoding
  end
  
  def fix_base_url(base_url)
    # Check that base URL tag doesn't exist yet:
    if (@content !~ /<base[^>]*href=[^>]*>/i)
      @content.gsub!(/(<head[^>]*>)/i, "\\1\n<base href=\"#{base_url}\" />")
    end
  end
  
  def inject_scripts(bookmark)
    scripts = <<EOF
      <script src="http://bquot.com/javascripts/ajaxslt.min.js" type="text/javascript"></script> 
      <script src="http://bquot.com/javascripts/rangy-core.min.js" type="text/javascript"></script> 
      <script src="http://bquot.com/javascripts/jquery-1.6.1.min.js" type="text/javascript"></script>
      <script src="http://bquot.com/javascripts/jquery.addons.min.js" type="text/javascript"></script> 
      <script src="http://bquot.com/javascripts/bq.js" type="text/javascript"></script>
      <script>
        bq_jQuery(window).load(function() {
          var message = bq_jQuery("<div id='bq-message'><span>You are viewing content directed through <a href='http://bquot.com'>bquot.com</a>. View the <a href='#{bookmark.url}'>original</a> page.</span></div>").beResetCSS().hide().appendTo("body");
          bq_jQuery("<a href='#' id='bq-close-notify'>X</a>").appendTo(message).click(function(event) {
            event.preventDefault();
            bq_jQuery("#bq-message").fadeOut("slow");
          });
          message.find('*').each(function() {
            bq_jQuery(this).beResetCSS();
          });
          message.find('a').css({
            'color': '#fff',
            'text-decoration': 'underline'
          });
          message.css({
            'font-family': '"Lucida Grande", "Arial", "Helvetica", "Verdana", "sans-serif"',
            'position': 'fixed',
            'top': '0px',
            'left': '0px',
            'width': '100%',
            'z-index': '2147483640',
            'text-align': 'center',
            'font-weight': 'bold',
            'font-size': '12px',
            'line-height': '1em',
            'color': '#fff',
            'padding': '7px 0px 7px 0px',
            'background-color': '#cf7721'
          });
          message.children('span').css({
            'color': '#fff',
            'text-align': 'center',
            'width': '95%',
            'float': 'left'
          });
          bq_jQuery('#bq-close-notify').css({
            'white-space': 'nowrap',
            'float': 'right',
            'margin-right': '10px',
            'color': '#fff',
            'text-decoration': 'none',
            'border': '2px #fff solid',
            'padding-left': '3px',
            'padding-right': '3px'
          });
          message.fadeIn("slow");
          BQ.restore('http://bquot.com/#{bookmark.short_id}', #{bookmark.data});
        });
      </script>
      <script type="text/javascript">
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-23508932-3']);
        _gaq.push(['_trackPageview']);

        (function() {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
      </script>
    </head>
EOF
    
    @content.gsub!(/<\/\s*head>/i, scripts)
  end
  
  def output_encoding
    if @encoding
      response.headers['Content-Type'] = 'text/html; charset=' + @encoding
    end
  end
end
