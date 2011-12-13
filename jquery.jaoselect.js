"use strict";

(function($) {

	var inputBuilder = {

		renderAttributes: function(attr) {
			var html = [];
			for (var key in attr) {
				html.push(key + '="' + attr[key] + '"');
			}

			return html.join(' ');
		},

		// render the html for a single option
		renderOption: function(option) {
			var attr = {
				type: this.settings.multiple? 'checkbox' : 'radio',
				value: option.val(),
				name: 'jaoselect_' + this.settings.name
			};

			var label = $('<label><input ' + this.renderAttributes(attr) + ' />' + this.renderLabel(option) + '</label>');
			label.data($.extend({title: option.text(), class: option.attr('class'), value: option.val()}, option.data()));

			return label;
		},

		renderLabel: function(option) {

			var className = option.attr('class') ? 'class="' + option.attr('class') + '"' : '';
			var image = option.data('image') ? '<img src="' + option.data('image') + '" /> ' : '';

			return image + '<span ' + className + '>' + option.text() + '</span>';
		},


		// render the html for the options
		renderOptionsList: function() {

			var html = $('<div class="jao_options"></div>');
			var self = this;
			var options = [];
			this.model.find('option').each(function() {
				html.append(self.renderOption($(this)));
			});

			return html;

		},

		render: function(model, settings) {

			this.settings = settings;
			this.model = model;

			var classNames = [
				'jaoselect',
				this.model.attr('class'),
				(this.settings.multiple) ? 'multiple':'single',
				(this.settings.dropdown) ? 'dropdown':'list'
			];

			this.block = $(
				'<div class="' + classNames.join(' ') + '">' +
					'<div class="jao_header"></div>' +
				'</div>'
			);

			this.block.append(this.renderOptionsList());

			// Appending element to body, so we can adjust width and height of header and options list
			$('body').append(this.block);
			this.adjustStyle();

			// Attach element where it belongs
			$('body').detach('.jaoselect');
			model.after(this.block);

			// If multiple, model must support multiple selection
			if (this.settings.multiple) {
				this.model.attr('multiple', 'multiple');
			}

			return this.block;
		},


		adjustStyle: function() {
			this.block.css({
				width: this.settings.width + 'px'
			});

			if (this.settings.dropdown) {
				this.adjustDropdownStyle();
			} else {
				this.adjustListStyle();
			}
		},


		adjustDropdownStyle: function() {
			var header = this.block.find('div.jao_header');
			var options = this.block.find('div.jao_options');

			var optionsWidth = Math.max(header.innerWidth(), options.width());
			optionsWidth = Math.min(optionsWidth, this.settings.maxDropdownWidth);

			var optionsHeight = Math.min(options.innerHeight(), this.settings.maxDropdownHeight);

			options.css({
				width: optionsWidth + 'px',
				height: optionsHeight + 'px'
			});
		},

		adjustListStyle: function() {
			var options = this.block.find('div.jao_options');
			options.css('height', this.settings.height + 'px');
		}
	};
	
	var jaoSelect = function(block, settings, input) {

		// cache DOM blocks
		this.block = block;
		this.header = block.find('.jao_header');
		this.list = block.find('.jao_options');
		this.options = block.find('.jao_options input');
		this.settings = settings;

		// Initial DOM select element
		this.model = input;

		this.block.data('jaoselect', this);

		this.onModelChange();

		return this;
	};

	jaoSelect.prototype = {

		toggleList: function(toShow) {
			if (arguments.length == 0) {
				this.list.toggle();
			} else {
				toShow ? this.list.show() : this.list.hide();
			}
		},

		onOptionClick: function() {
			if (!this.settings.multiple && this.settings.dropdown) {
				this.toggleList(false);
			}
			this.updateModel();
		},

		onModelChange: function() {
			this.setValue(this.model.val());
			this.updateHeader();
			this.updateList();
		},

		value: function(value) {
			// Get values
			if (!arguments.length) {
				return this.getValue();
			} else {
				this.setValue(value);
			}
		},

		getValue: function() {
			var values = [];
			this.options.filter(':checked').each(function() {
				values.push($(this).val());
			});
			return values;
		},

		setValue: function(value) {
			if (!$.isArray(value)) {
				value = [value];
			}

			this.options.removeAttr('checked');

			for (var i=0; i<value.length; i++) {
				this.options.filter('[value="' + value[i] + '"]').attr('checked', 'checked');
			}
		},

		updateHeader: function() {

			var values = [], html;

			this.options.filter(':checked').parent().each(function() {
				values.push($.extend({}, $(this).data()));
			});

			switch (values.length) {
				case 0:
					html = this.settings.placeholder;
					break;
				case 1:
					html = this.settings.oneValueTemplate(values[0]);
					break;
				default:
					html = this.settings.multipleValueTemplate(values);
			}

			this.header.html(html);
		},

		oneValueTemplate: function(data) {
			var html = '';
			if (data.image) {
				html += '<img src="' + data.image + '"> ';
			}
			html += '<span>' + data.title + '</span>'
			return html
		},

		multipleValueTemplate: function(values) {
			var html = [];
			for (var i=0; i<values.length; i++) {
				html.push(jaoSelect.prototype.oneValueTemplate(values[i]));
			}
			return html.join(', ');
		},

		updateList: function() {
			this.list.find('>label').removeClass('selected');
			this.list.find('>label:has(input:checked)').addClass('selected');
		},

		updateModel: function() {
			this.model.val(this.value());
			this.model.trigger('change');
		}
	};
	

	$.fn.jaoselect = function (s) {

		$(document).unbind('click.jaoselect');
		$(document).bind('click.jaoselect', function(e) {
			$('.jaoselect').each(function() {
				if (!$.contains(this, e.target) && $(this).data('jaoselect').settings.dropdown) {
					$(this).data('jaoselect').toggleList(false);
				}
			});
		});


		// Initialize each multiselect
		return this.each(function () {
			var $this = $(this);

			var settings = $.extend({
				maxDropdownHeight: 400,
				maxDropdownWidth: 800,
				width: $this.width(),
				height: $this.height(),
				className: $this.attr('class'),
				multiple: !!$this.attr('multiple'),
				dropdown: !$this.attr('multiple'),
				name: $this.attr('name'),
				placeholder: '&nbsp;',
				oneValueTemplate: jaoSelect.prototype.oneValueTemplate,
				multipleValueTemplate: jaoSelect.prototype.multipleValueTemplate
			}, s);

			// Correcting settings
			if (settings.maxDropdownWidth < settings.width) {
				settings.maxDropdownWidth = settings.width;
			}
			
			$this.hide();
			$this.next('.jaoselect').remove();
			
			var block = inputBuilder.render($this, settings);
			var jaoObject = new jaoSelect(block, settings, $this);

			block.find('.jao_header').click(function() {jaoObject.toggleList();}).end()
				.find('.jao_options label input').click(function() {jaoObject.onOptionClick()});

			$this.change(function() {
				jaoObject.onModelChange();
			})
		});
	}

})(jQuery);