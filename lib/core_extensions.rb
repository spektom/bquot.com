# Ruby string additions
String.class_eval do
  
  # Enforce UTF-8 encoding on string by stripping non-recognized chars
  # Suggested by: http://stackoverflow.com/questions/6243082/ruby-fixing-multiple-encoding-documents/6346179#6346179
  def enforce_utf8(from = nil)
    begin
      self.is_utf8? ? self : Iconv.iconv('utf8', from, self).first
    rescue
      converter = Iconv.new('UTF-8//IGNORE//TRANSLIT', 'ASCII//IGNORE//TRANSLIT')
      converter.iconv(self).unpack('U*').select{ |cp| cp < 127 }.pack('U*').force_encoding('utf-8')
    end
  end
end
