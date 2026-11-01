# Renders the guide's ERB partials for scripts/test-server-templates.mjs.
#
#   ruby render.rb <extracted app root> <cases.json>
require "bundler/setup"
require "bigdecimal" # loaded by every Rails app; tag helpers check for it
require "action_view"
require "json"

# Rails apps read templates as UTF-8 (config.encoding).
Encoding.default_external = Encoding::UTF_8

root, cases_path = ARGV
cases = JSON.parse(File.read(cases_path))

require File.join(root, "app/helpers/rc_helper.rb")

view_class = ActionView::Base.with_empty_template_cache
view_class.include(RcHelper)
view = view_class.with_view_paths([File.join(root, "app/views")])

def fill(pattern, values)
  values.reduce(pattern) { |url, (name, value)| url.gsub("{#{name}}", value.to_s) }
end

html = {}

cases["pagination"].each do |c|
  html["pagination/#{c["name"]}"] = view.render(
    partial: "rc/pagination",
    locals: {
      page: c["page"],
      total: c["total"],
      href: ->(page) { fill(c["href"], page: page) },
      label: c["label"],
    },
  )
end

cases["breadcrumbs"].each do |c|
  html["breadcrumbs/#{c["name"]}"] = view.render(
    partial: "rc/breadcrumbs",
    locals: { items: c["items"], label: c["label"] },
  )
end

cases["sortHeaders"].each do |c|
  html["sort-header/#{c["name"]}"] = view.render(
    partial: "rc/sort_header",
    locals: {
      key: c["key"],
      label: c["label"],
      sort: c["sort"],
      direction: c["direction"],
      href: ->(key, direction) { fill(c["href"], key: key, direction: direction) },
      first: c.fetch("first", "ascending"),
    },
  )
end

ranges = {}

(0..13).each do |total|
  (0..14).each do |page|
    (0..2).each do |siblings|
      (0..2).each do |boundaries|
        ranges["#{total},#{page},#{siblings},#{boundaries}"] =
          view.rc_pagination_range(page, total, siblings: siblings, boundaries: boundaries)
            .map { |item| item == :ellipsis ? "ellipsis" : item }
      end
    end
  end
end

puts JSON.generate({ html: html, ranges: ranges })
