(function($) {
	"use strict";

	/**
	 * Main controller class for jaoselect input
	 * @param settings array of settings for widget
	 * @param model initial <select> element, we hide it and use like a "model" layer
	 */
	var JaoSelect = function(settings, model) {

		// Delete previously created element if exists
		model.next('.jao_select').remove();

		// Create and cache DOM blocks
		this.model = model.hide();
		this.block = $.fn.jaoselect.htmlBuilder.render(settings, model).insertAfter(this.model);

		this.header = this.block.find('.jao_header');
		this.list = this.block.find('.jao_options');
		this.options = this.block.find('.jao_options input.jao_option');
		this.placeholder = this.block.find('.jao_value');
		this.settings = settings;

		this.block.data('jaoselect', this);

		// Event handlers
		this.header.click($.proxy(function() {this.toggleList();}, this));
		this.options.click($.proxy(function() {this.onOptionClick();}, this));
		this.model.change($.proxy(function() {this.onModelChange();}, this));

		this.onModelChange();

		return this;
	};

	JaoSelect.prototype = {

		/* ---------------- Controllers ----------------- */
		/**
		 * Callback for option click
		 */
		onOptionClick: function() {
			if (!this.settings.multiple && this.settings.dropdown) {
				this.hideList();
			}
			this.updateModel();
		},

		/**
		 * Update model input element and init UI changes
		 */
		updateModel: function() {
			this.model.val(this.getValueFromView());
			this.model.trigger('change');
		},

		/**
		 * Change view due to model value
		 */
		onModelChange: function() {
			this.updateList();
			this.updateHeader();
		},

		/**
		 * Get/set value of input
		 * @param value if not undefined, set this value for input element
		 */
		value: function(value) {
			// Get values
			if (!arguments.length) {
				return this.getValue();
			} else {
				this.setValue(value);
			}
		},

		/**
		 * Get jaoselect value
		 * @return array
		 */
		getValue: function() {
			return this.model.val();
		},

		/**
		 * Set jaoselect value
		 * @param value value to be set
		 */
		setValue: function(value) {
			this.model.val(value);
			this.model.trigger('change');
		},

		/**
		 * get list of values of checked options
		 */
		getValueFromView: function() {
			var value = [];
			this.options.filter(':checked').each(function() {
				value.push(this.value);
			});
			return value;
		},

		/* -------------------------- View ----------------- */
		toggleList: function() { this.list.toggle(); },
		openList: function() { this.list.show(); },
		hideList: function() { this.list.hide(); },

		/**
		 * Update list view: set correct checks and classes for checked labels
		 */
		updateList: function() {
			var i, value = this.getValue();
			value = $.isArray(value) ? value : [value];

			this.options.removeAttr('checked');
			for (i=0; i<value.length; i++) {
				this.options.filter('[value="' + value[i] + '"]').attr('checked', 'checked');
			}

			this.list.find('>label').removeClass('selected');
			this.list.find('>label:has(input:checked)').addClass('selected');
		},

		/**
		 * Update combobox header: get selected items and view them in header depending on their quantity
		 */
		updateHeader: function() {
			var values = [], html;

			this.options.filter(':checked').parent().each(function() {
				values.push($.extend({}, $(this).data()));
			});

			switch (values.length) {
				case 0:
					html = this.settings.template.placeholder.call(this, values);
					break;
				case 1:
					html = this.settings.template.singleValue.call(this, values);
					break;
				default:
					html = this.settings.template.multipleValue.call(this, values);
			}

			this.placeholder.html(html);
		}
	};


	/**
	 * Plugin function; get defaults, merge them with real <select> settings and user settings
	 * @param s
	 */
	$.fn.jaoselect = function (s) {

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

	$.fn.jaoselect.index = 0; // Index for naming different selectors if DOM name doesn't provided

	/**
	 * Templates for combobox header
	 * This is set of functions which can be called from JaoSelect object within its scope.
	 * They return some html (depending on currently selected values), which is set to header when
	 * combobox value changes.
	 */
	$.fn.jaoselect.template = {

		/**
		 * @return placeholder html
		 */
		placeholder: function() {
			return '<span class="jao_placeholder">' + this.settings.placeholder + '</span>';
		},

		/**
		 * @param values array of values
		 * @return html for first value
		 */
		singleValue: function(values) {
			var html = '', value = values[0];

			if (value.image) {
				html += '<img src="' + value.image + '"> ';
			}
			html += '<span>' + value.title + '</span>';
			return html;
		},

		/**
		 * @param values array
		 * @return html for all values, comma-separated
		 */
		multipleValue: function(values) {
			var i, html = [];
			for (i=0; i<values.length; i++) {
				html.push(this.settings.template.singleValue.call(this, [values[i]]));
			}
			return html.join(', ');
		},

		/**
		 * @param values
		 * @return html for quantity of selected items and overall options
		 */
		selectedCount: function(values) {
			return 'Selected ' + values.length + ' of ' + this.options.size();
		}
	};

	/**
	 * Default settings
	 */
	$.fn.jaoselect.defaults = {
		maxDropdownHeight: 400,
		maxDropdownWidth: 800,
		dropdown: true,
		placeholder: '&nbsp;',

		template: {
			placeholder: $.fn.jaoselect.template.placeholder,
			singleValue: $.fn.jaoselect.template.singleValue,
			multipleValue: $.fn.jaoselect.template.selectedCount
		}
	};

	/**
	 * Helper for rendering html code
	 */
	$.fn.jaoselect.htmlBuilder = {

		/**
		 * Render whole jaoselect widget
		 * @param settings settings for widget
		 * @param model initial <select> element
		 */
		render: function (settings, model) {

			this.settings = settings;
			this.model = model;

			var classNames = [
				'jao_select',
				this.model.attr('class'),
				(this.settings.multiple) ? 'multiple':'single',
				(this.settings.dropdown) ? 'dropdown':'list'
			];

			this.block = $(
				'<div class="' + classNames.join(' ') + '">' +
					'<div class="jao_header">' +
						'<div class="jao_arrow"></div>' +
						'<div class="jao_value"></div>' +
					'</div>' +
					this.renderOptionsList() +
				'</div>'
			).appendTo('body');
			// Sometimes model selector is in hidden or invisible block,
			// so we cannot adjust jaoselect in that place and must attach it to body,
			// then reattach in its place
			this.adjustStyle();

			$('body').detach('.jaoselect');

			return this.block;
		},

		// render html for the options
		renderOptionsList: function() {

			var self = this,
				html = '';

			this.model.find('option').each(function() {
				html += self.renderOption($(this));
			});

			return '<div class="jao_options">' + html +	'</div>';
		},

		/**
		 * render html for a single option
		 * @param option
		 */
		renderOption: function(option) {
			var attr = {
					type: this.settings.multiple? 'checkbox' : 'radio',
					value: option.val(),
					name: 'jaoselect_' + this.settings.name,
					disabled: option.attr('disabled') ? 'disabled' : '',
					'class': 'jao_option'
				},
				labelAttr = {
					'data-title': option.text(),
					'data-cls': option.attr('class') || '',
					'data-value': option.val(),
					'data-image': option.data('image'),
					'class': option.attr('disabled') ? 'disabled' : ''
				};
			// todo: extend labelAttr with option.data() array to provide custom data form options

			return '<label ' + this.renderAttributes(labelAttr) + '>' +
						'<input ' + this.renderAttributes(attr) + ' />' + this.renderLabel(option) +
					'</label>';
		},

		/**
		 * Render label for one option
		 * @param option
		 */
		renderLabel: function(option) {
			var className = option.attr('class') ? 'class="' + option.attr('class') + '"' : '',
				image = option.data('image') ? '<img src="' + option.data('image') + '" /> ' : '';

			return image + '<span ' + className + '>' + option.text() + '</span>';
		},

		/**
		 * Adjust width and height of header and dropdown list due to settings
		 */
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

		/**
		 * Adjust dropdown combobox header and options list
		 */
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

		/**
		 * Adjust options list for non-dropdown selector
		 */
		adjustListStyle: function() {
			var options = this.block.find('div.jao_options');
			options.css('height', this.settings.height + 'px');
		},

		/**
		 * Get html for given html attributes
		 * @param attr object - list of attributes and their values
		 */
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

	/**
	 * Document click handler, it is responsible for closing
	 * jaoselect dropdown list when user click somewhere else in the page
	 */
	$(document).bind('click.jaoselect', function(e) {
		$('.jao_select.dropdown').each(function() {
			// For some reasons initial select element fires "click" event when
			// clicking on jaoselect, so we exclude it
			if ($(this).data('jaoselect').model[0] == e.target)
				return;

			if (!$.contains(this, e.target)) {
				$(this).data('jaoselect').hideList();
			}
		});
	});

})(jQuery);