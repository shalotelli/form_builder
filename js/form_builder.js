/**
    New BSD License
    ===============

    Copyright (c) 2013, Sha Alibhai
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the names of the copyright holders nor the names of its
      contributors may be used to endorse or promote products derived from this
      software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
    LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
    CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
    SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
    INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
    CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
    ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
    POSSIBILITY OF SUCH DAMAGE.

    --------------------------------------------------------------------------
    USAGE
    --------------------------------------------------------------------------
    1. Either click component or drag it in to the form
    2. 'Component' becomes 'Element'
    3. When element is clicked
         a. Load options into modal box
         b. Set type to element type (text|textarea|checkbox...)
         c. Call form_builder.type.get() to load in any pre processing
         d. Wait for input.......
    4. When options are saved
         a. Call form_builder.type.set() to save options
         
    @TODO fix UI misalignment when adding component to form (caused by close button)
    @TODO input box type (password, date, email etc)
    @TODO Remove & add cancel button instead of just making it invisible
    @TODO Use minified version
*/

$(function() {
    // element options object
    var form_builder = {
        // selected element reference
        el: null,

        // form return method
        method: "POST",

        // form action
        action: "",

        // delimiter to split value from display text in option based input
        delimeter: '=',

        // set current element
        setElement: function(el) {
            this.el = el;
        },

        // get current element
        getElement: function() {
            return this.el;
        },

        // clean value to be used in name
        cleanName: function(name) {
            if (name === undefined || name.length === 0) return '';

            return name
                    .trim()
                    .replace(/ /g, '_')
                    .replace(/\W/g, '')
                    .toLowerCase();
        },

        // sanitize HTML content
        cleanContent: function(content) {
            return content
                    .replace(/\t/, '')
                    .replace(/ ui-draggable| element/gi, '')
                    .replace(/<div class="close">.<\/div>/g, '')
                    .replace(/ data-(.+)="(.+)"/g, '');
        },

        // update source code
        updateSource: function() {
            var content =   "<form method=\"" + this.method + "\" " +
                            "action=\"" + this.action + "\" " +
                            "class=\"form-horizontal\">\n" +
                            $("#content").html() +
                            "\n</form>";

            source.setValue(this.cleanContent(content));

            source.autoFormatRange(
                { line: 0, ch: 0 },
                { line: source.lastLine() + 1, ch: 0 }
            );
        },

        // add component to form
        addComponent: function(component) {
            component
            .clone()
            .removeClass('component')
            .addClass('element')
            .removeAttr('id')
            .prepend('<div class="close">&times;</div>')
            .appendTo("#content");

            $("#options_modal").modal('hide');

            this.updateSource();
        },

        // load element options
        loadOptions: function(type) {
            var $el = $(this),
                $modal = $("#options_modal"),
                content = $modal.find('.modal-body');

            // fail if no type set
            if (! type) {
                return false;
            }

            return $.get('options/' + type + '.html', function(data) {
                if (data === undefined) {
                    return false;
                }

                // set options modal type
                $modal.data('type', type);

                // load relevant options
                content.html(data);

                // set selected element to clicked element
                // this removes the need to generate unique
                // id's for every created element at they are
                // passed instead of referenced
                form_builder.setElement($el);

                // add current options into fields and do any
                // necessary preprocessing
                form_builder[type].get();

                // show options modal
                $modal.modal('show');

                return true;
            });
        },

        // form title options
        title: {
            // options class prefix
            prefix: '.options_title_',

            // get title options
            get: function() {
                var el = form_builder.getElement(),
                    legend = el.find('legend');

                $(this.prefix + 'name')
                .val(legend.text())
                .focus();
            },

            // set title options
            set: function() {
                var el = form_builder.getElement(),
                    legend = el.find('legend');

                legend.text($(this.prefix+'name').val());
            }
        },

        // text input options
        text: {
            // options class prefix
            prefix: '.options_text_',

            // get text options
            get: function() {
                var el = form_builder.getElement();

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label').text());
                $(this.prefix + 'placeholder').val(el.find('input[type=text]').attr('placeholder'));
            },

            // set text options
            set: function() {
                var el = form_builder.getElement(),
                    input = el.find('input[type=text]'),
                    label = el.find('label'),
                    name = form_builder.cleanName($(this.prefix + 'name').val());

                input.attr('name', name);

                label.text($(this.prefix + 'label').val()).attr('for', name);

                input.attr('placeholder', $(this.prefix + 'placeholder').val()).attr('id', name);
            }
        },

        // textarea options
        textarea: {
            // options class prefix
            prefix: '.options_textarea_',

            // get textarea options
            get: function() {
                var el = form_builder.getElement();

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label').text());
                $(this.prefix + 'placeholder').val(el.find('textarea').attr('placeholder'));
            },

            // set textarea options
            set: function() {
                var el = form_builder.getElement(),
                    textarea = el.find('textarea'),
                    label = el.find('label');

                textarea.attr('name', form_builder.cleanName($(this.prefix + 'name').val()));
                label.text($(this.prefix + 'label').val());
                textarea.attr('placeholder', $(this.prefix + 'placeholder').val());
            }
        },

        // basic select box options
        select_basic: {
            // options class prefix
            prefix: '.options_select_basic_',

            // get basic select options
            get: function() {
                var el = form_builder.getElement(),
                    list_options = '',
                    split = form_builder.delimeter;

                // loop through each select option
                el.find('select > option').each(function(key, val) {
                    // if value and display text are equal
                    // dont bother showing value
                    var val_and_split = form_builder.cleanName($(val).text()) == $(val).val() ?
                                        '' :
                                        ($(val).val() + split);

                    // add option to list
                    list_options += val_and_split + $(val).text()+"\n";
                });

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label').text());
                $(this.prefix + 'options').val(list_options);
            },

            // set basic select options
            set: function() {
                var el = form_builder.getElement(),
                    select = el.find('select'),
                    label = el.find('label'),
                    split = form_builder.delimeter,

                    // textarea options
                    options_blob = $(this.prefix + 'options').val(),

                    // split options by line break
                    select_options = options_blob.replace(/\r\n/, "\n").split("\n"),

                    // options buffer
                    list_options = "\n";

                // loop through each option
                $.each(select_options, function(key, val) {
                    if (val.length > 0) {
                        // if delimiter found, split val into array value -> display
                        if(val.indexOf(split) !== -1) {
                            var opt = val.split(split);

                            list_options += "<option value=\"" + opt[0] + "\">" + opt[1] + "</option>\n";
                        } else {
                            list_options += "<option value=\"" + form_builder.cleanName(val) + "\">" + val + "</option>\n";
                        }
                    }
                });

                select.attr('name', form_builder.cleanName($(this.prefix + 'name').val()));
                label.text($(this.prefix + 'label').val());
                select.html(list_options);
            }
        },

        // multi select box options
        select_multiple: {
            // options class prefix
            prefix: '.options_select_multiple_',

            // get multiple select options
            get: function() {
                var el = form_builder.getElement(),
                    list_options = '',
                    split = form_builder.delimeter;

                // loop through each select option
                el.find('select > option').each(function(key, val) {
                    // if value and display text are equal
                    // dont bother showing value
                    var val_and_split = form_builder.cleanName($(val).text()) == $(val).val() ?
                                        '' :
                                        ($(val).val() + split);

                    // add option to list
                    list_options += val_and_split + $(val).text()+"\n";
                });

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label').text());
                $(this.prefix + 'options').val(list_options);
            },

            // set multiple select options
            set: function() {
                var el = form_builder.getElement(),
                    select = el.find('select'),
                    label = el.find('label'),
                    split = form_builder.delimeter,

                    // textarea options
                    options_blob = $(this.prefix + 'options').val(),

                    // split options by line break
                    select_options = options_blob.replace(/\r\n/, "\n").split("\n"),

                    // options buffer
                    list_options = "\n";

                // loop through each option
                $.each(select_options, function(key, val) {
                    if (val.length > 0) {
                        // if delimiter found, split val into array value -> display
                        if(val.indexOf(split) !== -1) {
                            var opt = val.split(split);

                            list_options += "<option value=\"" + opt[0] + "\">" + opt[1] + "</option>\n";
                        } else {
                            list_options += "<option value=\"" + form_builder.cleanName(val) + "\">" + val + "</option>\n";
                        }
                    }
                });

                select.attr('name', form_builder.cleanName($(this.prefix + 'name').val()) + '[]');
                label.text($(this.prefix + 'label').val());
                select.html(list_options);
            }
        },

        // checkbox options
        checkbox: {
            // options class prefix
            prefix: '.options_checkbox_',

            // get checkbox options
            get: function() {
                var el = form_builder.getElement(),
                    list_options = '',
                    split = form_builder.delimeter;

                // loop through each select option
                el.find('input[type=checkbox]').each(function(key, val) {
                    // if checkbox has value that isn't just "on", show it
                    var val_and_split = $(this).val().length > 0 && $(this).val() !== 'on' ?
                                        $(this).val()+split :
                                        '';

                    list_options += val_and_split + $(this).closest('label').text().trim() + "\n";
                });

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label:first').text());
                $(this.prefix + 'options').val(list_options);
            },

            // set checkbox options
            set: function() {
                var el = form_builder.getElement(),
                    label = el.find('label:first'),
                    split = form_builder.delimeter,

                    // textarea options
                    options_blob = $(this.prefix + 'options').val(),

                    // split options by line break
                    checkbox_options = options_blob.replace(/\r\n/, "\n").split("\n"),

                    // element name
                    name = form_builder.cleanName($(this.prefix + 'name').val()),

                    // options buffer
                    list_options = "\n";

                // loop through each option
                $.each(checkbox_options, function(key, val) {
                    var id = name + '_' + key;

                    if (val.length > 0) {
                        // if delimiter found, split val into array value -> display
                        if( val.indexOf(split) !== -1) {
                            var opt = val.split(split);

                            list_options += "<div class=\"checkbox\"><label for=\"" + id + "\">\n" +
                                            "<input type=\"checkbox\" name=\"" + name + "\" " +
                                            "id=\"" + id + "\" " +
                                            "value=\"" + opt[0] + "\">\n" +
                                            opt[1] + "\n" +
                                            "</label></div>\n";
                        } else {
                            list_options += "<div class=\"checkbox\"><label for=\"" + id + "\">\n" +
                                            "<input type=\"checkbox\" name=\"" + name + "\" " +
                                            "id=\"" + id + "\" " +
                                            "value=\"" + form_builder.cleanName(val) + "\">\n" +
                                            val + "\n" +
                                            "</label></div>\n";
                        }
                    }
                });

                label.text($(this.prefix + 'label').val());
                el.find('.controls').html(list_options);
            }
        },

        // radio buttons options
        radio: {
            // options class prefix
            prefix: '.options_radio_',

            // get radio buttons options
            get: function() {
                var el = form_builder.getElement(),
                    list_options = '',
                    split = form_builder.delimeter;

                // loop through each select option
                el.find('input[type=radio]').each(function(key, val) {
                    // if radio has value that isn't just "on", show it
                    var val_and_split = $(this).val().length > 0 && $(this).val() !== 'on' ?
                                        $(this).val() + split :
                                        '';

                    list_options += val_and_split + $(this).closest('label').text().trim() + "\n";
                });

                $(this.prefix + 'name').val('');
                $(this.prefix + 'label').val(el.find('label:first').text());
                $(this.prefix + 'options').val(list_options);
            },

            // set radio button options
            set: function() {
                var el = form_builder.getElement(),
                    label = el.find('label:first'),
                    split = form_builder.delimeter,

                    // textarea options
                    options_blob = $(this.prefix + 'options').val(),

                    // split options by line break
                    radio_options = options_blob.replace(/\r\n/, "\n").split("\n"),

                    // element name
                    name = form_builder.cleanName($(this.prefix + 'name').val()),

                    // options buffer
                    list_options = "\n";

                // loop through each option
                $.each(radio_options, function(key, val) {
                    var id = name+'_'+key;

                    if (val.length > 0) {
                        // if delimiter found, split val into array value -> display
                        if (val.indexOf(split) !== -1) {
                            var opt = val.split(split);

                            list_options += "<div class=\"radio\"><label for=\"" + id + "\">\n" +
                                            "<input type=\"radio\" name=\"" + name + "\" " +
                                            "id=\"" + id + "\" " +
                                            "value=\"" + opt[0] + "\">\n" +
                                            opt[1] + "\n" +
                                            "</label></div>\n";
                        } else {
                            list_options += "<div class=\"radio\"><label for=\"" + id + "\">\n" +
                                            "<input type=\"radio\" name=\"" + name + "\" " +
                                            "id=\"" + id + "\" " +
                                            "value=\"" + form_builder.cleanName(val) + "\">\n" +
                                            val + "\n" +
                                            "</label></div>\n";
                        }
                    }
                });

                label.text($(this.prefix + 'label').val());
                el.find('.controls').html(list_options);
            }
        },

        // static text options
        static_text: {
            prefix: '.options_static_text_',

            get: function() {
                var el = form_builder.getElement();

                $(this.prefix + 'label').val(el.find('label').text());
                $(this.prefix + 'text').val(el.find('.controls').html().trim());
            },

            set: function() {
                var el = form_builder.getElement();

                el.find('label').text($(this.prefix + 'label').val());
                el.find('.controls').html($(this.prefix + 'text').val());
            }
        },

        // submit button options
        submit: {
            // options class prefix
            prefix: '.options_submit_',

            // get submit button options
            get: function() {
                var el = form_builder.getElement();

                // submit button text
                $(this.prefix + 'label').val(el.find('button[type=submit]').text());

                // get cancel button visibility
                if (el.find('button[type=button]').hasClass('hide')) {
                    $(this.prefix + 'show_cancel').val(0);
                } else {
                    $(this.prefix + 'show_cancel').val(1);
                }

                // get form_builder variables for method & action
                $(this.prefix + 'method').val(form_builder.method);
                $(this.prefix + 'action').val(form_builder.action);
            },

            // set submit button options
            set: function() {
                var el = form_builder.getElement(),
                    cancel = el.find('button[type=button]');

                el.find('button[type=submit]').text($(this.prefix+'label').val());

                // hide or show cancel button
                if ($(this.prefix+'show_cancel').val() == 1) {
                    if (cancel.hasClass('hide')) {
                        cancel.removeClass('hide');
                    }
                } else {
                    if (! cancel.hasClass('hide')) {
                        cancel.addClass('hide');
                    }
                }

                // set form_builder variables for method & action
                form_builder.method = $(this.prefix + 'method').val();
                form_builder.action = $(this.prefix + 'action').val();
            }
        }
    };

    // components are useable form elements that can be dragged or clicked
    // to add them to the form
    $(".component")
    .draggable({
        helper: function(e) {
            return $(this).clone().addClass('component-drag');
        }
    })
    .on('click', function(e) {
        form_builder.addComponent($(this));
    });

    // remove element when clicking close button
    $(document).on('click', '.element > .close', function(e) {
        e.stopPropagation();

        $(this).parent().fadeOut('normal', function() {
            $(this).remove();
        });
    });

    // elements are components that have been added to the form
    // clicking elements brings up customizable options in a
    // modal window
    $(document).on('click', '.element', function(e) {
        form_builder.loadOptions.call(this, $(this).data('type'));
    });

    // options modal save button
    $("#save_options").on('click', function() {
        var $modal = $("#options_modal"),
            content = $modal.find('.modal-body'),
            type = $modal.data('type');

        // call corresponding save method to process entered variables
        form_builder[type].set();

        $modal.modal('hide');
    });

    //prevent default behaviour of element form items
    $(document).on('click', '.element > input, .element > textarea, .element > label', function(e) {
        e.preventDefault();
    });

    // random bug makes options modal load when certain components are clicked. prevent this!
    $(".component > input, .component > textarea, .component > label, .checkbox, .radio").on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    // the form editor is a droppable area that accepts components,
    // converts them to elements and makes them sortable
    $("#content")
    .droppable({
        accept: '.component',
        hoverClass: 'content-hover',
        drop: function(e, ui) {
            form_builder.addComponent(ui.draggable);
        }
    })
    .sortable({
        placeholder: "element-placeholder",
        start: function(e, ui) {
            ui.item.popover('hide');
        }
    })
    .disableSelection();

    // the form can also be given a title by clicking the legend at the top
    // as this is not a component, do the necessary leg work and show the options
    // modal accordingly
    $("#content_form_name").on('click', function(e) {
        form_builder.loadOptions.call(this, 'title');
    });

    // create codemirror instance & assign to global var source
    source = CodeMirror.fromTextArea(document.getElementById("source"), {
        lineNumbers: true,
        tabMode: 'indent',
        mode: { name: 'htmlmixed' }
    });

    // hack to sort random bug with codemirror & bootstrap tabs not playing nicely.
    // adding a refresh after 1ms seems to sort out an issue where the source code
    // box does not display until user starts typing something
    $("a[href=#source-tab]").on('click', function(e) {
        setTimeout(function() {
            form_builder.updateSource();
            source.refresh();
        }, 1);
    });
});