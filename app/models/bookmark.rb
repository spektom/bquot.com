class Bookmark < ActiveRecord::Base
  is_impressionable
  @@offset = 1000;
  
  def self.by_short_id(id)
    find(id.to_i(36) - @@offset)
  end
  
  def short_id
   (id + @@offset).to_s(36)
  end
end
