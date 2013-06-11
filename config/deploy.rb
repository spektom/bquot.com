#############################################################
#	Application
#############################################################
set :application, "BookmarQuote"
set :deploy_to, "/opt/apps/#{application}"
set :keep_releases, 4

#############################################################
#	Settings
#############################################################
default_run_options[:pty] = true
set :use_sudo, false

#############################################################
#	Servers
#############################################################
set :domain, "bquot.com"
set :user, "rails"
server domain, :app, :web
role :db, domain, :primary => true

#############################################################
#	Subversion
#############################################################
set :repository,  "https://free2.projectlocker.com/spektom/BookmarQuote/svn/trunk"
set :svn_username, "blabla"
set :svn_password, "blabla"
set :checkout, "export"

#############################################################
#	Passenger
#############################################################
namespace :deploy do
  task :restart do
    run "touch #{current_path}/tmp/restart.txt"
    cleanup
  end
end

after :deploy do
  run "chmod 777 #{current_path}/tmp"
end
