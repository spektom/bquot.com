class ApiController < ApplicationController
  def create
    @bookmark = Bookmark.create(:url => params[:url], :data => params[:data])
    render :json => { :short_url => "http://bquot.com/" + @bookmark.short_id }
  end
  
  def show
    @bookmark = Bookmark.by_short_id(params[:id])
    render :json => { :url => @bookmark.url, :data => @bookmark.data }
  end
  
  def create_js
    @bookmark = Bookmark.create(:url => params[:url], :data => params[:data])
    render :js => "BQ.restore('http://bquot.com/" + @bookmark.short_id + "', " + params[:data] + ", true);";
  end
end