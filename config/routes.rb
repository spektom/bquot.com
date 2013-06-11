Bookmarquote::Application.routes.draw do
  root :to => 'home#index'
  match '/help' => 'home#help'
  match '/tos' => 'home#tos'
  match '/api' => 'api#create',       :via => :post
  match '/api.js' => 'api#create_js', :via => :get
  match '/api/:id' => 'api#show',     :via => :get
  match '/:id' => 'proxy#index'
end
