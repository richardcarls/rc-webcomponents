// dotnet run -- <cases.json>
using System.Text.Json;
using App.Components.Rc;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

var cases = JsonDocument.Parse(File.ReadAllText(args[0])).RootElement;

await using var services = new ServiceCollection().AddLogging().BuildServiceProvider();
await using var renderer = new HtmlRenderer(services, services.GetRequiredService<ILoggerFactory>());

Task<string> Render<T>(Dictionary<string, object?> parameters) where T : IComponent =>
    renderer.Dispatcher.InvokeAsync(async () =>
        (await renderer.RenderComponentAsync<T>(ParameterView.FromDictionary(parameters))).ToHtmlString());

static string Fill(string pattern, params (string Name, object Value)[] values) =>
    values.Aggregate(pattern, (url, value) => url.Replace($"{{{value.Name}}}", value.Value.ToString()));

static string? Optional(JsonElement element, string name) =>
    element.TryGetProperty(name, out var value) ? value.GetString() : null;

var html = new Dictionary<string, string>();

foreach (var c in cases.GetProperty("pagination").EnumerateArray())
{
    var href = c.GetProperty("href").GetString()!;

    html[$"pagination/{c.GetProperty("name").GetString()}"] = await Render<RcPagination>(new()
    {
        [nameof(RcPagination.Page)] = c.GetProperty("page").GetInt32(),
        [nameof(RcPagination.Total)] = c.GetProperty("total").GetInt32(),
        [nameof(RcPagination.Href)] = (Func<int, string>)(page => Fill(href, ("page", page))),
        [nameof(RcPagination.Label)] = Optional(c, "label"),
    });
}

foreach (var c in cases.GetProperty("breadcrumbs").EnumerateArray())
{
    var items = c.GetProperty("items").EnumerateArray()
        .Select(item => (item[0].GetString()!, item[1].GetString()!))
        .ToList();

    html[$"breadcrumbs/{c.GetProperty("name").GetString()}"] = await Render<RcBreadcrumbs>(new()
    {
        [nameof(RcBreadcrumbs.Items)] = (IReadOnlyList<(string, string)>)items,
        [nameof(RcBreadcrumbs.Label)] = Optional(c, "label"),
    });
}

foreach (var c in cases.GetProperty("sortHeaders").EnumerateArray())
{
    var href = c.GetProperty("href").GetString()!;

    html[$"sort-header/{c.GetProperty("name").GetString()}"] = await Render<RcSortHeader>(new()
    {
        [nameof(RcSortHeader.Key)] = c.GetProperty("key").GetString(),
        [nameof(RcSortHeader.Label)] = c.GetProperty("label").GetString(),
        [nameof(RcSortHeader.SortKey)] = c.GetProperty("sort").GetString(),
        [nameof(RcSortHeader.SortDirection)] = c.GetProperty("direction").GetString(),
        [nameof(RcSortHeader.Href)] =
            (Func<string, string, string>)((key, direction) => Fill(href, ("key", key), ("direction", direction))),
        [nameof(RcSortHeader.First)] = Optional(c, "first") ?? "ascending",
    });
}

var ranges = new Dictionary<string, object[]>();

for (var total = 0; total <= 13; total++)
{
    for (var page = 0; page <= 14; page++)
    {
        for (var siblings = 0; siblings <= 2; siblings++)
        {
            for (var boundaries = 0; boundaries <= 2; boundaries++)
            {
                ranges[$"{total},{page},{siblings},{boundaries}"] = RcPagination
                    .Range(page, total, siblings, boundaries)
                    .Select(item => item is int number ? (object)number : "ellipsis")
                    .ToArray();
            }
        }
    }
}

Console.WriteLine(JsonSerializer.Serialize(new { html, ranges }));
