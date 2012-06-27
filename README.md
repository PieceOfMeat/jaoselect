Just Another One select plugin for jQuery. I've tried to make plugin supporting both single- and multiselect, dropdown and list view. It also supports styled select options with images.

I've tried my best to make lightweight highly customizable plugin with good design. I would appreciate any bug reports, feature requests and advices :)

### Usage

You must have real html select input on your page.

`$('#myselectid').jaoselect();`

Jaoselect will get all info about options, appearance and starting values from this initial select element, hide it and add itself instead. All value changes made with jaoselect will be reflected in initial input, so you can use it to get current value of input:

### Settings list
<table>
	<tr>
		<th>name</th>
		<th>default</th>
		<th>description</th>
	</tr>
	<tr>
		<td>dropdown</td>
		<td>true</td>
		<td>boolean value, indicating appearance of widget: combobox drop-down list or plain options list</td>
	</tr>
	<tr>
		<td>multiple</td>
		<td>defined by initial &lt;select&gt; element "multiple" attribute</td>
		<td>boolean value, if set to true, options will be presented by checkboxes, false - options will be presented as radio buttons, providing single selection</td>
	</tr>
	<tr>
		<td>width</td>
		<td>defined by initial &lt;select&gt; element width</td>
		<td>combobox header width if dropdown == true, or options list width if dropdown == false</td>
	</tr>
	<tr>
		<td>height</td>
		<td>defined by initial &lt;select&gt; element height</td>
		<td>combobox header height if dropdown == true, or options list height if dropdown == false</td>
	</tr>
	<tr>
		<td>maxDropdownHeight</td>
		<td>400</td>
		<td>makes sence only if dropdown == true, specifies max height of dropdown options list</td>
	</tr>
	<tr>
		<td>placeholder</td>
		<td>&amp;nbsp;</td>
		<td>text to be displayed when no value is selected</td>
	</tr>

	<tr>
		<th colspan="3">Templating functions</th>
	</tr>
	<tr>
		<td>template.placeholder</td>
		<td>$.fn.jaoselect.template.placeholder</td>
		<td>Templating function which is called when no value is selected.</td>
	</tr>
	<tr>
		<td>template.singleValue</td>
		<td>$.fn.jaoselect.template.singleValue</td>
		<td>Templating function which is called when exactly one value is selected</td>
	</tr>
	<tr>
		<td>template.multipleValue</td>
		<td>$.fn.jaoselect.template.selectedCount</td>
		<td>Templating function which is called when selected more than one value</td>
	</tr>
</table>
Note that you can override default settings for whole plugin (instead of those which are defined by initial &lt;select&gt; element):

	$.extend(true, $.fn.jaoselect.defaults, {
		dropdown: false,
		maxDropdownHeight: 700,
		template: {
			placeholder: function() {return 'boo!'}
		}
	});

### Templating functions</h3>

When user select/deselect any option in options list, plugin updates header of combobox.
Depending on quantity of selected items we distinguish three separate cases of templating (as set in plugin settings):

 - 0: template.placeholder (calls with no arguments)<br />
 - 1: template.singleValue (calls with one argument representing one value)<br />
 - &ge;1: template.multipleValue (calls with one argument - array of values)<br />

This functions run in context of current JaoSelect object,
so they get full access to JaoSelect settings and internal keys.<br />

When one or more values selected, functions receive them as argument. Each value is represented by plain JS object
containing full info about item:

	{
		title: Item title
		value: Item value,
		image: path to item image,
		cls: class name of initial <option> element
	}

It will also contain any data you add to initial &lt;option&gt; element by html5 data-attributes.

There are four predefined templating functions:

 - $.fn.jaoselect.template.placeholder returns span with current settings.placeholder text<br />
 - $.fn.jaoselect.template.singleValue returns span with item title and image, if exists<br />
 - $.fn.jaoselect.template.multipleValue returns spans with item titles and images, if exists, comma-separated<br />
 - $.fn.jaoselect.template.selectedCount returns text 'Selected %N of %M'<br />

But you are free to extend $.fn.jaoselect.template with your own functions. This is very flexible way to style your comboboxes!
Example:

$.fn.jaoselect.template.multipleValueWithClipping = function(values) {
	var i, html = [];

	// Adding first two values as we do in singleValue
	// Note that if we want to use other templating functions, we must run them in correct context!
	html.push(this.settings.template.singleValue.call(this, values[0]));
	html.push(this.settings.template.singleValue.call(this, values[1]));

	if (values.length > 2) {
		html.push('<span style="color: #999">and ' + (values.length - 2) + ' more...</span>');
	}
	return html.join(', ');
}