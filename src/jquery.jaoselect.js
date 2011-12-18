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
		this.placeholder = this.block.find('.jao_value');
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
				this.hideList();
			}
			this.updateModel();
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

		/**
		 * View section
		 */
		toggleList: function() { this.list.toggle(); },
		openList: function() { this.list.show(); },
		hideList: function() { this.list.hide(); },

		/**
		 * Update list view: set correct class for checked labels
		 */
		updateList: function() {
			this.list.find('>label').removeClass('selected');
			this.list.find('>label:has(input:checked)').addClass('selected');
		},

		/**
		 * Update combobox header: get selected items and view them in header
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

		// render the html for the options
		renderOptionsList: function() {

			var self = this,
				html = '';

			this.model.find('option').each(function() {
				html += self.renderOption($(this));
			});

			return '<div class="jao_options">' + html +	'</div>';
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
			// todo: add "disabled" class for labels

			return '<label ' + this.renderAttributes(labelAttr) + '>' +
						'<input ' + this.renderAttributes(attr) + ' />' + this.renderLabel(option) +
					'</label>';
		},

		renderLabel: function(option) {
			var className = option.attr('class') ? 'class="' + option.attr('class') + '"' : '',
				image = option.data('image') ? '<img src="' + option.data('image') + '" /> ' : '';

			return image + '<span ' + className + '>' + option.text() + '</span>';
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

	$(document).bind('click.jaoselect', function(e) {
		$('.jaoselect.dropdown').each(function() {
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