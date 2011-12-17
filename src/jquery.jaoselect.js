(function($) {
	"use strict";

	var JaoSelect = function(settings, model) {

		// Delete previously created element if exists
		model.next('.jaoselect').remove();

		// Create and cache DOM blocks
		this.model = model.hide();
		this.block = $.fn.jaoselect.htmlBuilder.render(settings, model).insertAfter(this.model);

		this.header = this.block.find('.jao_header');
		this.list = this.block.find('.jao_options');
		this.options = this.block.find('.jao_options input');
		this.settings = settings;

		this.block.data('jaoselect', this);

		this.header.click($.proxy(function() {this.toggleList();}, this));
		this.options.click($.proxy(function() {this.onOptionClick();}, this));
		this.model.change($.proxy(function() {this.onModelChange();}, this));


		this.onModelChange();

		return this;
	};

	JaoSelect.prototype = {

		onOptionClick: function() {
			if (!this.settings.multiple && this.settings.dropdown) {
				this.toggleList(false);
			}
			this.updateModel();
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
			var i;
			if (!$.isArray(value)) {
				value = [value];
			}

			this.options.removeAttr('checked');
			for (i=0; i<value.length; i++) {
				this.options.filter('[value="' + value[i] + '"]').attr('checked', 'checked');
			}
		},

		updateModel: function() {
			this.model.val(this.value());
			this.model.trigger('change');
		},

		onModelChange: function() {
			this.setValue(this.model.val());
			this.updateHeader();
			this.updateList();
		},

		/**
		 * View section
		 */
		toggleList: function(toShow) {
			if (arguments.length === 0) {
				this.list.toggle();
				return;
			}
			if (toShow) {
				this.list.show();
			} else {
				this.list.hide();
			}
		},

		updateList: function() {
			this.list.find('>label').removeClass('selected');
			this.list.find('>label:has(input:checked)').addClass('selected');
		},

		updateHeader: function() {
			var values = [], html;

			this.options.filter(':checked').parent().each(function() {
				values.push($.extend({}, $(this).data()));
			});

			switch (values.length) {
				case 0:
					html = this.settings.template.placeholder.call(this);
					break;
				case 1:
					html = this.settings.template.singleValue.call(this, values[0]);
					break;
				default:
					html = this.settings.template.multipleValue.call(this, values);
			}

			this.header.html(html);
		},

		/**
		 * Templates for combobox header
		 */
		placeholder: function() {
			return '<span class="jao_placeholder">' + this.settings.placeholder + '</span>';
		},

		singleValue: function(value) {
			var html = '';
			if (value.image) {
				html += '<img src="' + value.image + '"> ';
			}
			html += '<span>' + value.title + '</span>';
			return html;
		},

		multipleValue: function(values) {
			var i, html = [];
			for (i=0; i<values.length; i++) {
				html.push(JaoSelect.prototype.singleValue(values[i]));
			}
			return html.join(', ');
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
			var $this = $(this),

				settings = $.extend(true, {}, $.fn.jaoselect.defaults, {
					// Settings specific to dom element
					width: $this.width(),
					height: $this.height(),
					multiple: !!$this.attr('multiple'),
					name: $this.attr('name') || $.fn.jaoselect.index++
				}, s);

			// Correcting settings
			if (settings.maxDropdownWidth < settings.width) {
				settings.maxDropdownWidth = settings.width;
			}

			// If multiple, model must support multiple selection
			if (settings.multiple) {
				$this.attr('multiple', 'multiple');
			}

			new JaoSelect(settings, $this);
		});
	};

	$.fn.jaoselect.defaults = {
		maxDropdownHeight: 400,
		maxDropdownWidth: 800,
		dropdown: true,
		placeholder: '&nbsp;',

		template: {
			placeholder: JaoSelect.prototype.placeholder,
			singleValue: JaoSelect.prototype.singleValue,
			multipleValue: JaoSelect.prototype.multipleValue
		}
	};
	$.fn.jaoselect.index = 0; // Index for naming different selectors if Dom name doesn't provided

	/**
	 * Helper for rendering html code
	 */
	$.fn.jaoselect.htmlBuilder = {

		render: function (settings, model) {

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
					this.renderOptionsList() +
				'</div>'
			).appendTo('body'); // We can adjust width and height of element appended to body.

			this.adjustStyle();

			$('body').detach('.jaoselect');

			return this.block;
		},

		// render the html for a single option
		renderOption: function(option) {
			var attr = {
					type: this.settings.multiple? 'checkbox' : 'radio',
					value: option.val(),
					name: 'jaoselect_' + this.settings.name,
					disabled: option.attr('disabled') ? 'disabled' : ''
				},
				labelAttr = {
					'data-title': option.text(),
					'data-cls': option.attr('class') || '',
					'data-value': option.val(),
					'data-image': option.data('image')
				};
			// todo: extend labelAttr with option.data() array to provide custom data form options

			return '<label ' + this.renderAttributes(labelAttr) + '>' +
						'<input ' + this.renderAttributes(attr) + ' />' + this.renderLabel(option) +
					'</label>';
		},

		renderLabel: function(option) {
			var className = option.attr('class') ? 'class="' + option.attr('class') + '"' : '',
				image = option.data('image') ? '<img src="' + option.data('image') + '" /> ' : '';

			return image + '<span ' + className + '>' + option.text() + '</span>';
		},

		// render the html for the options
		renderOptionsList: function() {

			var self = this,
				html = '';

			this.model.find('option').each(function() {
				html += self.renderOption($(this));
			});

			return '<div class="jao_options">' + html +	'</div>';
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
			var header = this.block.find('div.jao_header'),
				options = this.block.find('div.jao_options'),
				optionsHeight = Math.min(options.innerHeight(), this.settings.maxDropdownHeight),
				optionsWidth = Math.max(header.innerWidth(), options.width());

			optionsWidth = Math.min(optionsWidth, this.settings.maxDropdownWidth);

			options.css({
				width: optionsWidth + 'px',
				height: optionsHeight + 'px'
			});
		},

		adjustListStyle: function() {
			var options = this.block.find('div.jao_options');
			options.css('height', this.settings.height + 'px');
		},

		renderAttributes: function(attr) {
			var key, html = [];
			for (key in attr) {
				if (attr[key]) {
					html.push(key + '="' + attr[key] + '"');
				}
			}
			return html.join(' ');
		}
	};

})(jQuery);